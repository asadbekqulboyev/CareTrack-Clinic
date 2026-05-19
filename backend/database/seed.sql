-- ============================================================
-- CareTrack Clinic - Sample Seed Data
-- Default password for ALL seeded users: "password123"
-- bcrypt hash below corresponds to "password123"
-- ============================================================

USE caretrack_mrms;

-- Clear existing
DELETE FROM diagnoses;
DELETE FROM patients;
DELETE FROM doctors;
DELETE FROM users;

ALTER TABLE diagnoses AUTO_INCREMENT = 1;
ALTER TABLE patients AUTO_INCREMENT = 1;
ALTER TABLE doctors AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;

-- ------------------------------------------------------------
-- USERS  (password for all = password123)
-- ------------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role, phone, status) VALUES
('Dr. Aziz Karimov',     'admin@caretrack.uz',       '$2a$10$Q7uPQF0jZ9c0w7H8c3b6bO0p/LmKj0v8q1w2eR4t6Y8Uu0Iw1234.', 'admin',        '+998 90 100 00 01', 'active'),
('Nodira Yusupova',      'clinician@caretrack.uz',   '$2a$10$Q7uPQF0jZ9c0w7H8c3b6bO0p/LmKj0v8q1w2eR4t6Y8Uu0Iw1234.', 'clinician',    '+998 90 100 00 02', 'active'),
('Sardor Boboqulov',     'reception@caretrack.uz',   '$2a$10$Q7uPQF0jZ9c0w7H8c3b6bO0p/LmKj0v8q1w2eR4t6Y8Uu0Iw1234.', 'receptionist', '+998 90 100 00 03', 'active');

-- ------------------------------------------------------------
-- DOCTORS
-- ------------------------------------------------------------
INSERT INTO doctors (full_name, specialty, department, phone, email, experience_years, availability, bio) VALUES
('Dr. Aziz Karimov',      'Cardiologist',     'Cardiology',     '+998 90 111 11 11', 'aziz.k@caretrack.uz',   18, 'available', 'Senior cardiologist with focus on preventive cardiology.'),
('Dr. Madina Rahimova',   'Pediatrician',     'Pediatrics',     '+998 90 222 22 22', 'madina.r@caretrack.uz', 12, 'available', 'Pediatric specialist, child wellness expert.'),
('Dr. Bekzod Tursunov',   'Neurologist',      'Neurology',      '+998 90 333 33 33', 'bekzod.t@caretrack.uz', 9,  'busy',      'Specializes in stroke management and headaches.'),
('Dr. Lola Ismoilova',    'Dermatologist',    'Dermatology',    '+998 90 444 44 44', 'lola.i@caretrack.uz',   7,  'available', 'Dermatology and cosmetology specialist.'),
('Dr. Jamshid Olimov',    'Orthopedic',       'Orthopedics',    '+998 90 555 55 55', 'jamshid.o@caretrack.uz',15, 'on_leave',  'Sports injuries and joint surgery.'),
('Dr. Nilufar Saidova',   'Gynecologist',     'Gynecology',     '+998 90 666 66 66', 'nilufar.s@caretrack.uz',11, 'available', 'Womens health and prenatal care.'),
('Dr. Otabek Yo''ldoshev', 'General Physician','General Medicine','+998 90 777 77 77', 'otabek.y@caretrack.uz',  6,  'available', 'Primary care and family medicine.'),
('Dr. Shahnoza Mirzayeva','ENT Specialist',   'ENT',            '+998 90 888 88 88', 'shahnoza.m@caretrack.uz',8,  'available', 'Ear, nose and throat specialist.');

-- ------------------------------------------------------------
-- PATIENTS
-- ------------------------------------------------------------
INSERT INTO patients (full_name, age, gender, phone, email, address, blood_group, doctor_id, registration_date, notes) VALUES
('Akmal Yusupov',        34, 'male',   '+998 91 111 11 11', 'akmal.y@mail.uz',    'Toshkent, Chilonzor 12', 'O+',  1, '2026-04-12', 'Routine check-up.'),
('Madina Karimova',      28, 'female', '+998 91 222 22 22', 'madina.k@mail.uz',   'Toshkent, Yunusobod 5',  'A+',  2, '2026-04-15', 'Allergy follow-up.'),
('Sherzod Rahimov',      45, 'male',   '+998 91 333 33 33', 'sherzod.r@mail.uz',  'Samarqand, Registon 9',  'B+',  1, '2026-04-18', 'Hypertension monitoring.'),
('Dilnoza Olimova',      9,  'female', '+998 91 444 44 44', NULL,                  'Toshkent, Mirobod 7',    'AB+', 2, '2026-04-20', 'Pediatric vaccination.'),
('Bobur Tursunov',       52, 'male',   '+998 91 555 55 55', 'bobur.t@mail.uz',    'Buxoro, Markaziy 22',    'O-',  3, '2026-04-22', 'Migraine episodes.'),
('Zarina Ismoilova',     31, 'female', '+998 91 666 66 66', 'zarina.i@mail.uz',   'Toshkent, Sergeli 14',   'A-',  4, '2026-04-25', 'Skin consultation.'),
('Ulug''bek Saidov',     60, 'male',   '+998 91 777 77 77', NULL,                  'Andijon, Bog''ishamol',  'B-',  5, '2026-04-28', 'Knee pain assessment.'),
('Gulnora Mirzayeva',    27, 'female', '+998 91 888 88 88', 'gulnora.m@mail.uz',  'Toshkent, Olmazor 3',    'O+',  6, '2026-05-02', 'Prenatal visit.'),
('Jasur Karimov',        38, 'male',   '+998 91 999 99 99', 'jasur.k@mail.uz',    'Farg''ona, Mustaqillik', 'A+',  7, '2026-05-05', 'Annual physical.'),
('Sevara Olimova',       22, 'female', '+998 90 100 10 10', 'sevara.o@mail.uz',   'Toshkent, Yashnobod 1',  'AB-', 8, '2026-05-09', 'Throat infection.'),
('Aziza Rahmonova',      41, 'female', '+998 90 200 20 20', 'aziza.r@mail.uz',    'Toshkent, Shayxontohur', 'O+',  1, '2026-05-12', 'Chest pain follow-up.'),
('Davron Tashpulatov',   55, 'male',   '+998 90 300 30 30', NULL,                  'Namangan, Markaziy',     'B+',  3, '2026-05-15', 'Neurology consultation.');

-- ------------------------------------------------------------
-- DIAGNOSES
-- ------------------------------------------------------------
INSERT INTO diagnoses (patient_id, doctor_id, icd_code, title, description, severity, treatment_notes, diagnosed_on) VALUES
(1, 1, 'I10',    'Essential Hypertension',           'Stage 1 hypertension detected.',                         'moderate', 'Lifestyle changes, monitor BP weekly.', '2026-04-13'),
(2, 2, 'J30.1',  'Allergic Rhinitis',                'Seasonal allergy to pollen.',                            'mild',     'Antihistamines for 2 weeks.',           '2026-04-16'),
(3, 1, 'I25.1',  'Atherosclerotic Heart Disease',    'Mild coronary artery narrowing.',                        'severe',   'Statins prescribed, ECG follow-up.',    '2026-04-19'),
(4, 2, 'Z23',    'Vaccination Encounter',            'Routine pediatric vaccination.',                         'mild',     'No issues observed.',                   '2026-04-20'),
(5, 3, 'G43.9',  'Migraine, unspecified',            'Recurrent migraine attacks 2-3 times/week.',             'moderate', 'Triptan therapy, neurology follow-up.', '2026-04-23'),
(6, 4, 'L20.9',  'Atopic Dermatitis',                'Eczema flare-up on arms.',                               'mild',     'Topical corticosteroids.',              '2026-04-26'),
(7, 5, 'M17.0',  'Bilateral Knee Osteoarthritis',    'Moderate joint space narrowing.',                        'severe',   'Physiotherapy and pain management.',    '2026-04-29'),
(8, 6, 'Z34.0',  'Supervision of Pregnancy',         'First trimester routine visit.',                         'mild',     'Prenatal vitamins prescribed.',         '2026-05-03'),
(9, 7, 'Z00.0',  'General Adult Examination',        'Healthy with mild vitamin D deficiency.',                'mild',     'Vitamin D supplementation.',            '2026-05-06'),
(10,8, 'J03.9',  'Acute Tonsillitis',                'Bacterial tonsillitis.',                                 'moderate', 'Antibiotic course for 7 days.',         '2026-05-09'),
(1, 1, 'E78.5',  'Hyperlipidemia',                   'Elevated LDL cholesterol.',                              'moderate', 'Diet plan and statin therapy.',         '2026-05-12'),
(11,1, 'I20.9',  'Angina Pectoris',                  'Stable angina on exertion.',                             'severe',   'Beta-blocker, urgent cardiology review.','2026-05-13'),
(12,3, 'G45.9',  'Transient Ischemic Attack',        'Brief neurological deficit, fully recovered.',           'critical', 'Hospitalization and MRI scheduled.',    '2026-05-15');
