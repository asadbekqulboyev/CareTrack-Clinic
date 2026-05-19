const Diagnosis = require('../models/Diagnosis');

exports.list = async (req, res, next) => {
  try {
    const data = await Diagnosis.findAll(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) return res.status(404).json({ success: false, message: 'Tashxis topilmadi' });
    res.json({ success: true, data: diagnosis });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.create(req.body);
    res.status(201).json({ success: true, data: diagnosis });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const diagnosis = await Diagnosis.update(req.params.id, req.body);
    if (!diagnosis) return res.status(404).json({ success: false, message: 'Tashxis topilmadi' });
    res.json({ success: true, data: diagnosis });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await Diagnosis.remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Tashxis topilmadi' });
    res.json({ success: true, message: 'Tashxis o\'chirildi' });
  } catch (e) { next(e); }
};
