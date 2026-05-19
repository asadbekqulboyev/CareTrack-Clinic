const router = require('express').Router();
const c = require('../controllers/authController');
const { authRequired, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.post('/login',
  validate([
    { field: 'email',    required: true, type: 'email',  label: 'Email' },
    { field: 'password', required: true, type: 'string', min: 6, label: 'Parol' },
  ]),
  c.login
);

// Only admin can register new users via auth/register; for self-signup remove role check.
router.post('/register',
  authRequired,
  requireRole('admin'),
  validate([
    { field: 'full_name', required: true, type: 'string', min: 2, max: 120, label: 'F.I.SH' },
    { field: 'email',     required: true, type: 'email',  label: 'Email' },
    { field: 'password',  required: true, type: 'string', min: 6, label: 'Parol' },
    { field: 'role',      required: true, in: ['admin','clinician','receptionist'], label: 'Rol' },
  ]),
  c.register
);

router.get('/me', authRequired, c.me);

module.exports = router;
