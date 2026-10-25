const User = require('../models/User');
const asyncHandler = require('../middlewares/asyncHandler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { isDatabaseConnected } = require('../config/db');
const { sendPasswordResetEmail, isSmtpConfigured } = require('../services/emailService');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'password123';
const memoryUsers = new Map();

const seedMemoryUsers = () => {
  memoryUsers.clear();
  memoryUsers.set(ADMIN_EMAIL.toLowerCase(), {
    _id: 'memory-admin',
    name: 'Sentinel Admin',
    email: ADMIN_EMAIL,
    passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
    role: 'admin'
  });

  [
    { name: 'Alex Mercer', email: 'student1@gmail.com', role: 'student' },
    { name: 'Priya Nair', email: 'student2@gmail.com', role: 'student' }
  ].forEach((student) => {
    memoryUsers.set(String(student.email).trim().toLowerCase(), {
      _id: `memory-${student.email.replace(/[^a-z0-9]/gi, '')}`,
      name: student.name,
      email: String(student.email).trim().toLowerCase(),
      passwordHash: bcrypt.hashSync(ADMIN_PASSWORD, 10),
      role: String(student.role).toLowerCase()
    });
  });
};

const clearMemoryUsers = () => memoryUsers.clear();

const getMemoryUserByEmail = (email = '') => {
  const normalized = String(email).trim().toLowerCase();
  return memoryUsers.get(normalized) || null;
};

const getMemoryUserById = (id = '') => {
  const normalizedId = String(id).trim();
  if (!normalizedId) return null;
  for (const user of memoryUsers.values()) {
    if (user._id === normalizedId) {
      return user;
    }
  }
  return null;
};

const registerMemoryUser = ({ name, email, password, role = 'Student' }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  if (!name || !normalizedEmail || !password) {
    throw new Error('Please provide all required fields');
  }

  if (memoryUsers.has(normalizedEmail)) {
    throw new Error('Email is already registered');
  }

  const requestedRole = String(role || 'Student').toLowerCase();
  if (requestedRole === 'admin') {
    throw new Error('Admin registration is disabled. Only the single system admin account may log in.');
  }

  const user = {
    _id: `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(name).trim(),
    email: normalizedEmail,
    passwordHash: bcrypt.hashSync(String(password), 10),
    role: 'student'
  };

  memoryUsers.set(normalizedEmail, user);
  return user;
};

const authenticateMemoryUser = (email = '', password = '', portalRole = null) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = getMemoryUserByEmail(normalizedEmail);
  if (!user) {
    if (normalizedEmail === ADMIN_EMAIL && String(password) === ADMIN_PASSWORD) {
      return {
        user: {
          id: 'system-admin',
          name: 'Sentinel Admin',
          email: ADMIN_EMAIL,
          role: 'admin'
        }
      };
    }
    return null;
  }

  const isMatch = bcrypt.compareSync(String(password), user.passwordHash);
  if (!isMatch) {
    return null;
  }

  const roleLowerCase = String(user.role).toLowerCase();

  if (portalRole === 'admin' && roleLowerCase !== 'admin') {
    return { error: 'Insufficient clearance for Administrative Access.' };
  }

  if (roleLowerCase === 'admin' && (normalizedEmail !== ADMIN_EMAIL || !isGmailAddress(normalizedEmail))) {
    return { error: 'Only the configured system admin account can access Admin Node.' };
  }

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: roleLowerCase
    }
  };
};

seedMemoryUsers();

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const isGmailAddress = (email = '') => /@gmail\.com$/i.test(String(email).trim());

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ status: 'error', message: 'Please provide all required fields' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!isGmailAddress(normalizedEmail)) {
    return res.status(403).json({ status: 'error', message: 'Only Gmail addresses are allowed for registration.' });
  }

  if (!isDatabaseConnected()) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ status: 'error', message: 'Registration is unavailable while the database is disconnected.' });
    }

    try {
      const user = registerMemoryUser({ name, email: normalizedEmail, password, role });
      const token = generateToken(user._id, user.role);

      return res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('disabled') ? 403 : 400;
      return res.status(statusCode).json({ status: 'error', message: error.message });
    }
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return res.status(400).json({ status: 'error', message: 'Email is already registered' });
  }

  const requestedRole = (role || 'Student').toLowerCase();

  if (requestedRole === 'admin') {
    return res.status(403).json({ status: 'error', message: 'Admin registration is disabled. Only the single system admin account may log in.' });
  }

  const userRole = 'Student';

  if (email && isGmailAddress(email) && email.toLowerCase() !== ADMIN_EMAIL && requestedRole === 'admin') {
    return res.status(403).json({ status: 'error', message: 'Admin registration is disabled. Only the single system admin account may log in.' });
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: password,
    role: userRole
  });

  const token = generateToken(user._id, user.role.toLowerCase());

  res.status(201).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role.toLowerCase()
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password, portalRole } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Please provide email and password' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  if (!isGmailAddress(normalizedEmail)) {
    return res.status(403).json({ message: 'Only Gmail addresses are allowed to register and log in.' });
  }

  if (!isDatabaseConnected()) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ status: 'error', message: 'Login is unavailable while the database is disconnected.' });
    }

    const memoryAuth = authenticateMemoryUser(normalizedEmail, password, portalRole);

    if (!memoryAuth || memoryAuth.error) {
      const message = memoryAuth?.error || 'Invalid credentials. Authorization denied.';
      const statusCode = memoryAuth?.error && memoryAuth.error.includes('Insufficient') ? 403 : 401;
      return res.status(statusCode).json({ message });
    }

    const token = generateToken(memoryAuth.user.id, memoryAuth.user.role);
    return res.status(200).json({
      token,
      user: memoryAuth.user
    });
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials. Authorization denied.' });
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({ message: 'Invalid credentials. Authorization denied.' });
  }

  const roleLowerCase = user.role.toLowerCase();

  if (portalRole === 'admin' && roleLowerCase !== 'admin') {
    return res.status(403).json({ message: 'Insufficient clearance for Administrative Access.' });
  }

  if (roleLowerCase === 'admin' && (normalizedEmail !== ADMIN_EMAIL || !isGmailAddress(normalizedEmail))) {
    return res.status(403).json({ message: 'Only the configured system admin account can access Admin Node.' });
  }

  const token = generateToken(user._id, roleLowerCase);

  res.status(200).json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: roleLowerCase
    }
  });
});

// @desc    Forgot password request
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ status: 'error', message: 'Please provide an email address' });
  }

  if (!isSmtpConfigured()) {
    return res.status(503).json({
      status: 'error',
      message: 'Password recovery email is not configured. Set SMTP_USER and SMTP_PASS in backend/.env.'
    });
  }

  const clientUrl = process.env.CLIENT_URL || (
    process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : ''
  );
  if (!clientUrl) {
    return res.status(503).json({
      status: 'error',
      message: 'Password recovery is not configured. Set CLIENT_URL to the public frontend URL.'
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!isDatabaseConnected()) {
    return res.status(503).json({
      status: 'error',
      message: 'Password recovery is unavailable while the database is disconnected.'
    });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() });
  if (!user) {
    return res.status(200).json({
      status: 'success',
      message: 'If an account exists with that email, a reset link has been sent.'
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${clientUrl.replace(/\/+$/, '')}/reset-password/${resetToken}`;

  try {
    await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    try {
      await user.save();
    } catch {
      console.error('[AUTH] Could not clear an undelivered password reset token.');
    }
    throw error;
  }

  res.status(200).json({
    status: 'success',
    message: 'If an account exists with that email, a reset link has been sent.'
  });
});

// @desc    Reset password using a one-time email token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (typeof token !== 'string' || !token || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid reset token and password of at least 8 characters are required.'
    });
  }

  if (!isDatabaseConnected()) {
    return res.status(503).json({
      status: 'error',
      message: 'Password recovery is unavailable while the database is disconnected.'
    });
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: new Date() }
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    return res.status(400).json({
      status: 'error',
      message: 'Reset link is invalid or has expired.'
    });
  }

  user.passwordHash = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    status: 'success',
    message: 'Password has been reset successfully.'
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
});

exports.isGmailAddress = isGmailAddress;
exports.ADMIN_EMAIL = ADMIN_EMAIL;
exports.ADMIN_PASSWORD = ADMIN_PASSWORD;
exports.clearMemoryUsers = clearMemoryUsers;
exports.getMemoryUserByEmail = getMemoryUserByEmail;
exports.getMemoryUserById = getMemoryUserById;
exports.registerMemoryUser = registerMemoryUser;
exports.authenticateMemoryUser = authenticateMemoryUser;
