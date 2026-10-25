const test = require('node:test');
const assert = require('node:assert/strict');
const nodemailer = require('nodemailer');
const { sendPasswordResetEmail } = require('../src/services/emailService');

test('password recovery reports missing Gmail credentials without attempting delivery', async () => {
  const originalUser = process.env.SMTP_USER;
  const originalPassword = process.env.SMTP_PASS;
  const originalCreateTransport = nodemailer.createTransport;
  process.env.SMTP_USER = '';
  process.env.SMTP_PASS = '';
  nodemailer.createTransport = () => {
    throw new Error('SMTP transport must not be created without credentials');
  };

  try {
    await assert.rejects(
      sendPasswordResetEmail({
        email: 'student@gmail.com',
        name: 'Student',
        resetUrl: 'http://localhost:5173/reset-password/test-token'
      }),
      (error) => error.statusCode === 503 && /SMTP_USER and SMTP_PASS/.test(error.message)
    );
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    if (originalUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = originalUser;
    if (originalPassword === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = originalPassword;
  }
});

test('password reset email uses Gmail SMTP defaults and sends the reset link', async () => {
  const originalEnv = {
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM
  };
  const originalCreateTransport = nodemailer.createTransport;
  let transportOptions;
  let message;
  process.env.SMTP_USER = 'sender@gmail.com';
  process.env.SMTP_PASS = ' test app password ';
  delete process.env.SMTP_HOST;
  delete process.env.SMTP_PORT;
  delete process.env.SMTP_FROM;
  nodemailer.createTransport = (options) => {
    transportOptions = options;
    return { sendMail: async (outgoingMessage) => { message = outgoingMessage; } };
  };

  try {
    await sendPasswordResetEmail({
      email: 'student@gmail.com',
      name: 'Student',
      resetUrl: 'http://localhost:5173/reset-password/test-token'
    });

    assert.equal(transportOptions.host, 'smtp.gmail.com');
    assert.equal(transportOptions.port, 587);
    assert.equal(transportOptions.secure, false);
    assert.equal(transportOptions.auth.user, 'sender@gmail.com');
    assert.equal(transportOptions.auth.pass, 'testapppassword');
    assert.equal(message.from, 'sender@gmail.com');
    assert.equal(message.to, 'student@gmail.com');
    assert.match(message.text, /http:\/\/localhost:5173\/reset-password\/test-token/);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('password reset delivery errors are logged safely and returned generically', async () => {
  const originalUser = process.env.SMTP_USER;
  const originalPassword = process.env.SMTP_PASS;
  const originalCreateTransport = nodemailer.createTransport;
  const originalConsoleError = console.error;
  let logOutput;
  process.env.SMTP_USER = 'sender@gmail.com';
  process.env.SMTP_PASS = 'test-app-password';
  nodemailer.createTransport = () => ({
    sendMail: async () => {
      const error = new Error('Rejected for sender@gmail.com');
      error.code = 'EENVELOPE';
      error.responseCode = 550;
      error.command = 'RCPT TO';
      throw error;
    }
  });
  console.error = (...args) => { logOutput = args; };

  try {
    await assert.rejects(
      sendPasswordResetEmail({
        email: 'student@gmail.com',
        name: 'Student',
        resetUrl: 'https://example.test/reset-password/token'
      }),
      (error) => error.statusCode === 503 &&
        error.message === 'Password recovery email could not be delivered. Check the SMTP configuration.'
    );
    assert.equal(logOutput[0], '[MAIL] Password reset email delivery failed.');
    assert.deepEqual(logOutput[1], {
      code: 'EENVELOPE',
      responseCode: 550,
      command: 'RCPT TO'
    });
    assert.equal(JSON.stringify(logOutput).includes('sender@gmail.com'), false);
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    console.error = originalConsoleError;
    if (originalUser === undefined) delete process.env.SMTP_USER;
    else process.env.SMTP_USER = originalUser;
    if (originalPassword === undefined) delete process.env.SMTP_PASS;
    else process.env.SMTP_PASS = originalPassword;
  }
});
