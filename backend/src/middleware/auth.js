const jwt = require('jsonwebtoken');

// Verifies the Bearer token and attaches { id, role } to req.user
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session expired. Please log in again.' });
  }
}

// Restricts a route to one or more roles, e.g. authorize('admin') or authorize('admin', 'coordinator')
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You do not have access to this resource.' });
    }
    next();
  };
}

// Makes sure a logged-in coordinator/student can only act on their own data,
// e.g. GET /api/student/my-clubs/:studentId must have studentId === req.user.id
function ownResourceOnly(paramName) {
  return (req, res, next) => {
    if (req.params[paramName] !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You can only access your own data.' });
    }
    next();
  };
}

module.exports = { authenticate, authorize, ownResourceOnly };
