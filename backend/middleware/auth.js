const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

/**
 * Verify JWT and attach req.user
 */
function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Avtorizatsiya talab qilinadi' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, full_name }
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Yaroqsiz yoki muddati o\'tgan token' });
  }
}

/**
 * Restrict route to specific roles
 * Usage: requireRole('admin'), requireRole('admin','clinician')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Avtorizatsiya talab qilinadi' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Ushbu amalga ruxsat yo\'q' });
    }
    next();
  };
}

module.exports = { authRequired, requireRole, JWT_SECRET };
