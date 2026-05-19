const { pool } = require('../config/db');

const Patient = {
  async findAll({ q = '', doctor_id = '', gender = '', from = '', to = '' } = {}) {
    const where = [];
    const params = [];
    if (q) {
      where.push('(p.full_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (doctor_id) { where.push('p.doctor_id = ?'); params.push(doctor_id); }
    if (gender) { where.push('p.gender = ?'); params.push(gender); }
    if (from) { where.push('p.registration_date >= ?'); params.push(from); }
    if (to)   { where.push('p.registration_date <= ?'); params.push(to); }

    const sql = `
      SELECT p.*,
             d.full_name AS doctor_name,
             d.specialty AS doctor_specialty,
             d.department AS doctor_department,
             (SELECT COUNT(*) FROM diagnoses dg WHERE dg.patient_id = p.id) AS diagnosis_count
      FROM patients p
      LEFT JOIN doctors d ON d.id = p.doctor_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.registration_date DESC, p.id DESC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT p.*,
              d.full_name AS doctor_name,
              d.specialty AS doctor_specialty,
              d.department AS doctor_department
       FROM patients p
       LEFT JOIN doctors d ON d.id = p.doctor_id
       WHERE p.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { full_name, age, gender = 'other', phone, email, address, blood_group, doctor_id, registration_date, notes } = data;
    const [r] = await pool.query(
      `INSERT INTO patients (full_name, age, gender, phone, email, address, blood_group, doctor_id, registration_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_DATE), ?)`,
      [full_name, age || null, gender, phone || null, email || null, address || null, blood_group || null,
       doctor_id || null, registration_date || null, notes || null]
    );
    return this.findById(r.insertId);
  },

  async update(id, fields) {
    const allowed = ['full_name','age','gender','phone','email','address','blood_group','doctor_id','registration_date','notes'];
    const set = [];
    const params = [];
    for (const k of allowed) {
      if (fields[k] !== undefined) {
        set.push(`${k} = ?`);
        params.push(fields[k] === '' ? null : fields[k]);
      }
    }
    if (!set.length) return this.findById(id);
    params.push(id);
    await pool.query(`UPDATE patients SET ${set.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    const [r] = await pool.query('DELETE FROM patients WHERE id = ?', [id]);
    return r.affectedRows > 0;
  },

  async count() {
    const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM patients');
    return r.c;
  },

  async recent(limit = 5) {
    const [rows] = await pool.query(
      `SELECT p.id, p.full_name, p.gender, p.age, p.registration_date,
              d.full_name AS doctor_name
       FROM patients p
       LEFT JOIN doctors d ON d.id = p.doctor_id
       ORDER BY p.created_at DESC
       LIMIT ?`,
      [limit]
    );
    return rows;
  },
};

module.exports = Patient;
