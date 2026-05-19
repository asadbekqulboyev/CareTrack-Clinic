const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, full_name: user.full_name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return res.status(401).json({ success: false, message: 'Email yoki parol noto\'g\'ri' });
    if (user.status !== 'active') {
      return res.status(403).json({ success: false, message: 'Hisob faollashtirilmagan' });
    }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ success: false, message: 'Email yoki parol noto\'g\'ri' });

    const token = signToken(user);
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      },
    });
  } catch (err) { next(err); }
};

exports.register = async (req, res, next) => {
  try {
    const { full_name, email, password, role = 'receptionist', phone } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) return res.status(409).json({ success: false, message: 'Bu email allaqachon ro\'yxatdan o\'tgan' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ full_name, email, password_hash, role, phone });
    const token = signToken(user);

    res.status(201).json({
      success: true,
      data: { token, user },
    });
  } catch (err) { next(err); }
};

exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};
