const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/mysql');
const { protect } = require('../middleware/authMiddleware');

const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET || 'supersecret-token-key-1234', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, 'user']
    );

    const newUserId = result.insertId;

    res.status(201).json({
      _id: newUserId,
      name,
      email,
      role: 'user',
      token: generateToken(newUserId, email, 'user'),
      readinessScore: 45,
      dailyStreak: 0,
      solvedProblems: []
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user.id, user.email, user.role),
      readinessScore: user.readinessScore,
      dailyStreak: user.dailyStreak,
      solvedProblems: user.solvedProblems || [],
      resumeData: user.resumeData || null
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length > 0) {
      const user = users[0];
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        readinessScore: user.readinessScore,
        dailyStreak: user.dailyStreak,
        solvedProblems: user.solvedProblems || [],
        mcqStats: user.mcqStats || { totalAttempted: 0, correctAnswers: 0, topicsCompleted: [] },
        aiInterviewStats: user.aiInterviewStats || [],
        resumeData: user.resumeData || null
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile data
router.put('/profile', protect, async (req, res) => {
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (users.length > 0) {
      let user = users[0];
      
      const newName = req.body.name || user.name;
      let newPassword = user.password;
      
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        newPassword = await bcrypt.hash(req.body.password, salt);
      }
      
      const newReadiness = req.body.readinessScore !== undefined ? req.body.readinessScore : user.readinessScore;
      const newStreak = req.body.dailyStreak !== undefined ? req.body.dailyStreak : user.dailyStreak;
      
      await pool.query(
        'UPDATE users SET name = ?, password = ?, readinessScore = ?, dailyStreak = ? WHERE id = ?',
        [newName, newPassword, newReadiness, newStreak, user.id]
      );
      
      res.json({
        _id: user.id,
        name: newName,
        email: user.email,
        role: user.role,
        readinessScore: newReadiness,
        dailyStreak: newStreak,
        solvedProblems: user.solvedProblems || []
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Reset password (Mock)
router.post('/forgot-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and new password required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, users[0].id]);
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
