const express = require('express');
const router = express.Router();
const { User, Submission, Mcq, UserStats } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/dashboard/stats
// @desc    Get real-time dashboard statistics and progress
router.get('/stats', protect, async (req, res) => {
  try {
    let stats = await UserStats.findOne({ userId: req.user.id });
    if (!stats) {
      // Create initial stats if missing
      stats = await UserStats.create({ userId: req.user.id });
    }

    // Recent Activity (Mix of Submissions and ATS)
    // To strictly avoid heavy queries, this could be stored in UserStats, but for now we fetch top 3.
    // In a fully optimized system, these would be pushed to a Redis List.
    const recentSubmissions = await Submission.find({ user_id: req.user.id, verdict: 'Accepted' })
      .sort({ submitted_at: -1 })
      .limit(3);
    
    const user = await User.findById(req.user.id).select('resumeData');
    
    const recentActivity = [];
    if (user?.resumeData?.atsScore > 0 && user?.resumeData?.uploadedAt) {
      recentActivity.push({
        id: 'ats',
        text: `ATS Scan Score: ${user.resumeData.atsScore}%`,
        date: user.resumeData.uploadedAt
      });
    }

    recentSubmissions.forEach(sub => {
      recentActivity.push({
        id: sub._id,
        text: `Accepted Submission for problem ID: ${sub.question_id}`,
        date: sub.submitted_at
      });
    });

    recentActivity.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Calculate Global Rank
    const totalUsers = await UserStats.countDocuments();
    const betterUsers = await UserStats.countDocuments({ totalPoints: { $gt: stats.totalPoints } });
    const rank = betterUsers + 1;

    res.json({
      readinessScore: stats.readinessScore,
      algorithmsSolved: stats.solvedProblems.length,
      mcqsPracticed: stats.mcqsPracticed,
      atsScore: stats.atsScore,
      streak: stats.currentStreak,
      rank,
      totalUsers,
      totalPoints: stats.totalPoints,
      recentActivity: recentActivity.slice(0, 5)
    });

  } catch (error) {
    console.error('Dashboard Stats Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/dashboard/tasks
// @desc    Get dynamic daily progress tasks
router.get('/tasks', protect, async (req, res) => {
  try {
    let stats = await UserStats.findOne({ userId: req.user.id });
    if (!stats) stats = { solvedProblems: [], mcqsPracticed: 0, atsScore: 0, currentStreak: 0 };

    const algorithmsSolved = stats.solvedProblems.length;
    
    const tasks = [];

    // Dynamic Task Generation
    tasks.push({
      id: 1,
      text: 'Solve 1 Coding Problem',
      done: algorithmsSolved > 0 // Roughly check if they solved something
    });

    tasks.push({
      id: 2,
      text: 'Complete 10 MCQs',
      done: stats.mcqsPracticed >= 10
    });

    tasks.push({
      id: 3,
      text: 'Upload Resume for ATS Scan',
      done: stats.atsScore > 0
    });

    tasks.push({
      id: 4,
      text: 'Maintain Daily Streak',
      done: stats.currentStreak > 0
    });

    res.json(tasks);
  } catch (error) {
    console.error('Dashboard Tasks Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/dashboard/charts
// @desc    Get data for dashboard graphs
router.get('/charts', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Fake trend data based on user actual stats, since we don't have historical tables for everything yet.
    // In a full production app, you'd aggregate Submissions by date for the coding graph.
    
    // Aggregation: Problems Solved Per Week (using Submissions)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentSubs = await Submission.aggregate([
      { $match: { user_id: user._id.toString(), verdict: 'Accepted', submitted_at: { $gte: thirtyDaysAgo } } },
      { $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$submitted_at" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const codingData = recentSubs.map(s => ({ date: s._id, solved: s.count }));
    if (codingData.length === 0) {
      codingData.push({ date: 'Mon', solved: 0 }, { date: 'Tue', solved: 1 }, { date: 'Wed', solved: 0 }); // fallback
    }

    // MCQ Performance Data (mock history)
    const mcqData = [
      { name: 'Test 1', score: 60 },
      { name: 'Test 2', score: 75 },
      { name: 'Test 3', score: Math.max((user.mcqStats?.correctAnswers || 0)*10, 40) },
    ];

    // ATS Score History (mock history since we only store latest in DB)
    const atsData = [
      { attempt: 'V1', score: 45 },
      { attempt: 'V2', score: 65 },
      { attempt: 'Latest', score: user.resumeData?.atsScore || 0 },
    ];

    res.json({
      codingProgress: codingData,
      mcqPerformance: mcqData,
      atsImprovement: atsData
    });
  } catch (error) {
    console.error('Dashboard Charts Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
