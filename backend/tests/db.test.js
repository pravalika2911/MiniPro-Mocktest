const test = require('node:test');
const assert = require('node:assert/strict');

const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const server = require('../server');
const { startExam } = require('../src/controllers/sessionController');

test('connectDB should recover from an invalid Mongo connection without crashing the process', async () => {
  const originalUri = process.env.MONGODB_URI;
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:65535/invalid-db';

  try {
    const result = await connectDB();
    assert.ok(
      result === null || result.connection || typeof result === 'boolean',
      'connectDB should return a connection result or null instead of exiting the process'
    );
  } finally {
    process.env.MONGODB_URI = originalUri;
  }
});

test('degraded mode should allow protected admin routes to pass through the database guard', () => {
  assert.equal(typeof server.shouldAllowRouteWithoutDatabase, 'function');
  assert.equal(server.shouldAllowRouteWithoutDatabase('/api/admin/dashboard'), true);
  assert.equal(server.shouldAllowRouteWithoutDatabase('/api/admin/sessions'), true);
  assert.equal(server.shouldAllowRouteWithoutDatabase('/api/auth/login'), true);
});

test('fallback exam IDs should start a degraded-mode session without hitting Mongo ObjectId casting', async () => {
  const dbModule = require('../src/config/db');
  const original = dbModule.isDatabaseConnected;
  dbModule.isDatabaseConnected = () => true;

  delete require.cache[require.resolve('../src/controllers/sessionController')];
  const { startExam } = require('../src/controllers/sessionController');

  try {
    const req = {
      body: { examId: 'fallback-python' },
      user: { id: 'student-123' }
    };
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.payload = payload;
        return this;
      }
    };

    await startExam(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.payload.status, 'success');
    assert.equal(res.payload.data.session.examId, 'fallback-python');
  } finally {
    dbModule.isDatabaseConnected = original;
    delete require.cache[require.resolve('../src/controllers/sessionController')];
  }
});

test('live database should seed default admin and student accounts for login', async () => {
  const admin = await User.findOne({ email: 'admin@gmail.com' });
  const student = await User.findOne({ email: 'student1@gmail.com' });

  assert.ok(admin, 'Admin user should exist after DB initialization');
  assert.ok(student, 'Student user should exist after DB initialization');
  assert.equal(admin.role, 'Admin');
  assert.equal(student.role, 'Student');
});
