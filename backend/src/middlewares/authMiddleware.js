const jwt = require('jsonwebtoken');
const asyncHandler = require('./asyncHandler');
const User = require('../models/User');
const { isDatabaseConnected } = require('../config/db');
const { getMemoryUserById } = require('../controllers/authController');

exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (process.env.NODE_ENV === 'production' && !isDatabaseConnected()) {
      return res.status(503).json({
        status: 'error',
        message: 'Authentication is unavailable while the database is disconnected.'
      });
    }

    if (process.env.NODE_ENV === 'production' && decoded.id === 'system-admin') {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized, token failed'
      });
    }

    if (decoded.id === 'system-admin' || (decoded.role === 'admin' && !isDatabaseConnected())) {
      req.user = {
        _id: 'system-admin',
        name: 'Sentinel Admin',
        email: process.env.ADMIN_EMAIL || 'admin@gmail.com',
        role: 'Admin'
      };
      return next();
    }

    if (!isDatabaseConnected()) {
      const fallbackUser = getMemoryUserById(decoded.id);
      if (fallbackUser) {
        req.user = {
          _id: fallbackUser._id,
          name: fallbackUser.name,
          email: fallbackUser.email,
          role: fallbackUser.role.charAt(0).toUpperCase() + fallbackUser.role.slice(1)
        };
        return next();
      }
    }

    req.user = await User.findById(decoded.id).select('-passwordHash');
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'User belonging to token no longer exists' });
    }
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Not authorized, token failed' });
  }
});

exports.authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role.toLowerCase();
    const authorizedRoles = roles.map(r => r.toLowerCase());
    
    if (!authorizedRoles.includes(userRole)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};
