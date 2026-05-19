const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');

exports.list = async (req, res, next) => {
  try {
    const data = await Patient.findAll(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'Bemor topilmadi' });
    const diagnoses = await Diagnosis.findAll({ patient_id: req.params.id });
    res.json({ success: true, data: { ...patient, diagnoses } });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const patient = await Patient.create(req.body);
    res.status(201).json({ success: true, data: patient });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const patient = await Patient.update(req.params.id, req.body);
    if (!patient) return res.status(404).json({ success: false, message: 'Bemor topilmadi' });
    res.json({ success: true, data: patient });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await Patient.remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Bemor topilmadi' });
    res.json({ success: true, message: 'Bemor o\'chirildi' });
  } catch (e) { next(e); }
};
