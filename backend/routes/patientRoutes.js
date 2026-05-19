const router = require('express').Router();
const c = require('../controllers/patientController');
const { authRequired, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const patientCreateSchema = [
  { field: 'full_name', required: true, type: 'string', min: 2, max: 120, label: 'F.I.SH' },
  { field: 'age',       type: 'int', min: 0, max: 130, label: 'Yosh' },
  { field: 'gender',    in: ['male','female','other'], label: 'Jinsi' },
  { field: 'doctor_id', type: 'int', label: 'Shifokor' },
];

const patientUpdateSchema = [
  { field: 'full_name', type: 'string', min: 2, max: 120, label: 'F.I.SH' },
  { field: 'age',       type: 'int', min: 0, max: 130, label: 'Yosh' },
  { field: 'gender',    in: ['male','female','other'], label: 'Jinsi' },
  { field: 'doctor_id', type: 'int', label: 'Shifokor' },
];

router.use(authRequired);

router.get('/',         c.list);
router.get('/:id',      c.getOne);
// Admin and Receptionist can register patients
router.post('/',        requireRole('admin','receptionist'), validate(patientCreateSchema), c.create);
// Admin, Clinician, Receptionist can update
router.put('/:id',      requireRole('admin','clinician','receptionist'), validate(patientUpdateSchema), c.update);
router.delete('/:id',   requireRole('admin'), c.remove);

module.exports = router;
