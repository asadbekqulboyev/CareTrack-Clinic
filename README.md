# 🩺 CareTrack Clinic — Medical Record Management System (MRMS)

Production-grade healthcare SaaS platform for a multi-department private clinic.

**Stack**
- **Frontend** — Vanilla HTML5 / CSS3 / JavaScript (no frameworks, no Tailwind, no Bootstrap)
- **Backend** — Node.js + Express.js (MVC)
- **Database** — MySQL 8 (relational, with foreign keys + indexes)
- **Auth** — JWT + bcrypt password hashing
- **Architecture** — REST API, role-based access control, validated endpoints

---

## ✨ Features

- **Authentication** — JWT login, RBAC, protected routes, session persistence
- **Dashboard** — KPI cards, trend chart (SVG), severity donut, recent patients, departments breakdown
- **Doctors CRUD** — Add / edit / delete, filter by department & availability, full search
- **Patients CRUD** — Register, assign doctor, full demographics, blood group, notes, date filtering
- **Diagnoses CRUD** — ICD codes, severity levels (mild → critical), treatment notes, doctor & patient links
- **Patient Profile** — Hero card, info grid, full diagnosis timeline with severity color coding
- **User Management** — Admin only, manage all 3 roles
- **Settings** — Profile info, security overview, role permission matrix, live API health
- **Global Search** — From topbar to patient list

### 🎨 UI / UX
- Dedicated SaaS dashboard layout (sidebar + topbar)
- Glassmorphism, soft shadows, professional gradients
- Responsive: desktop, tablet, mobile (collapsible sidebar)
- Toast notifications, modal dialogs, confirmation prompts
- Empty / loading / error states everywhere
- Status badges, severity coloring, smooth hover/focus animations
- Healthcare-inspired palette (clinical blue + medical teal)

### 👥 Roles & Permissions

| Feature | Administrator | Clinician | Receptionist |
| --- | :---: | :---: | :---: |
| View patients & doctors | ✅ | ✅ | ✅ |
| Register / update patients | ✅ | ✅ | ✅ |
| Delete patients | ✅ | ❌ | ❌ |
| Add / edit / delete doctors | ✅ | ❌ | ❌ |
| Add / edit / delete diagnoses | ✅ | ✅ | ❌ |
| Manage users | ✅ | ❌ | ❌ |

---

## 📁 Project structure

```
clinick/
├── backend/
│   ├── config/db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── diagnosisController.js
│   │   ├── userController.js
│   │   └── statsController.js
│   ├── middleware/
│   │   ├── auth.js          # JWT verify + role guards
│   │   ├── validate.js      # Schema validator
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Doctor.js
│   │   ├── Patient.js
│   │   └── Diagnosis.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── diagnosisRoutes.js
│   │   ├── userRoutes.js
│   │   └── statsRoutes.js
│   ├── database/
│   │   ├── schema.sql
│   │   ├── seed.sql
│   │   └── init.js          # Bootstraps DB + bcrypt seeds
│   ├── tests/run-tests.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── frontend/
    ├── index.html           # Auth-aware redirect
    ├── login.html
    ├── dashboard.html
    ├── patients.html
    ├── patient-profile.html
    ├── doctors.html
    ├── diagnoses.html
    ├── users.html
    ├── settings.html
    ├── 404.html
    ├── css/                 # Modular CSS (variables, base, components, layout, auth, dashboard)
    ├── js/                  # Vanilla JS (api, ui, page modules)
    └── assets/
```

---

## 🚀 Getting started

### 1. Prerequisites
- Node.js 18+
- MySQL 8+ (XAMPP / Laragon / standalone)

### 2. Configure
```bash
cd backend
cp .env.example .env       # adjust DB credentials if needed
```

### 3. Install & seed
```bash
npm install
npm run db:init            # creates DB + tables + seed data with bcrypt hashes
```

### 4. Run
```bash
npm start                  # http://localhost:5000
```

The Express server **also serves the frontend statically**, so the entire app is available at `http://localhost:5000/` — no separate dev server needed.

### 🔑 Demo credentials (password = `password123`)

| Role          | Email                       |
| ------------- | --------------------------- |
| Administrator | `admin@caretrack.uz`        |
| Clinician     | `clinician@caretrack.uz`    |
| Receptionist  | `reception@caretrack.uz`    |

---

## 🧪 Testing

With the server running:

```bash
npm test
```

Runs an integration test suite covering:
- Health check
- Auth (success, failure, RBAC)
- Doctors / Patients / Diagnoses CRUD
- Stats dashboard
- Receptionist permission denial
- Cleanup of created entities

---

## 📡 REST API

Base URL: `http://localhost:5000/api`

| Method | Endpoint                    | Roles                           | Description                |
| ------ | --------------------------- | ------------------------------- | -------------------------- |
| POST   | /auth/login                 | public                          | Login with email/password  |
| POST   | /auth/register              | admin                           | Create new user            |
| GET    | /auth/me                    | any                             | Current user               |
| GET    | /doctors                    | any                             | List + filter doctors      |
| GET    | /doctors/:id                | any                             | Doctor by id               |
| POST   | /doctors                    | admin                           | Create doctor              |
| PUT    | /doctors/:id                | admin                           | Update doctor              |
| DELETE | /doctors/:id                | admin                           | Delete doctor              |
| GET    | /doctors/departments/list   | any                             | Distinct departments       |
| GET    | /patients                   | any                             | List + filter patients     |
| GET    | /patients/:id               | any                             | Patient + diagnoses        |
| POST   | /patients                   | admin, receptionist             | Create patient             |
| PUT    | /patients/:id               | admin, clinician, receptionist  | Update patient             |
| DELETE | /patients/:id               | admin                           | Delete patient             |
| GET    | /diagnoses                  | any                             | List + filter diagnoses    |
| GET    | /diagnoses/:id              | any                             | Diagnosis by id            |
| POST   | /diagnoses                  | admin, clinician                | Create diagnosis           |
| PUT    | /diagnoses/:id              | admin, clinician                | Update diagnosis           |
| DELETE | /diagnoses/:id              | admin, clinician                | Delete diagnosis           |
| GET    | /users                      | admin                           | List + filter users        |
| POST   | /users                      | admin                           | Create user                |
| PUT    | /users/:id                  | admin                           | Update user / password     |
| DELETE | /users/:id                  | admin                           | Delete user                |
| GET    | /stats/dashboard            | any                             | KPIs + chart datasets      |
| GET    | /health                     | public                          | Service heartbeat          |

All protected endpoints require `Authorization: Bearer <jwt-token>`.

---

## 🛡️ Security highlights

- bcrypt password hashing (salt rounds = 10)
- JWT signed with rotating secret (`.env`)
- `express-rate-limit` on `/api/auth` to slow brute force
- Server-side validation middleware on all writes
- SQL injection prevented via parameterized queries (`mysql2/promise`)
- Role guards on every privileged route
- Centralized error handler (no stack traces leak in production)

---

## 📊 Database

Four core tables with relational integrity:

```
users        ──┐
doctors  ──────┼──── patients ──── diagnoses
               │       (FK doctor_id)   (FK patient_id, doctor_id)
```

- `One doctor → many patients`
- `One patient → many diagnoses`
- Cascade delete on diagnoses when patient is removed
- `SET NULL` on patient.doctor_id and diagnosis.doctor_id when doctor removed
- Indexes on email, name, registration_date, severity, ICD code

---

## 🧰 Scripts

| Command              | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `npm start`          | Run production server                     |
| `npm run dev`        | Run with nodemon                          |
| `npm run db:init`    | Drop + recreate schema + seed bcrypt data |
| `npm test`           | Integration test suite                    |

---

## 📝 License

MIT — built for academic distinction-level submission and professional portfolio use.
