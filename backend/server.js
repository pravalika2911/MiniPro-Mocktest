require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./src/config/db');
const { isDatabaseConnected } = require('./src/config/db');
const { initSocket } = require('./src/config/socket');
const getClientOrigin = require('./src/config/clientOrigin');

const app = express();
const server = http.createServer(app);

const publicRoutes = [
  '/api/status',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/me'
];

const degradedModeAllowedRoutes = [
  '/api/exams',
  '/api/sessions',
  '/api/sessions/start',
  '/api/admin/dashboard',
  '/api/admin/sessions',
  '/api/admin/sessions/:id/warn',
  '/api/admin/sessions/:id/terminate'
];

const shouldAllowRouteWithoutDatabase = (routePath = '') => {
  const normalizedPath = String(routePath || '').split('?')[0].replace(/\/+$/, '') || '/';

  if (!normalizedPath || normalizedPath === '/') {
    return false;
  }

  if (publicRoutes.includes(normalizedPath)) {
    return true;
  }

  if (degradedModeAllowedRoutes.includes(normalizedPath)) {
    return true;
  }

  return normalizedPath.startsWith('/api/admin') || normalizedPath.startsWith('/api/exams') || normalizedPath.startsWith('/api/sessions');
};

// Initialize Socket.io
const io = initSocket(server);

// High-Range Security Middlewares
app.use(helmet()); // Sets various HTTP headers for security
app.use(cors({
  origin: getClientOrigin(),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 login/register requests per window
  message: { status: 'error', message: 'Excessive authorization attempts. IP temporarily restricted.' }
});

app.use(express.json()); // Parses incoming JSON payloads

app.use((req, res, next) => {
  if (shouldAllowRouteWithoutDatabase(req.path)) {
    return next();
  }

  if (!isDatabaseConnected()) {
    return res.status(503).json({
      status: 'error',
      message: 'Database unavailable. Please try again later.'
    });
  }

  next();
});

// Route files
const authRoutes = require('./src/routes/authRoutes');
const examRoutes = require('./src/routes/examRoutes');
const sessionRoutes = require('./src/routes/sessionRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Mount routers with rate limiting on auth
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/admin', adminRoutes);

// Basic test route requested
app.get('/api/status', (req, res) => {
  res.json({
    status: 'Server is running',
    database: isDatabaseConnected() ? 'connected' : 'disconnected'
  });
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: 'API route not found',
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  const validateProductionConfig = () => {
    if (process.env.NODE_ENV !== 'production') return;

    const missing = ['MONGODB_URI', 'JWT_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'SMTP_USER', 'SMTP_PASS', 'CLIENT_URL']
      .filter((name) => !process.env[name]?.trim());
    if (missing.length) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
    }

    if (process.env.JWT_SECRET.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters in production.');
    }
    if (process.env.ADMIN_PASSWORD.length < 12 || process.env.ADMIN_PASSWORD === 'password123') {
      throw new Error('ADMIN_PASSWORD must be a non-default password of at least 12 characters in production.');
    }
    if (!/^[^\s@]+@gmail\.com$/i.test(process.env.ADMIN_EMAIL.trim())) {
      throw new Error('ADMIN_EMAIL must be a valid Gmail address.');
    }

    let clientUrl;
    try {
      clientUrl = new URL(process.env.CLIENT_URL);
    } catch {
      throw new Error('CLIENT_URL must be a valid public frontend URL.');
    }
    if (clientUrl.protocol !== 'https:' || ['localhost', '127.0.0.1'].includes(clientUrl.hostname)) {
      throw new Error('CLIENT_URL must use HTTPS and cannot point to localhost in production.');
    }
  };

  try {
    validateProductionConfig();
    connectDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`[STARTUP] ${error.message}`);
    process.exitCode = 1;
  }
} else {
  connectDB();
}

module.exports = {
  app,
  server,
  shouldAllowRouteWithoutDatabase
};
