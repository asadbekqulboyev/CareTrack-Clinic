/**
 * CareTrack Clinic - MRMS Backend
 * Entry point: Express + MySQL + JWT
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes      = require('./routes/authRoutes');
const doctorRoutes    = require('./routes/doctorRoutes');
const patientRoutes   = require('./routes/patientRoutes');
const diagnosisRoutes = require('./routes/diagnosisRoutes');
const userRoutes      = require('./routes/userRoutes');
const statsRoutes     = require('./routes/statsRoutes');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Core middleware
const corsOrigins = (process.env.CLIENT_ORIGIN || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow same-origin / curl / postman (no origin header)
      if (!origin) return callback(null, true);
      if (corsOrigins.includes("*") || corsOrigins.includes(origin))
        return callback(null, true);
      return callback(new Error("Not allowed by CORS: " + origin));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Tiny request logger
app.use((req, _res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Auth-specific rate limit (login bruteforce protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Juda ko\'p urinish. Iltimos, keyinroq urinib ko\'ring.' },
});

// Serve frontend statically (one folder up: ../frontend)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API health
app.get('/api/health', (_req, res) => {
  res.json({ success: true, service: 'CareTrack MRMS API', time: new Date().toISOString() });
});

// API routes
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/doctors',                 doctorRoutes);
app.use('/api/patients',                patientRoutes);
app.use('/api/diagnoses',               diagnosisRoutes);
app.use('/api/users',                   userRoutes);
app.use('/api/stats',                   statsRoutes);

// 404 + error handler
app.use('/api', notFound);
app.use(errorHandler);

// Start
app.listen(PORT, async () => {
  console.log('');
  console.log('🩺  CareTrack Clinic – MRMS API');
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log(`🌐  Frontend served at http://localhost:${PORT}`);
  console.log('');
  await testConnection();
});

module.exports = app;
