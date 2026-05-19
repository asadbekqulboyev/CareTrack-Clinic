/**
 * CareTrack MRMS - Lightweight integration tests
 * Hits the running API at http://localhost:PORT
 *
 * Usage:
 *   1) Start backend:    npm start
 *   2) In another shell: npm test
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORT = Number(process.env.PORT) || 5000;
const BASE = `http://localhost:${PORT}/api`;

let pass = 0, fail = 0;
const log = (ok, name, extra = '') => {
  if (ok) { pass++; console.log(`  ✅  ${name}`); }
  else    { fail++; console.log(`  ❌  ${name}  ${extra}`); }
};

async function api(method, url, body, token) {
  const res = await fetch(`${BASE}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

(async function main() {
  console.log('\n🧪  CareTrack MRMS – API Tests\n');

  // 1) Health
  {
    const { status, json } = await api('GET', '/health');
    log(status === 200 && json.success, 'GET /health');
  }

  // 2) Auth: bad credentials
  {
    const { status } = await api('POST', '/auth/login', { email: 'admin@caretrack.uz', password: 'wrong' });
    log(status === 401, 'POST /auth/login rejects wrong password');
  }

  // 3) Auth: success (admin)
  let adminToken;
  {
    const { status, json } = await api('POST', '/auth/login', { email: 'admin@caretrack.uz', password: 'password123' });
    adminToken = json?.data?.token;
    log(status === 200 && !!adminToken, 'POST /auth/login admin success');
  }

  // 4) Protected route without token
  {
    const { status } = await api('GET', '/doctors');
    log(status === 401, 'GET /doctors requires auth');
  }

  // 5) Doctors list
  let firstDoctorId;
  {
    const { status, json } = await api('GET', '/doctors', null, adminToken);
    firstDoctorId = json?.data?.[0]?.id;
    log(status === 200 && Array.isArray(json.data), 'GET /doctors returns list');
  }

  // 6) Create doctor (admin)
  let createdDoctorId;
  {
    const { status, json } = await api('POST', '/doctors', {
      full_name: 'Dr. Test User',
      specialty: 'Test Specialty',
      department: 'Testing',
      experience_years: 3,
      availability: 'available',
    }, adminToken);
    createdDoctorId = json?.data?.id;
    log(status === 201 && !!createdDoctorId, 'POST /doctors creates doctor');
  }

  // 7) Update doctor
  {
    const { status, json } = await api('PUT', `/doctors/${createdDoctorId}`, {
      full_name: 'Dr. Test User Updated',
      specialty: 'Test Specialty',
      department: 'Testing',
    }, adminToken);
    log(status === 200 && json?.data?.full_name === 'Dr. Test User Updated', 'PUT /doctors/:id updates');
  }

  // 8) Patients
  let createdPatientId;
  {
    const { status, json } = await api('POST', '/patients', {
      full_name: 'Test Patient', age: 30, gender: 'male', doctor_id: firstDoctorId,
    }, adminToken);
    createdPatientId = json?.data?.id;
    log(status === 201 && !!createdPatientId, 'POST /patients creates patient');
  }

  // 9) Diagnoses
  let createdDiagId;
  {
    const { status, json } = await api('POST', '/diagnoses', {
      patient_id: createdPatientId, doctor_id: firstDoctorId,
      icd_code: 'TST.1', title: 'Test diagnosis', severity: 'mild',
    }, adminToken);
    createdDiagId = json?.data?.id;
    log(status === 201 && !!createdDiagId, 'POST /diagnoses creates diagnosis');
  }

  // 10) Stats dashboard
  {
    const { status, json } = await api('GET', '/stats/dashboard', null, adminToken);
    log(status === 200 && json?.data?.totals?.doctors >= 1, 'GET /stats/dashboard returns totals');
  }

  // 11) Receptionist cannot delete doctor
  {
    const { json: loginJson } = await api('POST', '/auth/login', {
      email: 'reception@caretrack.uz', password: 'password123'
    });
    const recToken = loginJson?.data?.token;
    const { status } = await api('DELETE', `/doctors/${createdDoctorId}`, null, recToken);
    log(status === 403, 'Receptionist forbidden from deleting doctor');
  }

  // 12) Cleanup created entities
  {
    await api('DELETE', `/diagnoses/${createdDiagId}`, null, adminToken);
    await api('DELETE', `/patients/${createdPatientId}`, null, adminToken);
    const { status } = await api('DELETE', `/doctors/${createdDoctorId}`, null, adminToken);
    log(status === 200, 'Cleanup deletes created entities');
  }

  console.log(`\n📊  Results: ${pass} passed, ${fail} failed\n`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('Test runner crashed:', e); process.exit(1); });
