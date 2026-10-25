const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../src/models/User');
const emailService = require('../src/services/emailService');

let sentEmail;
emailService.sendPasswordResetEmail = async (message) => {
  sentEmail = message;
};

const { forgotPassword, resetPassword, login, register } = require('../src/controllers/authController');

const createResponse = () => ({
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.payload = payload;
    return this;
  }
});

test('password recovery emails a one-time token and resets the password', async () => {
  const originalReadyState = mongoose.connection.readyState;
  const originalFindOne = User.findOne;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;
  const user = {
    email: 'student@gmail.com',
    name: 'Test Student',
    passwordHash: 'old-password-hash',
    save: async () => {}
  };
  sentEmail = null;
  mongoose.connection.readyState = 1;
  process.env.SMTP_USER = 'sender@gmail.com';
  process.env.SMTP_PASS = 'test-app-password';
  User.findOne = (filter) => {
    if (filter.email) {
      return Promise.resolve(user);
    }

    return {
      select: async () => {
        assert.equal(filter.passwordResetToken, user.passwordResetToken);
        assert.ok(filter.passwordResetExpires.$gt instanceof Date);
        return user.passwordResetExpires > new Date() ? user : null;
      }
    };
  };

  try {
    const forgotResponse = createResponse();
    await forgotPassword(
      { body: { email: ' Student@Gmail.com ' } },
      forgotResponse,
      (error) => { throw error; }
    );

    assert.equal(forgotResponse.statusCode, 200);
    assert.equal(forgotResponse.payload.resetUrl, undefined);
    assert.ok(sentEmail?.resetUrl);

    const token = new URL(sentEmail.resetUrl).pathname.split('/').pop();
    assert.equal(
      user.passwordResetToken,
      crypto.createHash('sha256').update(token).digest('hex')
    );

    const resetResponse = createResponse();
    await resetPassword(
      { params: { token }, body: { password: 'new-password-123' } },
      resetResponse,
      (error) => { throw error; }
    );

    assert.equal(resetResponse.statusCode, 200);
    assert.equal(user.passwordHash, 'new-password-123');
    assert.equal(user.passwordResetToken, undefined);
    assert.equal(user.passwordResetExpires, undefined);
  } finally {
    mongoose.connection.readyState = originalReadyState;
    User.findOne = originalFindOne;
    if (originalSmtpUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = originalSmtpUser;
    if (originalSmtpPass === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = originalSmtpPass;
  }
});

test('password recovery refuses requests when email delivery is not configured', async () => {
  const originalReadyState = mongoose.connection.readyState;
  const originalFindOne = User.findOne;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;
  mongoose.connection.readyState = 1;
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASS;
  User.findOne = async () => {
    throw new Error('Must not look up accounts before checking SMTP configuration');
  };

  try {
    const response = createResponse();
    await forgotPassword(
      { body: { email: 'student@gmail.com' } },
      response,
      (error) => { throw error; }
    );

    assert.equal(response.statusCode, 503);
    assert.match(response.payload.message, /SMTP_USER and SMTP_PASS/);
    assert.equal(response.payload.resetUrl, undefined);
  } finally {
    mongoose.connection.readyState = originalReadyState;
    User.findOne = originalFindOne;
    if (originalSmtpUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = originalSmtpUser;
    if (originalSmtpPass === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = originalSmtpPass;
  }
});

test('password recovery is unavailable when the database is disconnected', async () => {
  const originalReadyState = mongoose.connection.readyState;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;
  mongoose.connection.readyState = 0;
  process.env.SMTP_USER = 'sender@gmail.com';
  process.env.SMTP_PASS = 'test-app-password';

  try {
    const response = createResponse();
    await forgotPassword(
      { body: { email: 'student@gmail.com' } },
      response,
      (error) => { throw error; }
    );

    assert.equal(response.statusCode, 503);
    assert.match(response.payload.message, /database is disconnected/i);
    assert.equal(response.payload.resetUrl, undefined);
  } finally {
    mongoose.connection.readyState = originalReadyState;
    if (originalSmtpUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = originalSmtpUser;
    if (originalSmtpPass === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = originalSmtpPass;
  }
});

test('resetting the admin password allows admin login with the new password', async () => {
  const originalReadyState = mongoose.connection.readyState;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;
  const originalFindOne = User.findOne;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalSmtpPass = process.env.SMTP_PASS;
  const admin = {
    _id: 'admin-test-id',
    email: 'admin@gmail.com',
    name: 'Sentinel Admin',
    role: 'Admin',
    passwordHash: bcrypt.hashSync('password123', 10),
    comparePassword(password) {
      return bcrypt.compare(password, this.passwordHash);
    },
    async save() {
      if (!this.passwordHash.startsWith('$2')) {
        this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
      }
    }
  };
  mongoose.connection.readyState = 1;
  process.env.SMTP_USER = 'sender@gmail.com';
  process.env.SMTP_PASS = 'test-app-password';
  process.env.JWT_SECRET = 'test-only-jwt-secret';
  User.findOne = (filter) => {
    if (filter.email) {
      return Promise.resolve(filter.email === admin.email ? admin : null);
    }

    return {
      select: async () => (
        filter.passwordResetToken === admin.passwordResetToken &&
        admin.passwordResetExpires > new Date()
          ? admin
          : null
      )
    };
  };

  try {
    const forgotResponse = createResponse();
    await forgotPassword(
      { body: { email: admin.email } },
      forgotResponse,
      (error) => { throw error; }
    );
    assert.equal(forgotResponse.payload.resetUrl, undefined);
    assert.ok(sentEmail?.resetUrl);
    const token = new URL(sentEmail.resetUrl).pathname.split('/').pop();

    const resetResponse = createResponse();
    await resetPassword(
      { params: { token }, body: { password: 'new-admin-password-123' } },
      resetResponse,
      (error) => { throw error; }
    );
    assert.equal(resetResponse.statusCode, 200);

    const loginResponse = createResponse();
    await login(
      { body: { email: admin.email, password: 'new-admin-password-123', portalRole: 'admin' } },
      loginResponse,
      (error) => { throw error; }
    );

    assert.equal(loginResponse.statusCode, 200);
    assert.equal(loginResponse.payload.user.role, 'admin');
    assert.ok(loginResponse.payload.token);
    assert.equal(await admin.comparePassword('password123'), false);
  } finally {
    mongoose.connection.readyState = originalReadyState;
    User.findOne = originalFindOne;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalJwtSecret;
    if (originalSmtpUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = originalSmtpUser;
    if (originalSmtpPass === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = originalSmtpPass;
  }
});

test('production login and registration fail closed when MongoDB is disconnected', async () => {
  const originalReadyState = mongoose.connection.readyState;
  const originalNodeEnv = process.env.NODE_ENV;
  mongoose.connection.readyState = 0;
  process.env.NODE_ENV = 'production';

  try {
    const loginResponse = createResponse();
    await login(
      { body: { email: 'admin@gmail.com', password: 'password123', portalRole: 'admin' } },
      loginResponse,
      (error) => { throw error; }
    );
    assert.equal(loginResponse.statusCode, 503);

    const registerResponse = createResponse();
    await register(
      { body: { name: 'New Admin', email: 'new.admin@gmail.com', password: 'secure-password-123', role: 'student' } },
      registerResponse,
      (error) => { throw error; }
    );
    assert.equal(registerResponse.statusCode, 503);
  } finally {
    mongoose.connection.readyState = originalReadyState;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});
