const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const getClientOrigin = require('./clientOrigin');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: getClientOrigin(),
      methods: ["GET", "POST"]
    }
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-passwordHash');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[SOCKET] User connected: ${socket.user.name} (${socket.id})`);

    socket.on('join_exam_session', (sessionId) => {
      socket.join(`session_${sessionId}`);
      console.log(`[SOCKET] User ${socket.user.name} joined room: session_${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[SOCKET] User disconnected: ${socket.id}`);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
