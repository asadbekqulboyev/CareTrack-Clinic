const router = require('express').Router();
const c = require('../controllers/doctorController');
const { authRequired, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const doctorSchema = [
  { field: 'full_name',        required: true, type: 'string', min: 2, max: 120, label: 'F.I.SH' },
  { field: 'specialty',        required: true, type: 'string', min: 2, max: 120, label: 'Mutaxassislik' },
  { field: 'department',       required: true, type: 'string', min: 2, max: 120, label: 'Bo\'lim' },
  { field: 'email',            type: 'email',  label: 'Email' },
  { field: 'experience_years', type: 'int', min: 0, max: 70, label: 'Tajriba (yil)' },
  { field: 'availability',     in: ['available','busy','on_leave'], label: 'Holati' },
];

router.use(authRequired);

router.get('/',                    c.list);
router.get('/departments/list',    c.departments);
router.get('/:id',                 c.getOne);
router.post('/',                   requireRole('admin'),               validate(doctorSchema), c.create);
router.put('/:id',                 requireRole('admin'),               validate(doctorSchema), c.update);
router.delete('/:id',              requireRole('admin'),               c.remove);

module.exports = router;
