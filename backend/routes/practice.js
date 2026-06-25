const express = require('express');
const router = express.Router();
const { Mcq, Company, User } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/practice/topics
// @desc    Get all active MCQ categories with counts
router.get('/topics', async (req, res) => {
  try {
    const mcqs = await Mcq.find({ status: 'Active', isDeleted: { $ne: true } });
    const topicsMap = {};
    mcqs.forEach(m => {
      topicsMap[m.category] = (topicsMap[m.category] || 0) + 1;
    });
    
    const topicsList = Object.keys(topicsMap).map(category => ({
      name: category,
      count: topicsMap[category],
      icon: getTopicIcon(category)
    }));
    
    res.json(topicsList);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

function getTopicIcon(topic) {
  const icons = {
    "Java": "coffee",
    "OOPs": "box",
    "DBMS": "database",
    "Operating Systems": "cpu",
    "Computer Networks": "globe",
    "SQL": "terminal",
    "AWS": "cloud",
    "JavaScript": "code",
    "React": "layout",
    "Node.js": "server",
    "Aptitude": "percent",
    "Reasoning": "help-circle"
  };
  return icons[topic] || "book";
}

// @route   GET /api/practice/mcqs
// @desc    Get MCQs by category
router.get('/mcqs', async (req, res) => {
  const { topic } = req.query; // keeping query param name same for frontend compatibility or map it
  try {
    const query = { status: 'Active', isDeleted: { $ne: true } };
    if (topic) query.category = topic;
    const mcqs = await Mcq.find(query);
    res.json(mcqs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/practice/mcqs/random
// @desc    Get a random set of MCQs (Quiz Mode)
router.get('/mcqs/random', async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const { topic } = req.query;
  try {
    const query = { status: 'Active', isDeleted: { $ne: true } };
    if (topic) query.category = topic;
    const mcqs = await Mcq.find(query);
    
    // Shuffle and pick limit
    const shuffled = mcqs.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.max(0, Math.min(limit, shuffled.length)));
    
    // Map to old frontend structure (options array) for compatibility or let frontend handle it.
    // The frontend will be updated, so send new structure directly.
    res.json(selected);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/practice/mcqs/submit
// @desc    Submit quiz answers and update statistics
router.post('/mcqs/submit', protect, async (req, res) => {
  const { score, total, topic } = req.body;
  
  if (score === undefined || !total) {
    return res.status(400).json({ message: 'Missing score or total' });
  }
  
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Update stats
    const currentAttempted = user.mcqStats?.totalAttempted || 0;
    const currentCorrect = user.mcqStats?.correctAnswers || 0;
    const completedTopics = user.mcqStats?.topicsCompleted || [];
    
    const updatedStats = {
      totalAttempted: currentAttempted + total,
      correctAnswers: currentCorrect + score,
      topicsCompleted: topic && !completedTopics.includes(topic) 
        ? [...completedTopics, topic] 
        : completedTopics
    };
    
    // Calculate new placement readiness score
    // Base formula: readiness increases by 1 for each test completed, and extra bonus points based on correct answers
    const accuracy = score / total;
    const pointsGained = Math.round(accuracy * 5) + 1;
    const newReadiness = Math.min(100, (user.readinessScore || 45) + pointsGained);
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, 
      { 
        mcqStats: updatedStats,
        readinessScore: newReadiness,
        dailyStreak: (user.dailyStreak || 0) + 1
      }
    );
    
    res.json({
      message: 'Result saved successfully',
      readinessScore: newReadiness,
      pointsGained,
      mcqStats: updatedStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/practice/companies
// @desc    Get list of companies
router.get('/companies', async (req, res) => {
  try {
    const comps = await Company.find({});
    // Map with icons and backgrounds
    const companies = comps.map(c => ({
      _id: c._id,
      name: c.name,
      roundsCount: c.examPattern?.rounds?.length || 0,
      difficulty: c.examPattern?.difficulty || 'Medium',
      questionsCount: (c.previousQuestions?.length || 0) + (c.technicalQuestions?.length || 0)
    }));
    res.json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/practice/companies/:name
// @desc    Get detailed company profile
router.get('/companies/:name', async (req, res) => {
  try {
    const compName = req.params.name;
    // Perform case insensitive matching
    const company = await Company.findOne({ name: new RegExp(`^${compName}$`, 'i') });
    if (!company) {
      // Mock details as fallback
      return res.status(404).json({ message: 'Company not found' });
    }
    res.json(company);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/practice/leaderboard
// @desc    Get leaderboard rankings
router.get('/leaderboard', async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } });
    const ranked = users
      .map(u => ({
        _id: u._id,
        name: u.name,
        readinessScore: u.readinessScore || 45,
        dailyStreak: u.dailyStreak || 0,
        solvedProblemsCount: u.solvedProblems?.length || 0
      }))
      .sort((a, b) => b.readinessScore - a.readinessScore);
      
    res.json(ranked);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
