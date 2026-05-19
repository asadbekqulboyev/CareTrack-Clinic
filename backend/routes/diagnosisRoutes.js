const router = require('express').Router();
const c = require('../controllers/diagnosisController');
const { authRequired, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const diagSchema = [
  { field: 'patient_id', required: true, type: 'int',    label: 'Bemor' },
  { field: 'icd_code',   required: true, type: 'string', min: 1, max: 20, label: 'ICD kodi' },
  { field: 'title',      required: true, type: 'string', min: 2, max: 180, label: 'Tashxis nomi' },
  { field: 'severity',   in: ['mild','moderate','severe','critical'], label: 'Daraja' },
];

router.use(authRequired);

router.get('/',        c.list);
router.get('/:id',     c.getOne);
// Admin & Clinician manage diagnoses
router.post('/',       requireRole('admin','clinician'), validate(diagSchema), c.create);
router.put('/:id',     requireRole('admin','clinician'), validate(diagSchema), c.update);
router.delete('/:id',  requireRole('admin','clinician'), c.remove);

module.exports = router;
