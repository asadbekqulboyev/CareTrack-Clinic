const { pool } = require('../config/db');

const Diagnosis = {
  async findAll({ q = '', patient_id = '', doctor_id = '', severity = '', from = '', to = '' } = {}) {
    const where = [];
    const params = [];
    if (q) {
      where.push('(dg.title LIKE ? OR dg.icd_code LIKE ? OR dg.description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (patient_id) { where.push('dg.patient_id = ?'); params.push(patient_id); }
    if (doctor_id)  { where.push('dg.doctor_id = ?');  params.push(doctor_id); }
    if (severity)   { where.push('dg.severity = ?');   params.push(severity); }
    if (from) { where.push('dg.diagnosed_on >= ?'); params.push(from); }
    if (to)   { where.push('dg.diagnosed_on <= ?'); params.push(to); }

    const sql = `
      SELECT dg.*,
             p.full_name AS patient_name,
             d.full_name AS doctor_name,
             d.specialty AS doctor_specialty
      FROM diagnoses dg
      LEFT JOIN patients p ON p.id = dg.patient_id
      LEFT JOIN doctors  d ON d.id = dg.doctor_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY dg.diagnosed_on DESC, dg.id DESC
    `;
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT dg.*, p.full_name AS patient_name, d.full_name AS doctor_name
       FROM diagnoses dg
       LEFT JOIN patients p ON p.id = dg.patient_id
       LEFT JOIN doctors  d ON d.id = dg.doctor_id
       WHERE dg.id = ? LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { patient_id, doctor_id, icd_code, title, description, severity = 'mild', treatment_notes, diagnosed_on } = data;
    const [r] = await pool.query(
      `INSERT INTO diagnoses (patient_id, doctor_id, icd_code, title, description, severity, treatment_notes, diagnosed_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_DATE))`,
      [patient_id, doctor_id || null, icd_code, title, description || null, severity, treatment_notes || null, diagnosed_on || null]
    );
    return this.findById(r.insertId);
  },

  async update(id, fields) {
    const allowed = ['patient_id','doctor_id','icd_code','title','description','severity','treatment_notes','diagnosed_on'];
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
    await pool.query(`UPDATE diagnoses SET ${set.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  },

  async remove(id) {
    const [r] = await pool.query('DELETE FROM diagnoses WHERE id = ?', [id]);
    return r.affectedRows > 0;
  },

  async count() {
    const [[r]] = await pool.query('SELECT COUNT(*) AS c FROM diagnoses');
    return r.c;
  },

  async severityBreakdown() {
    const [rows] = await pool.query(
      `SELECT severity, COUNT(*) AS c FROM diagnoses GROUP BY severity`
    );
    return rows;
  },

  async monthlyTrend() {
    const [rows] = await pool.query(
      `SELECT DATE_FORMAT(diagnosed_on, '%Y-%m') AS month, COUNT(*) AS c
       FROM diagnoses
       WHERE diagnosed_on >= DATE_SUB(CURRENT_DATE, INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month`
    );
    return rows;
  },
};

module.exports = Diagnosis;
