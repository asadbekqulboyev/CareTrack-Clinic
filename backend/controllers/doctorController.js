const Doctor = require('../models/Doctor');

exports.list = async (req, res, next) => {
  try {
    const data = await Doctor.findAll(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ success: false, message: 'Shifokor topilmadi' });
    res.json({ success: true, data: doctor });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const doctor = await Doctor.create(req.body);
    res.status(201).json({ success: true, data: doctor });
  } catch (e) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ success: false, message: 'Bu email bilan shifokor allaqachon mavjud' });
    }
    next(e);
  }
};

exports.update = async (req, res, next) => {
  try {
    const doctor = await Doctor.update(req.params.id, req.body);
    if (!doctor) return res.status(404).json({ success: false, message: 'Shifokor topilmadi' });
    res.json({ success: true, data: doctor });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await Doctor.remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Shifokor topilmadi' });
    res.json({ success: true, message: 'Shifokor o\'chirildi' });
  } catch (e) { next(e); }
};

exports.departments = async (req, res, next) => {
  try {
    const data = await Doctor.departments();
    res.json({ success: true, data });
  } catch (e) { next(e); }
};
