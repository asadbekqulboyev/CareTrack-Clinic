const { pool } = require('../config/db');

const Doctor = {
  async findAll({ q = '', department = '', availability = '' } = {}) {
    const where = [];
    const params = [];
    if (q) {
      where.push('(full_name LIKE ? OR specialty LIKE ? OR email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (department) { where.push('department = ?'); params.push(department); }
    if (availability) { where.push('availability = ?'); params.push(availability); }

    const sql = `
      SELECT d.*,
        (SELECT COUNT(*) FROM patients p WHERE p.doctor_id = d.id) AS patient_count
      FROM doctors d
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY d.created_at DESC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT d.*,
              (SELECT COUNT(*) FROM patients p WHERE p.doctor_id = d.id) AS patient_count
       FROM doctors d WHERE d.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { full_name, specialty, department, phone, email, experience_years = 0, availability = 'available', bio } = data;
    const [r] = await pool.query(
      `INSERT INTO doctors (full_name, specialty, department, phone, email, experience_years, availability, bio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [full_name, specialty, department, phone || null, email || null, experience_years, availability, bio || null]
    );
    return this.findById(r.insertId);
  },

  async update(id, fields) {
    const allowed = ['full_name', 'specialty', 'department', 'phone', 'email', 'experience_years', 'availability', 'bio'];
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
    await pool.query(`UPDATE doctors SET ${set.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    const [r] = await pool.query('DELETE FROM doctors WHERE id = ?', [id]);
    return r.affectedRows > 0;
  },

  async departments() {
    const [rows] = await pool.query('SELECT DISTINCT department FROM doctors ORDER BY department');
    return rows.map(r => r.department);
  },

  async count() {
    const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM doctors');
    return r.c;
  },
};

module.exports = Doctor;
