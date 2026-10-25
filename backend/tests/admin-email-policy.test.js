const test = require('node:test');
const assert = require('node:assert/strict');

const { isGmailAddress } = require('../src/controllers/authController');

test('admin email policy accepts Gmail addresses and rejects non-Gmail domains', () => {
  assert.equal(isGmailAddress('admin@gmail.com'), true);
  assert.equal(isGmailAddress('admin@sentinel.edu'), false);
  assert.equal(isGmailAddress('admin@outlook.com'), false);
  assert.equal(isGmailAddress('  admin@gmail.com  '), true);
});
