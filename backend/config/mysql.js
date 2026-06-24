const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coding_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initMySQL() {
  try {
    // We connect without database first to create it if it doesn't exist
    const tempConnection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'coding_platform'}\``);
    await tempConnection.end();

    console.log('⚡ Connected to MySQL successfully.');

    // 1. Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        readinessScore INT DEFAULT 45,
        dailyStreak INT DEFAULT 0,
        solvedProblems JSON,
        mcqStats JSON,
        aiInterviewStats JSON,
        resumeData JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Concepts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS concepts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Questions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        concept_id INT,
        title VARCHAR(255) NOT NULL,
        difficulty ENUM('Easy', 'Medium', 'Hard') NOT NULL,
        statement TEXT NOT NULL,
        constraints TEXT,
        input_format TEXT,
        output_format TEXT,
        examples JSON,
        hints JSON,
        editorial TEXT,
        video_solution VARCHAR(255),
        acceptance_rate DECIMAL(5, 2) DEFAULT 0.00,
        status ENUM('Active', 'Hidden') DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL
      )
    `);

    // Ensure status and updated_at exist if table was already created
    try {
      await pool.query("ALTER TABLE questions ADD COLUMN status ENUM('Active', 'Hidden') DEFAULT 'Active'");
    } catch (e) { /* Column might exist */ }
    try {
      await pool.query("ALTER TABLE questions ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    } catch (e) { /* Column might exist */ }

    // 4. Public Test Cases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public_testcases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    // 5. Hidden Test Cases
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hidden_testcases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        input TEXT NOT NULL,
        expected_output TEXT NOT NULL,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    // 6. Submissions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        question_id INT NOT NULL,
        code TEXT NOT NULL,
        language VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL, -- 'Accepted', 'Wrong Answer', 'Time Limit Exceeded', etc.
        execution_time INT DEFAULT 0,
        memory_used INT DEFAULT 0,
        passed_cases INT DEFAULT 0,
        total_cases INT DEFAULT 0,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
      )
    `);

    // 7. User Progress
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_progress (
        user_id INT PRIMARY KEY,
        total_solved INT DEFAULT 0,
        easy_solved INT DEFAULT 0,
        medium_solved INT DEFAULT 0,
        hard_solved INT DEFAULT 0,
        current_streak INT DEFAULT 0,
        last_submission_date DATE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // 8. Company Tags
    await pool.query(`
      CREATE TABLE IF NOT EXISTS company_tags (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE
      )
    `);

    // 9. Question Companies (Many to Many)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS question_companies (
        question_id INT NOT NULL,
        company_id INT NOT NULL,
        PRIMARY KEY (question_id, company_id),
        FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES company_tags(id) ON DELETE CASCADE
      )
    `);

    console.log('✅ MySQL Tables initialized successfully.');

    // Seed an admin user if none exists
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@prepai.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [adminEmail]);
    if (rows.length === 0) {
      const bcrypt = require('bcryptjs');
      const hash = await bcrypt.hash(adminPassword, 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin', adminEmail, hash, 'admin']
      );
      console.log(`✅ Seeded admin user: ${adminEmail}`);
    }

  } catch (error) {
    console.error('❌ MySQL Initialization Error:', error.message);
  }
}

module.exports = { pool, initMySQL };
