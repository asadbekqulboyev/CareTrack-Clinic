const { pool } = require('../config/db');

const User = {
  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
    return rows[0] || null;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, role, phone, status, created_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  },

  async findAll({ q = '', role = '' } = {}) {
    const where = [];
    const params = [];
    if (q) {
      where.push('(full_name LIKE ? OR email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (role) {
      where.push('role = ?');
      params.push(role);
    }
    const sql = `
      SELECT id, full_name, email, role, phone, status, created_at
      FROM users
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async create({ full_name, email, password_hash, role, phone, status = 'active' }) {
    const [r] = await pool.query(
      'INSERT INTO users (full_name, email, password_hash, role, phone, status) VALUES (?, ?, ?, ?, ?, ?)',
      [full_name, email, password_hash, role, phone || null, status]
    );
    return this.findById(r.insertId);
  },

  async update(id, fields) {
    const allowed = ['full_name', 'email', 'role', 'phone', 'status', 'password_hash'];
    const set = [];
    const params = [];
    for (const k of allowed) {
      if (fields[k] !== undefined) {
        set.push(`${k} = ?`);
        params.push(fields[k]);
      }
    }
    if (!set.length) return this.findById(id);
    params.push(id);
    await pool.query(`UPDATE users SET ${set.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    const [r] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    return r.affectedRows > 0;
  },
};

module.exports = User;
