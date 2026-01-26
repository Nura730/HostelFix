// Database Seed Script
// Run: node seed.js

require("dotenv").config();
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");

async function seed() {
  console.log("🌱 Starting database seed...\n");

  const pool = await mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
  });

  try {
    // Create tables
    console.log("📋 Creating tables...");

    await pool.query(`
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        room_no VARCHAR(20) NOT NULL,
        hostel_type ENUM('boys', 'girls') NOT NULL,
        capacity INT DEFAULT 4,
        UNIQUE KEY unique_room (room_no, hostel_type)
      )
    `);

    await pool.query(`
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
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaint_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id INT NOT NULL,
        old_status VARCHAR(20),
        new_status VARCHAR(20),
        changed_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS complaint_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        complaint_id INT NOT NULL,
        caretaker_id VARCHAR(50),
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        from_user VARCHAR(50),
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("✅ Tables created\n");

    // Hash password
    const password = await bcrypt.hash("password123", 12);
    console.log("🔐 Password hash generated\n");

    // Create users
    console.log("👥 Creating users...");

    const users = [
      {
        college_id: "admin001",
        role: "admin",
        name: "Admin User",
        email: "admin@hostelfix.com",
        mobile: "9876543210",
      },
      {
        college_id: "caretaker001",
        role: "caretaker",
        name: "John Caretaker",
        email: "caretaker@hostelfix.com",
        mobile: "9876543211",
        hostel: "boys",
      },
      {
        college_id: "caretaker002",
        role: "caretaker",
        name: "Jane Caretaker",
        email: "caretaker2@hostelfix.com",
        mobile: "9876543212",
        hostel: "girls",
      },
      {
        college_id: "student001",
        role: "student",
        name: "Rahul Student",
        email: "rahul@college.edu",
        mobile: "9876543213",
        hostel: "boys",
        dept: "CSE",
        year: 2,
        room_no: "101",
      },
      {
        college_id: "student002",
        role: "student",
        name: "Priya Student",
        email: "priya@college.edu",
        mobile: "9876543214",
        hostel: "girls",
        dept: "ECE",
        year: 3,
        room_no: "201",
      },
      {
        college_id: "student003",
        role: "student",
        name: "Amit Kumar",
        email: "amit@college.edu",
        mobile: "9876543215",
        hostel: "boys",
        dept: "CSE",
        year: 2,
        room_no: "101",
      },
    ];

    for (const u of users) {
      try {
        await pool.query(
          `INSERT INTO users (college_id, password, role, name, email, mobile, hostel, dept, year, room_no)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE password = ?, name = ?`,
          [
            u.college_id,
            password,
            u.role,
            u.name,
            u.email,
            u.mobile,
            u.hostel || null,
            u.dept || null,
            u.year || null,
            u.room_no || null,
            password,
            u.name,
          ],
        );
        console.log(`   ✓ ${u.role}: ${u.college_id}`);
      } catch (err) {
        console.log(`   ⚠ ${u.college_id}: ${err.message}`);
      }
    }

    // Assign caretakers
    await pool.query(
      "UPDATE users SET assigned_caretaker = 'caretaker001' WHERE college_id IN ('student001', 'student003')",
    );
    await pool.query(
      "UPDATE users SET assigned_caretaker = 'caretaker002' WHERE college_id = 'student002'",
    );
    console.log("   ✓ Caretakers assigned\n");

    // Create rooms
    console.log("🚪 Creating rooms...");
    const rooms = [
      { room_no: "101", hostel_type: "boys", capacity: 4 },
      { room_no: "102", hostel_type: "boys", capacity: 4 },
      { room_no: "103", hostel_type: "boys", capacity: 4 },
      { room_no: "201", hostel_type: "girls", capacity: 4 },
      { room_no: "202", hostel_type: "girls", capacity: 4 },
      { room_no: "203", hostel_type: "girls", capacity: 4 },
    ];

    for (const r of rooms) {
      try {
        await pool.query(
          "INSERT IGNORE INTO rooms (room_no, hostel_type, capacity) VALUES (?, ?, ?)",
          [r.room_no, r.hostel_type, r.capacity],
        );
      } catch (err) {}
    }
    console.log("   ✓ 6 rooms created\n");

    // Create complaints
    console.log("📝 Creating sample complaints...");
    const complaints = [
      {
        student_id: "student001",
        message: "Water leakage in bathroom. The tap is broken.",
        status: "pending",
        priority: "urgent",
        assigned_to: "caretaker001",
      },
      {
        student_id: "student001",
        message: "Fan not working properly. Makes loud noise.",
        status: "approved",
        priority: "normal",
        assigned_to: "caretaker001",
      },
      {
        student_id: "student002",
        message: "Window glass is cracked and needs replacement.",
        status: "pending",
        priority: "normal",
        assigned_to: "caretaker002",
      },
      {
        student_id: "student003",
        message: "Electricity socket not working in room.",
        status: "in_progress",
        priority: "urgent",
        assigned_to: "caretaker001",
      },
    ];

    for (const c of complaints) {
      try {
        await pool.query(
          "INSERT INTO complaints (student_id, message, status, priority, assigned_to) VALUES (?, ?, ?, ?, ?)",
          [c.student_id, c.message, c.status, c.priority, c.assigned_to],
        );
      } catch (err) {}
    }
    console.log("   ✓ 4 complaints created\n");

    // Summary
    const [userCount] = await pool.query("SELECT COUNT(*) as count FROM users");
    const [roomCount] = await pool.query("SELECT COUNT(*) as count FROM rooms");
    const [complaintCount] = await pool.query(
      "SELECT COUNT(*) as count FROM complaints",
    );

    console.log("═══════════════════════════════════════");
    console.log("🎉 Database seeded successfully!");
    console.log("═══════════════════════════════════════");
    console.log(`   Users: ${userCount[0].count}`);
    console.log(`   Rooms: ${roomCount[0].count}`);
    console.log(`   Complaints: ${complaintCount[0].count}`);
    console.log("\n📋 Test Accounts (password: password123):");
    console.log("   • Admin: admin001");
    console.log("   • Caretaker (Boys): caretaker001");
    console.log("   • Caretaker (Girls): caretaker002");
    console.log("   • Student: student001, student002, student003");
    console.log("═══════════════════════════════════════\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await pool.end();
  }
}

seed();
