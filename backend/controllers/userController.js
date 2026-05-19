const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.list = async (req, res, next) => {
  try {
    const data = await User.findAll(req.query);
    res.json({ success: true, data });
  } catch (e) { next(e); }
};

exports.getOne = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { full_name, email, password, role, phone, status } = req.body;
    const exists = await User.findByEmail(email);
    if (exists) return res.status(409).json({ success: false, message: 'Email allaqachon ro\'yxatdan o\'tgan' });
    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ full_name, email, password_hash, role, phone, status });
    res.status(201).json({ success: true, data: user });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const fields = { ...req.body };
    if (fields.password) {
      fields.password_hash = await bcrypt.hash(fields.password, 10);
      delete fields.password;
    }
    const user = await User.update(req.params.id, fields);
    if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      return res.status(400).json({ success: false, message: 'O\'z hisobingizni o\'chira olmaysiz' });
    }
    const ok = await User.remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    res.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
  } catch (e) { next(e); }
};
