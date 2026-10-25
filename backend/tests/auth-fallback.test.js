const test = require('node:test');
const assert = require('node:assert/strict');

const {
  clearMemoryUsers,
  registerMemoryUser,
  getMemoryUserByEmail,
  authenticateMemoryUser,
} = require('../src/controllers/authController');
const { getExams } = require('../src/controllers/examController');

test('memory fallback stores new student users and allows login without MongoDB', () => {
  clearMemoryUsers();

  const registered = registerMemoryUser({
    name: 'New Student',
    email: 'student@gmail.com',
    password: 'Password123',
    role: 'Student'
  });

  assert.equal(registered.role, 'student');
  assert.equal(getMemoryUserByEmail('student@gmail.com')?.email, 'student@gmail.com');
  assert.equal(authenticateMemoryUser('student@gmail.com', 'Password123')?.user.role, 'student');
});

test('memory fallback accepts the default admin credentials without MongoDB', () => {
  clearMemoryUsers();

  const result = authenticateMemoryUser('admin@gmail.com', 'password123', 'admin');

  assert.ok(result);
  assert.equal(result.user.role, 'admin');
  assert.equal(result.user.email, 'admin@gmail.com');
});

test('memory fallback includes Gmail-based student accounts that can log in without MongoDB', () => {
  clearMemoryUsers();

  registerMemoryUser({ name: 'Alex Mercer', email: 'student1@gmail.com', password: 'password123', role: 'Student' });
  registerMemoryUser({ name: 'Priya Nair', email: 'student2@gmail.com', password: 'password123', role: 'Student' });

  const student1 = authenticateMemoryUser('student1@gmail.com', 'password123', 'student');
  const student2 = authenticateMemoryUser('student2@gmail.com', 'password123', 'student');

  assert.ok(student1);
  assert.ok(student2);
  assert.equal(student1.user.email, 'student1@gmail.com');
  assert.equal(student1.user.role, 'student');
  assert.equal(student2.user.email, 'student2@gmail.com');
  assert.equal(student2.user.role, 'student');
});

test('degraded mode still returns a usable exam list for students', async () => {
  const req = { user: { role: 'Student' } };
  const res = {
    statusCode: null,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };

  await getExams(req, res);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body.data.exams));
  assert.ok(res.body.data.exams.length > 0);
  assert.equal(res.body.data.exams[0].title.includes('AWS'), true);
});
