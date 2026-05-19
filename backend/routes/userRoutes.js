const router = require('express').Router();
const c = require('../controllers/userController');
const { authRequired, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

router.use(authRequired, requireRole('admin'));

router.get('/',      c.list);
router.get('/:id',   c.getOne);
router.post('/',
  validate([
    { field: 'full_name', required: true, type: 'string', min: 2, max: 120, label: 'F.I.SH' },
    { field: 'email',     required: true, type: 'email',  label: 'Email' },
    { field: 'password',  required: true, type: 'string', min: 6, label: 'Parol' },
    { field: 'role',      required: true, in: ['admin','clinician','receptionist'], label: 'Rol' },
  ]),
  c.create
);
router.put('/:id',
  validate([
    { field: 'email', type: 'email', label: 'Email' },
    { field: 'role',  in: ['admin','clinician','receptionist'], label: 'Rol' },
    { field: 'status',in: ['active','inactive'], label: 'Holat' },
  ]),
  c.update
);
router.delete('/:id', c.remove);

module.exports = router;
