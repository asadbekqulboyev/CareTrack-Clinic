-- ============================================================
-- CareTrack Clinic - Medical Record Management System (MRMS)
-- MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS caretrack_mrms
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE caretrack_mrms;

-- ------------------------------------------------------------
-- USERS (Administrator, Clinician, Receptionist)
-- ------------------------------------------------------------
DROP TABLE IF EXISTS diagnoses;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS doctors;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'clinician', 'receptionist') NOT NULL DEFAULT 'receptionist',
  phone VARCHAR(30),
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role),
  INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- DOCTORS
-- ------------------------------------------------------------
CREATE TABLE doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  specialty VARCHAR(120) NOT NULL,
  department VARCHAR(120) NOT NULL,
  phone VARCHAR(30),
  email VARCHAR(150) UNIQUE,
  experience_years INT DEFAULT 0,
  availability ENUM('available', 'busy', 'on_leave') NOT NULL DEFAULT 'available',
  bio TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_doctors_dept (department),
  INDEX idx_doctors_avail (availability),
  INDEX idx_doctors_name (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- PATIENTS
-- ------------------------------------------------------------
CREATE TABLE patients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  age INT,
  gender ENUM('male', 'female', 'other') NOT NULL DEFAULT 'other',
  phone VARCHAR(30),
  email VARCHAR(150),
  address TEXT,
  blood_group VARCHAR(10),
  doctor_id INT,
  registration_date DATE NOT NULL DEFAULT (CURRENT_DATE),
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_patients_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_patients_doctor (doctor_id),
  INDEX idx_patients_name (full_name),
  INDEX idx_patients_reg (registration_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- DIAGNOSES
-- ------------------------------------------------------------
CREATE TABLE diagnoses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  doctor_id INT,
  icd_code VARCHAR(20) NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  severity ENUM('mild', 'moderate', 'severe', 'critical') NOT NULL DEFAULT 'mild',
  treatment_notes TEXT,
  diagnosed_on DATE NOT NULL DEFAULT (CURRENT_DATE),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_diag_patient
    FOREIGN KEY (patient_id) REFERENCES patients(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_diag_doctor
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_diag_patient (patient_id),
  INDEX idx_diag_doctor (doctor_id),
  INDEX idx_diag_severity (severity),
  INDEX idx_diag_icd (icd_code),
  INDEX idx_diag_date (diagnosed_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
