/**
 * CareTrack MRMS - Database Initializer
 * - Creates database (if not exists)
 * - Applies schema.sql
 * - Seeds sample data with real bcrypt password hashes
 *
 * Usage: npm run db:init
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DB_NAME = process.env.DB_NAME || 'caretrack_mrms';

async function run() {
  const baseConfig = process.env.DATABASE_URL
    ? {
        uri: process.env.DATABASE_URL,
        multipleStatements: true,
        ...(process.env.DB_SSL === "true"
          ? { ssl: { rejectUnauthorized: false } }
          : {}),
      }
    : {
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASSWORD || "",
        multipleStatements: true,
      };

  console.log('🔧 Connecting to MySQL...');
  let conn;
  try {
    conn = await mysql.createConnection(baseConfig);
  } catch (err) {
    console.error('❌ Cannot connect to MySQL:', err.message);
    console.error('   Ensure MySQL is running and .env credentials are correct.');
    process.exit(1);
  }

  // 1) Apply schema.sql (creates DB + tables)
  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  console.log('📐 Applying schema...');
  await conn.query(schemaSql);

  // 2) Switch to DB
  await conn.changeUser({ database: DB_NAME });

  // 3) Seed users with proper bcrypt hashes
  console.log('🌱 Seeding users with bcrypt hashes...');
  const passwordHash = await bcrypt.hash('password123', 10);

  await conn.query('DELETE FROM diagnoses');
  await conn.query('DELETE FROM patients');
  await conn.query('DELETE FROM doctors');
  await conn.query('DELETE FROM users');
  await conn.query('ALTER TABLE diagnoses AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE patients AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE doctors AUTO_INCREMENT = 1');
  await conn.query('ALTER TABLE users AUTO_INCREMENT = 1');

  await conn.query(
    `INSERT INTO users (full_name, email, password_hash, role, phone, status) VALUES ?`,
    [[
      ['Dr. Aziz Karimov',  'admin@caretrack.uz',     passwordHash, 'admin',        '+998 90 100 00 01', 'active'],
      ['Nodira Yusupova',   'clinician@caretrack.uz', passwordHash, 'clinician',    '+998 90 100 00 02', 'active'],
      ['Sardor Boboqulov',  'reception@caretrack.uz', passwordHash, 'receptionist', '+998 90 100 00 03', 'active'],
    ]]
  );

  // 4) Seed remaining tables from seed.sql (skip the user inserts inside it)
  console.log('🌱 Seeding doctors, patients, diagnoses...');
  let seedSql = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
  // Strip USE statement and the users INSERT block (we already inserted users with proper hashes)
  seedSql = seedSql
    .replace(/USE\s+caretrack_mrms\s*;/gi, '')
    .replace(/INSERT INTO users[\s\S]*?;\s*/i, '')
    .replace(/DELETE FROM users\s*;/gi, '')
    .replace(/ALTER TABLE users[^;]*;/gi, '');
  await conn.query(seedSql);

  console.log('');
  console.log('✅ Database initialized successfully.');
  console.log('');
  console.log('🔑 Default login credentials (password = password123):');
  console.log('   Admin        : admin@caretrack.uz');
  console.log('   Clinician    : clinician@caretrack.uz');
  console.log('   Receptionist : reception@caretrack.uz');
  console.log('');

  await conn.end();
}

run().catch((err) => {
  console.error('❌ Init failed:', err);
  process.exit(1);
});
