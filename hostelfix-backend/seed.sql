-- HostelFix Database Seed Script
-- Run this script to set up the database with test data

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  college_id VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('student', 'caretaker', 'admin') DEFAULT 'student',
  name VARCHAR(100),
  email VARCHAR(100),
  mobile VARCHAR(15),
  hostel ENUM('boys', 'girls'),
  dept VARCHAR(50),
  year INT,
  room_no VARCHAR(20),
  assigned_caretaker VARCHAR(50),
  reset_otp VARCHAR(255),
  otp_expiry DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_no VARCHAR(20) NOT NULL,
  hostel_type ENUM('boys', 'girls') NOT NULL,
  capacity INT DEFAULT 4,
  UNIQUE KEY unique_room (room_no, hostel_type)
);

CREATE TABLE IF NOT EXISTS complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  status ENUM('pending', 'approved', 'rejected', 'in_progress') DEFAULT 'pending',
  priority ENUM('normal', 'urgent') DEFAULT 'normal',
  image VARCHAR(255),
  assigned_to VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  old_status VARCHAR(20),
  new_status VARCHAR(20),
  changed_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaint_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_id INT NOT NULL,
  caretaker_id VARCHAR(50),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  from_user VARCHAR(50),
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing test data (optional - comment out if you want to keep data)
-- DELETE FROM complaint_comments;
-- DELETE FROM complaint_logs;
-- DELETE FROM complaints;
-- DELETE FROM notifications;
-- DELETE FROM users;
-- DELETE FROM rooms;

-- Insert test users
-- Passwords are hashed versions of 'password123'
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XOvPAOziVBxPOm

INSERT IGNORE INTO users (college_id, password, role, name, email, mobile, hostel, dept, year, room_no)
VALUES 
  ('admin001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XOvPAOziVBxPOm', 'admin', 'Admin User', 'admin@hostelfix.com', '9876543210', NULL, NULL, NULL, NULL),
  ('caretaker001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XOvPAOziVBxPOm', 'caretaker', 'John Caretaker', 'caretaker@hostelfix.com', '9876543211', 'boys', NULL, NULL, NULL),
  ('caretaker002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XOvPAOziVBxPOm', 'caretaker', 'Jane Caretaker', 'caretaker2@hostelfix.com', '9876543212', 'girls', NULL, NULL, NULL),
  ('student001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XOvPAOziVBxPOm', 'student', 'Rahul Student', 'rahul@college.edu', '9876543213', 'boys', 'CSE', 2, '101'),
  ('student002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XOvPAOziVBxPOm', 'student', 'Priya Student', 'priya@college.edu', '9876543214', 'girls', 'ECE', 3, '201'),
  ('student003', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.XOvPAOziVBxPOm', 'student', 'Amit Kumar', 'amit@college.edu', '9876543215', 'boys', 'CSE', 2, '101');

-- Update student assignments
UPDATE users SET assigned_caretaker = 'caretaker001' WHERE college_id IN ('student001', 'student003');
UPDATE users SET assigned_caretaker = 'caretaker002' WHERE college_id = 'student002';

-- Insert rooms
INSERT IGNORE INTO rooms (room_no, hostel_type, capacity) VALUES
  ('101', 'boys', 4),
  ('102', 'boys', 4),
  ('103', 'boys', 4),
  ('201', 'girls', 4),
  ('202', 'girls', 4),
  ('203', 'girls', 4);

-- Insert sample complaints
INSERT INTO complaints (student_id, message, status, priority, assigned_to) VALUES
  ('student001', 'Water leakage in bathroom. The tap is broken and water is continuously flowing.', 'pending', 'urgent', 'caretaker001'),
  ('student001', 'Fan not working properly. Makes loud noise.', 'approved', 'normal', 'caretaker001'),
  ('student002', 'Window glass is cracked and needs replacement.', 'pending', 'normal', 'caretaker002'),
  ('student003', 'Electricity socket not working in room.', 'in_progress', 'urgent', 'caretaker001');

-- Add some complaint comments
INSERT INTO complaint_comments (complaint_id, caretaker_id, message) VALUES
  (2, 'caretaker001', 'Fan has been repaired. Issue resolved.');

-- Done!
SELECT 'Database seeded successfully!' as message;
SELECT CONCAT('Total users: ', COUNT(*)) as info FROM users;
SELECT CONCAT('Total rooms: ', COUNT(*)) as info FROM rooms;
SELECT CONCAT('Total complaints: ', COUNT(*)) as info FROM complaints;
