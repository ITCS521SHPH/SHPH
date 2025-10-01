-- Insert seed users (doctors, VHVs, patients, caregivers)
-- Note: These will be created after auth users are created via the trigger

-- Doctors (4)
INSERT INTO public.users (id, email, full_name, role, phone) VALUES
  ('11111111-1111-1111-1111-111111111111', 'dr.smith@shph.com', 'Dr. Sarah Smith', 'doctor', '+1234567890'),
  ('11111111-1111-1111-1111-111111111112', 'dr.johnson@shph.com', 'Dr. Michael Johnson', 'doctor', '+1234567891'),
  ('11111111-1111-1111-1111-111111111113', 'dr.brown@shph.com', 'Dr. Emily Brown', 'doctor', '+1234567892'),
  ('11111111-1111-1111-1111-111111111114', 'dr.davis@shph.com', 'Dr. James Davis', 'doctor', '+1234567893');

-- VHVs (10)
INSERT INTO public.users (id, email, full_name, role, phone) VALUES
  ('22222222-2222-2222-2222-222222222221', 'vhv.anna@shph.com', 'Anna Wilson', 'vhv', '+1234567894'),
  ('22222222-2222-2222-2222-222222222222', 'vhv.carlos@shph.com', 'Carlos Martinez', 'vhv', '+1234567895'),
  ('22222222-2222-2222-2222-222222222223', 'vhv.maria@shph.com', 'Maria Garcia', 'vhv', '+1234567896'),
  ('22222222-2222-2222-2222-222222222224', 'vhv.john@shph.com', 'John Anderson', 'vhv', '+1234567897'),
  ('22222222-2222-2222-2222-222222222225', 'vhv.lisa@shph.com', 'Lisa Thompson', 'vhv', '+1234567898'),
  ('22222222-2222-2222-2222-222222222226', 'vhv.david@shph.com', 'David Lee', 'vhv', '+1234567899'),
  ('22222222-2222-2222-2222-222222222227', 'vhv.sarah@shph.com', 'Sarah Kim', 'vhv', '+1234567800'),
  ('22222222-2222-2222-2222-222222222228', 'vhv.mike@shph.com', 'Mike Chen', 'vhv', '+1234567801'),
  ('22222222-2222-2222-2222-222222222229', 'vhv.jenny@shph.com', 'Jenny Rodriguez', 'vhv', '+1234567802'),
  ('22222222-2222-2222-2222-222222222230', 'vhv.tom@shph.com', 'Tom Jackson', 'vhv', '+1234567803');

-- Patients (20)
INSERT INTO public.users (id, email, full_name, role, phone) VALUES
  ('33333333-3333-3333-3333-333333333331', 'patient1@example.com', 'Alice Cooper', 'patient', '+1234567804'),
  ('33333333-3333-3333-3333-333333333332', 'patient2@example.com', 'Bob Miller', 'patient', '+1234567805'),
  ('33333333-3333-3333-3333-333333333333', 'patient3@example.com', 'Carol White', 'patient', '+1234567806'),
  ('33333333-3333-3333-3333-333333333334', 'patient4@example.com', 'Daniel Green', 'patient', '+1234567807'),
  ('33333333-3333-3333-3333-333333333335', 'patient5@example.com', 'Eva Martinez', 'patient', '+1234567808'),
  ('33333333-3333-3333-3333-333333333336', 'patient6@example.com', 'Frank Wilson', 'patient', '+1234567809'),
  ('33333333-3333-3333-3333-333333333337', 'patient7@example.com', 'Grace Taylor', 'patient', '+1234567810'),
  ('33333333-3333-3333-3333-333333333338', 'patient8@example.com', 'Henry Brown', 'patient', '+1234567811'),
  ('33333333-3333-3333-3333-333333333339', 'patient9@example.com', 'Iris Davis', 'patient', '+1234567812'),
  ('33333333-3333-3333-3333-333333333340', 'patient10@example.com', 'Jack Johnson', 'patient', '+1234567813'),
  ('33333333-3333-3333-3333-333333333341', 'patient11@example.com', 'Kate Anderson', 'patient', '+1234567814'),
  ('33333333-3333-3333-3333-333333333342', 'patient12@example.com', 'Leo Thompson', 'patient', '+1234567815'),
  ('33333333-3333-3333-3333-333333333343', 'patient13@example.com', 'Mia Lee', 'patient', '+1234567816'),
  ('33333333-3333-3333-3333-333333333344', 'patient14@example.com', 'Noah Kim', 'patient', '+1234567817'),
  ('33333333-3333-3333-3333-333333333345', 'patient15@example.com', 'Olivia Chen', 'patient', '+1234567818'),
  ('33333333-3333-3333-3333-333333333346', 'patient16@example.com', 'Paul Rodriguez', 'patient', '+1234567819'),
  ('33333333-3333-3333-3333-333333333347', 'patient17@example.com', 'Quinn Jackson', 'patient', '+1234567820'),
  ('33333333-3333-3333-3333-333333333348', 'patient18@example.com', 'Ruby Smith', 'patient', '+1234567821'),
  ('33333333-3333-3333-3333-333333333349', 'patient19@example.com', 'Sam Wilson', 'patient', '+1234567822'),
  ('33333333-3333-3333-3333-333333333350', 'patient20@example.com', 'Tina Garcia', 'patient', '+1234567823');

-- Caregivers (10)
INSERT INTO public.users (id, email, full_name, role, phone) VALUES
  ('44444444-4444-4444-4444-444444444441', 'caregiver1@example.com', 'Mary Cooper', 'caregiver', '+1234567824'),
  ('44444444-4444-4444-4444-444444444442', 'caregiver2@example.com', 'Robert Miller', 'caregiver', '+1234567825'),
  ('44444444-4444-4444-4444-444444444443', 'caregiver3@example.com', 'Linda White', 'caregiver', '+1234567826'),
  ('44444444-4444-4444-4444-444444444444', 'caregiver4@example.com', 'James Green', 'caregiver', '+1234567827'),
  ('44444444-4444-4444-4444-444444444445', 'caregiver5@example.com', 'Patricia Martinez', 'caregiver', '+1234567828'),
  ('44444444-4444-4444-4444-444444444446', 'caregiver6@example.com', 'William Wilson', 'caregiver', '+1234567829'),
  ('44444444-4444-4444-4444-444444444447', 'caregiver7@example.com', 'Barbara Taylor', 'caregiver', '+1234567830'),
  ('44444444-4444-4444-4444-444444444448', 'caregiver8@example.com', 'Richard Brown', 'caregiver', '+1234567831'),
  ('44444444-4444-4444-4444-444444444449', 'caregiver9@example.com', 'Susan Davis', 'caregiver', '+1234567832'),
  ('44444444-4444-4444-4444-444444444450', 'caregiver10@example.com', 'Thomas Johnson', 'caregiver', '+1234567833');

-- Insert patient records with assigned VHVs
INSERT INTO public.patients (id, user_id, patient_id, date_of_birth, gender, address, emergency_contact, emergency_phone, assigned_vhv_id) VALUES
  ('55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331', 'P001', '1985-03-15', 'female', '123 Main St, Village A', 'Mary Cooper', '+1234567824', '22222222-2222-2222-2222-222222222221'),
  ('55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333332', 'P002', '1978-07-22', 'male', '456 Oak Ave, Village A', 'Robert Miller', '+1234567825', '22222222-2222-2222-2222-222222222221'),
  ('55555555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333333', 'P003', '1992-11-08', 'female', '789 Pine Rd, Village B', 'Linda White', '+1234567826', '22222222-2222-2222-2222-222222222222'),
  ('55555555-5555-5555-5555-555555555554', '33333333-3333-3333-3333-333333333334', 'P004', '1965-05-30', 'male', '321 Elm St, Village B', 'James Green', '+1234567827', '22222222-2222-2222-2222-222222222222'),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333335', 'P005', '1988-09-12', 'female', '654 Maple Dr, Village C', 'Patricia Martinez', '+1234567828', '22222222-2222-2222-2222-222222222223'),
  ('55555555-5555-5555-5555-555555555556', '33333333-3333-3333-3333-333333333336', 'P006', '1975-01-18', 'male', '987 Cedar Ln, Village C', 'William Wilson', '+1234567829', '22222222-2222-2222-2222-222222222223'),
  ('55555555-5555-5555-5555-555555555557', '33333333-3333-3333-3333-333333333337', 'P007', '1990-04-25', 'female', '147 Birch St, Village D', 'Barbara Taylor', '+1234567830', '22222222-2222-2222-2222-222222222224'),
  ('55555555-5555-5555-5555-555555555558', '33333333-3333-3333-3333-333333333338', 'P008', '1982-12-03', 'male', '258 Spruce Ave, Village D', 'Richard Brown', '+1234567831', '22222222-2222-2222-2222-222222222224'),
  ('55555555-5555-5555-5555-555555555559', '33333333-3333-3333-3333-333333333339', 'P009', '1995-08-14', 'female', '369 Willow Rd, Village E', 'Susan Davis', '+1234567832', '22222222-2222-2222-2222-222222222225'),
  ('55555555-5555-5555-5555-555555555560', '33333333-3333-3333-3333-333333333340', 'P010', '1970-06-27', 'male', '741 Poplar Dr, Village E', 'Thomas Johnson', '+1234567833', '22222222-2222-2222-2222-222222222225'),
  ('55555555-5555-5555-5555-555555555561', '33333333-3333-3333-3333-333333333341', 'P011', '1987-02-09', 'female', '852 Ash St, Village F', 'Emergency Contact', '+1234567834', '22222222-2222-2222-2222-222222222226'),
  ('55555555-5555-5555-5555-555555555562', '33333333-3333-3333-3333-333333333342', 'P012', '1993-10-16', 'male', '963 Hickory Ave, Village F', 'Emergency Contact', '+1234567835', '22222222-2222-2222-2222-222222222226'),
  ('55555555-5555-5555-5555-555555555563', '33333333-3333-3333-3333-333333333343', 'P013', '1980-07-04', 'female', '159 Walnut Rd, Village G', 'Emergency Contact', '+1234567836', '22222222-2222-2222-2222-222222222227'),
  ('55555555-5555-5555-5555-555555555564', '33333333-3333-3333-3333-333333333344', 'P014', '1976-03-21', 'male', '357 Cherry Dr, Village G', 'Emergency Contact', '+1234567837', '22222222-2222-2222-2222-222222222227'),
  ('55555555-5555-5555-5555-555555555565', '33333333-3333-3333-3333-333333333345', 'P015', '1991-11-28', 'female', '468 Peach St, Village H', 'Emergency Contact', '+1234567838', '22222222-2222-2222-2222-222222222228'),
  ('55555555-5555-5555-5555-555555555566', '33333333-3333-3333-3333-333333333346', 'P016', '1984-09-05', 'male', '579 Plum Ave, Village H', 'Emergency Contact', '+1234567839', '22222222-2222-2222-2222-222222222228'),
  ('55555555-5555-5555-5555-555555555567', '33333333-3333-3333-3333-333333333347', 'P017', '1989-05-12', 'other', '680 Apple Rd, Village I', 'Emergency Contact', '+1234567840', '22222222-2222-2222-2222-222222222229'),
  ('55555555-5555-5555-5555-555555555568', '33333333-3333-3333-3333-333333333348', 'P018', '1977-01-29', 'female', '791 Orange Dr, Village I', 'Emergency Contact', '+1234567841', '22222222-2222-2222-2222-222222222229'),
  ('55555555-5555-5555-5555-555555555569', '33333333-3333-3333-3333-333333333349', 'P019', '1986-08-06', 'male', '802 Lemon St, Village J', 'Emergency Contact', '+1234567842', '22222222-2222-2222-2222-222222222230'),
  ('55555555-5555-5555-5555-555555555570', '33333333-3333-3333-3333-333333333350', 'P020', '1994-04-13', 'female', '913 Lime Ave, Village J', 'Emergency Contact', '+1234567843', '22222222-2222-2222-2222-222222222230');

-- Insert caregiver relationships
INSERT INTO public.caregivers (user_id, patient_id, relationship, is_primary) VALUES
  ('44444444-4444-4444-4444-444444444441', '55555555-5555-5555-5555-555555555551', 'spouse', true),
  ('44444444-4444-4444-4444-444444444442', '55555555-5555-5555-5555-555555555552', 'spouse', true),
  ('44444444-4444-4444-4444-444444444443', '55555555-5555-5555-5555-555555555553', 'daughter', true),
  ('44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555554', 'son', true),
  ('44444444-4444-4444-4444-444444444445', '55555555-5555-5555-5555-555555555555', 'spouse', true),
  ('44444444-4444-4444-4444-444444444446', '55555555-5555-5555-5555-555555555556', 'spouse', true),
  ('44444444-4444-4444-4444-444444444447', '55555555-5555-5555-5555-555555555557', 'mother', true),
  ('44444444-4444-4444-4444-444444444448', '55555555-5555-5555-5555-555555555558', 'father', true),
  ('44444444-4444-4444-4444-444444444449', '55555555-5555-5555-5555-555555555559', 'mother', true),
  ('44444444-4444-4444-4444-444444444450', '55555555-5555-5555-5555-555555555560', 'son', true);

-- Insert sample visit records (10 approved, 8 pending)
-- Approved records
INSERT INTO public.visit_records (patient_id, vhv_id, doctor_id, symptoms, blood_pressure, heart_rate, temperature, notes, status, doctor_notes, reviewed_at) VALUES
  ('55555555-5555-5555-5555-555555555551', '22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Headache and mild fever for 2 days', '120/80', 75, 37.2, 'Patient appears stable, resting well', 'approved', 'Viral infection, recommend rest and fluids', NOW() - INTERVAL '2 days'),
  ('55555555-5555-5555-5555-555555555552', '22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111112', 'Persistent cough and chest discomfort', '130/85', 82, 36.8, 'Dry cough, no wheezing observed', 'approved', 'Bronchitis, prescribed cough suppressant', NOW() - INTERVAL '3 days'),
  ('55555555-5555-5555-5555-555555555553', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Stomach pain and nausea after meals', '115/75', 68, 36.5, 'Tenderness in upper abdomen', 'approved', 'Gastritis, dietary modifications recommended', NOW() - INTERVAL '1 day'),
  ('55555555-5555-5555-5555-555555555554', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111113', 'Joint pain in knees and difficulty walking', '140/90', 78, 36.9, 'Limited mobility, swelling in both knees', 'approved', 'Arthritis flare-up, anti-inflammatory prescribed', NOW() - INTERVAL '4 days'),
  ('55555555-5555-5555-5555-555555555555', '22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111112', 'Dizziness and fatigue for several days', '110/70', 65, 36.4, 'Patient reports feeling weak', 'approved', 'Low blood pressure, increase fluid intake', NOW() - INTERVAL '5 days'),
  ('55555555-5555-5555-5555-555555555556', '22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111114', 'Skin rash on arms and itching sensation', '125/82', 72, 36.7, 'Red, raised bumps on forearms', 'approved', 'Allergic reaction, antihistamine recommended', NOW() - INTERVAL '6 days'),
  ('55555555-5555-5555-5555-555555555557', '22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Shortness of breath during light activity', '135/88', 88, 37.0, 'Mild respiratory distress', 'approved', 'Asthma exacerbation, inhaler prescribed', NOW() - INTERVAL '1 week'),
  ('55555555-5555-5555-5555-555555555558', '22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111113', 'Back pain radiating to left leg', '128/84', 76, 36.6, 'Pain worsens with movement', 'approved', 'Sciatica, physical therapy recommended', NOW() - INTERVAL '8 days'),
  ('55555555-5555-5555-5555-555555555559', '22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111112', 'Frequent urination and increased thirst', '118/78', 70, 36.8, 'Patient reports drinking more water', 'approved', 'Possible diabetes, lab tests ordered', NOW() - INTERVAL '9 days'),
  ('55555555-5555-5555-5555-555555555560', '22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111114', 'Severe headache with light sensitivity', '145/95', 85, 37.5, 'Patient avoiding bright lights', 'approved', 'Migraine, pain medication prescribed', NOW() - INTERVAL '10 days');

-- Pending records
INSERT INTO public.visit_records (patient_id, vhv_id, symptoms, blood_pressure, heart_rate, temperature, notes, status) VALUES
  ('55555555-5555-5555-5555-555555555561', '22222222-2222-2222-2222-222222222226', 'Sore throat and difficulty swallowing', '122/79', 74, 37.8, 'Throat appears red and swollen', 'pending'),
  ('55555555-5555-5555-5555-555555555562', '22222222-2222-2222-2222-222222222226', 'Ankle swelling and pain after fall', '132/86', 80, 36.5, 'Visible swelling on right ankle', 'pending'),
  ('55555555-5555-5555-5555-555555555563', '22222222-2222-2222-2222-222222222227', 'Chest pain and irregular heartbeat', '150/100', 95, 37.1, 'Patient reports palpitations', 'pending'),
  ('55555555-5555-5555-5555-555555555564', '22222222-2222-2222-2222-222222222227', 'Persistent fatigue and muscle weakness', '108/68', 62, 36.3, 'Patient appears very tired', 'pending'),
  ('55555555-5555-5555-5555-555555555565', '22222222-2222-2222-2222-222222222228', 'Abdominal cramping and loose stools', '116/74', 78, 37.3, 'Symptoms started yesterday', 'pending'),
  ('55555555-5555-5555-5555-555555555566', '22222222-2222-2222-2222-222222222228', 'Eye irritation and excessive tearing', '124/81', 71, 36.6, 'Both eyes affected, no discharge', 'pending'),
  ('55555555-5555-5555-5555-555555555567', '22222222-2222-2222-2222-222222222229', 'Ear pain and hearing difficulty', '119/77', 73, 37.4, 'Left ear more affected than right', 'pending'),
  ('55555555-5555-5555-5555-555555555568', '22222222-2222-2222-2222-222222222229', 'Numbness in fingers and tingling sensation', '127/83', 69, 36.7, 'Affects both hands, worse in morning', 'pending');
