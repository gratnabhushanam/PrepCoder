const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { User } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: { message: 'Too many login attempts from this IP, please try again after 15 minutes' },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 register requests per hour
  message: { message: 'Too many accounts created from this IP, please try again after an hour' },
});

const generateToken = (id, email, role) => {
  return jwt.sign({ id, email, role }, process.env.JWT_SECRET || 'supersecret-token-key-1234', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @route   POST /api/auth/register
// @desc    Register new user
router.post('/register', registerLimiter, async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please add all fields' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    res.status(201).json({
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token: generateToken(newUser._id, newUser.email, newUser.role),
      readinessScore: newUser.readinessScore,
      dailyStreak: newUser.dailyStreak,
      solvedProblems: newUser.solvedProblems
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user
router.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.email, user.role),
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
    const user = await User.findById(req.user.id);
    if (user) {
      res.json({
        _id: user._id,
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
    const user = await User.findById(req.user.id);
    if (user) {
      user.name = req.body.name || user.name;
      
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
      
      if (req.body.readinessScore !== undefined) {
        user.readinessScore = req.body.readinessScore;
      }
      
      if (req.body.dailyStreak !== undefined) {
        user.dailyStreak = req.body.dailyStreak;
      }
      
      await user.save();
      
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        readinessScore: user.readinessScore,
        dailyStreak: user.dailyStreak,
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
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    await user.save();
    
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
