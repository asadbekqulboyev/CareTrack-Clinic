const mysql = require('mysql2/promise');
require('dotenv').config();

// Cloud providers (Railway, Aiven, PlanetScale) usually give you a single DATABASE_URL.
// We support both: DATABASE_URL OR individual DB_* vars.
let poolConfig;

if (process.env.DATABASE_URL) {
  // Format: mysql://user:pass@host:port/dbname
  poolConfig = process.env.DATABASE_URL;
} else {
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'caretrack_mrms',
  };
}

const baseOptions = {
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
};

// Some providers require SSL
if (process.env.DB_SSL === 'true') {
  baseOptions.ssl = { rejectUnauthorized: false };
}

const pool = typeof poolConfig === 'string'
  ? mysql.createPool({ uri: poolConfig, ...baseOptions })
  : mysql.createPool({ ...poolConfig, ...baseOptions });

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    console.log('✅ MySQL connected successfully');
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('   Check your DB credentials.');
  }
}

module.exports = { pool, testConnection };
