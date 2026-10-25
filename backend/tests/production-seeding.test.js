const test = require('node:test');
const assert = require('node:assert/strict');
const User = require('../src/models/User');
const { seedDefaultUsers } = require('../src/config/db');

test('production seeding removes untouched demo accounts and creates the configured admin', async () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalAdminEmail = process.env.ADMIN_EMAIL;
  const originalAdminPassword = process.env.ADMIN_PASSWORD;
  const originalFindOne = User.findOne;
  const originalDeleteOne = User.deleteOne;
  const originalCreate = User.create;
  const users = new Map([
    ['admin@gmail.com', { _id: 'old-admin', email: 'admin@gmail.com', role: 'Admin', passwordHash: 'password123' }],
    ['student1@gmail.com', { _id: 'demo-one', email: 'student1@gmail.com', role: 'Student', passwordHash: 'password123' }],
    ['student2@gmail.com', { _id: 'demo-two', email: 'student2@gmail.com', role: 'Student', passwordHash: 'password123' }]
  ]);

  for (const user of users.values()) {
    user.comparePassword = async (password) => user.passwordHash === password;
  }

  process.env.NODE_ENV = 'production';
  process.env.ADMIN_EMAIL = 'secure.admin@gmail.com';
  process.env.ADMIN_PASSWORD = 'different-strong-password';
  User.findOne = async ({ email, role }) => {
    const user = users.get(email);
    return user && (!role || user.role === role) ? user : null;
  };
  User.deleteOne = async ({ _id }) => {
    for (const [email, user] of users) {
      if (user._id === _id) users.delete(email);
    }
  };
  User.create = async (user) => {
    users.set(user.email, user);
  };

  try {
    await seedDefaultUsers();

    assert.deepEqual([...users.keys()], ['secure.admin@gmail.com']);
    assert.equal(users.get('secure.admin@gmail.com').passwordHash, 'different-strong-password');
    assert.equal(users.get('secure.admin@gmail.com').role, 'Admin');
  } finally {
    User.findOne = originalFindOne;
    User.deleteOne = originalDeleteOne;
    User.create = originalCreate;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
    if (originalAdminEmail === undefined) delete process.env.ADMIN_EMAIL;
    else process.env.ADMIN_EMAIL = originalAdminEmail;
    if (originalAdminPassword === undefined) delete process.env.ADMIN_PASSWORD;
    else process.env.ADMIN_PASSWORD = originalAdminPassword;
  }
});
