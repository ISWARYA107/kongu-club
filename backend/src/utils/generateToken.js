const jwt = require('jsonwebtoken');

// payload: { id, role } where role is 'admin' | 'coordinator' | 'student'
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

module.exports = generateToken;
