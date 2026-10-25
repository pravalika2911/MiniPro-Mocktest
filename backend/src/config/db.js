const mongoose = require('mongoose');
const User = require('../models/User');

const FALLBACK_URI = 'mongodb://127.0.0.1:27017/mock-test-platform';

mongoose.set('bufferCommands', false);

let reconnectTimer = null;
let connectionAttempt = null;

const isDatabaseConnected = () => mongoose.connection.readyState === 1;

const scheduleReconnect = () => {
  if (reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectDB();
  }, 10000);
  reconnectTimer.unref?.();
};

const seedDefaultUsers = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
      const legacyAdmin = await User.findOne({ email: 'admin@gmail.com', role: 'Admin' });
      const demoStudentEmails = ['student1@gmail.com', 'student2@gmail.com'];

      for (const email of demoStudentEmails) {
        const demoStudent = await User.findOne({ email, role: 'Student' });
        if (demoStudent && await demoStudent.comparePassword('password123')) {
          await User.deleteOne({ _id: demoStudent._id });
        }
      }

      let configuredAdmin = await User.findOne({ email: adminEmail });
      if (legacyAdmin && await legacyAdmin.comparePassword('password123')) {
        if (adminEmail === legacyAdmin.email.toLowerCase()) {
          legacyAdmin.passwordHash = process.env.ADMIN_PASSWORD;
          await legacyAdmin.save();
          configuredAdmin = legacyAdmin;
        } else {
          await User.deleteOne({ _id: legacyAdmin._id });
        }
      }

      if (!configuredAdmin) {
        await User.create({
          name: 'Sentinel Admin',
          email: adminEmail,
          passwordHash: process.env.ADMIN_PASSWORD,
          role: 'Admin'
        });
      } else if (configuredAdmin.role !== 'Admin') {
        configuredAdmin.role = 'Admin';
        if (await configuredAdmin.comparePassword('password123')) {
          configuredAdmin.passwordHash = process.env.ADMIN_PASSWORD;
        }
        await configuredAdmin.save();
      }
      return;
    }

    const defaults = [
      { name: 'Sentinel Admin', email: 'admin@gmail.com', passwordHash: 'password123', role: 'Admin' },
      { name: 'Alex Mercer', email: 'student1@gmail.com', passwordHash: 'password123', role: 'Student' },
      { name: 'Priya Nair', email: 'student2@gmail.com', passwordHash: 'password123', role: 'Student' }
    ];

    for (const user of defaults) {
      const existing = await User.findOne({ email: user.email });
      if (!existing) {
        await User.create(user);
      }
    }
  } catch (error) {
    console.warn('⚠️ [DATABASE] Default accounts could not be seeded.');
    console.warn(error.message);
    if (process.env.NODE_ENV === 'production') throw error;
  }
};

const connectDB = async () => {
  if (connectionAttempt) {
    return connectionAttempt;
  }

  const mongoUri = process.env.MONGODB_URI || FALLBACK_URI;

  connectionAttempt = mongoose.connect(mongoUri, {
    family: 4,
    serverSelectionTimeoutMS: 5000,
  }).then(async (conn) => {
    console.log('🚀 [DATABASE] Connected successfully!');
    console.log(`📍 Host: ${conn.connection.host}`);
    console.log(`📁 DB: ${conn.connection.name}`);

    await seedDefaultUsers();
    return conn;
  }).catch((error) => {
    console.warn('[DATABASE] Connection failed. Will retry in 10 seconds.');
    console.warn(`Reason: ${error.name}${error.code ? ` (${error.code})` : ''}`);
    scheduleReconnect();
    return null;
  }).finally(() => {
    connectionAttempt = null;
  });

  return connectionAttempt;
};

module.exports = connectDB;
module.exports.isDatabaseConnected = isDatabaseConnected;
module.exports.seedDefaultUsers = seedDefaultUsers;
