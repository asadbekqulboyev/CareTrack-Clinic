const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Diagnosis = require('../models/Diagnosis');
const { pool } = require('../config/db');

exports.dashboard = async (req, res, next) => {
  try {
    const [
      totalDoctors,
      totalPatients,
      totalDiagnoses,
      recentPatients,
      severityBreakdown,
      monthlyTrend,
    ] = await Promise.all([
      Doctor.count(),
      Patient.count(),
      Diagnosis.count(),
      Patient.recent(6),
      Diagnosis.severityBreakdown(),
      Diagnosis.monthlyTrend(),
    ]);

    // Doctors per department
    const [deptRows] = await pool.query(
      `SELECT department, COUNT(*) AS c FROM doctors GROUP BY department ORDER BY c DESC`
    );

    // Total users
    const [[{ c: totalUsers }]] = await pool.query('SELECT COUNT(*) AS c FROM users');

    res.json({
      success: true,
      data: {
        totals: {
          doctors: totalDoctors,
          patients: totalPatients,
          diagnoses: totalDiagnoses,
          users: totalUsers,
        },
        recentPatients,
        severityBreakdown,
        monthlyTrend,
        departments: deptRows,
      },
    });
  } catch (e) { next(e); }
};
