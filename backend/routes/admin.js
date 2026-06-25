const express = require('express');
const router = express.Router();
const { User, Mcq, Question, Submission, Company } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/admin/analytics
// @desc    Retrieve aggregated system-wide analytics
router.get('/analytics', protect, async (req, res) => {
  try {
    const users = await User.find({});
    const mcqs = await Mcq.find({});
    const problems = await Question.find({});
    const submissions = await Submission.find({});
    const companies = await Company.find({});

    // Count difficulty levels
    const diffMap = { Easy: 0, Medium: 0, Hard: 0 };
    problems.forEach(p => {
      if (diffMap[p.difficulty] !== undefined) {
        diffMap[p.difficulty]++;
      }
    });

    // Submissions status breakdown
    const statusMap = {};
    submissions.forEach(s => {
      statusMap[s.status] = (statusMap[s.status] || 0) + 1;
    });

    // Top students rankings
    const sortedUsers = [...users]
      .sort((a, b) => (b.readinessScore || 0) - (a.readinessScore || 0))
      .slice(0, 10)
      .map(u => ({
        name: u.name,
        email: u.email,
        readinessScore: u.readinessScore || 45,
        solvedCount: u.solvedProblems?.length || 0
      }));

    let totalSolvedProblems = 0;
    let totalMcqAttempts = 0;
    users.forEach(u => {
      totalSolvedProblems += (u.solvedProblems?.length || 0);
      totalMcqAttempts += (u.mcqStats?.totalAttempted || 0);
    });

    res.json({
      summary: {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.solvedProblems?.length > 0 || u.mcqStats?.totalAttempted > 0).length,
        newUsersToday: users.filter(u => new Date(u.createdAt).toDateString() === new Date().toDateString()).length,
        adminUsers: users.filter(u => u.role === 'admin').length,
        totalQuestions: problems.length + mcqs.length,
        totalCodingQuestions: problems.length,
        totalMcqQuestions: mcqs.length,
        totalSubmissions: submissions.length,
        acceptedSolutions: submissions.filter(s => s.status === 'Accepted').length,
        easyProblems: diffMap.Easy,
        mediumProblems: diffMap.Medium,
        hardProblems: diffMap.Hard,
        activeProblems: problems.filter(p => p.status === 'Active' && !p.isDeleted).length,
        deletedQuestions: problems.filter(p => p.isDeleted).length + mcqs.filter(m => m.isDeleted).length,
        totalSolvedProblems,
        totalMcqAttempts
      },
      difficultyDistribution: diffMap,
      submissionsStatus: statusMap,
      topStudents: sortedUsers,
      users: users.map(u => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        readinessScore: u.readinessScore || 45,
        dailyStreak: u.dailyStreak || 0
      }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error loading analytics' });
  }
});

// @route   GET /api/admin/analytics/realtime
// @desc    Retrieve data for charts (last 30 days)
router.get('/analytics/realtime', protect, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Daily User Registrations (Last 30 Days)
    const users = await User.find({ createdAt: { $gte: thirtyDaysAgo } }, 'createdAt');
    const registrationsByDay = {};
    users.forEach(u => {
      const date = new Date(u.createdAt).toISOString().split('T')[0];
      registrationsByDay[date] = (registrationsByDay[date] || 0) + 1;
    });
    const registrationData = Object.keys(registrationsByDay).map(date => ({
      date, count: registrationsByDay[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Daily Problem Solves (Last 30 Days)
    const submissions = await Submission.find({ 
      submitted_at: { $gte: thirtyDaysAgo },
      status: 'Accepted'
    }, 'submitted_at submittedAt');
    const solvesByDay = {};
    submissions.forEach(s => {
      const date = new Date(s.submitted_at || s.submittedAt).toISOString().split('T')[0];
      solvesByDay[date] = (solvesByDay[date] || 0) + 1;
    });
    const solveData = Object.keys(solvesByDay).map(date => ({
      date, count: solvesByDay[date]
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json({
      registrationData,
      solveData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch realtime analytics' });
  }
});

// @route   GET /api/admin/mcqs
// @desc    Retrieve all MCQs for Admin Table
router.get('/mcqs', protect, async (req, res) => {
  try {
    const mcqs = await Mcq.find({ isDeleted: { $ne: true } });
    // Sort by newest first
    mcqs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(mcqs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch MCQs' });
  }
});

// @route   POST /api/admin/mcqs
// @desc    Add new MCQ to the collection
router.post('/mcqs', protect, async (req, res) => {
  const { question, description, optionA, optionB, optionC, optionD, correctAnswer, difficulty, category, points, status } = req.body;
  if (!question || !optionA || !optionB || !optionC || !optionD || !correctAnswer || !category) {
    return res.status(400).json({ message: 'Please add all required MCQ fields.' });
  }

  try {
    const newMcq = await Mcq.create({
      question,
      description,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      difficulty: difficulty || 'Medium',
      category,
      points: points || 1,
      status: status || 'Active'
    });
    res.status(201).json(newMcq);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create MCQ' });
  }
});

// @route   PUT /api/admin/mcqs/:id
// @desc    Update MCQ by ID
router.put('/mcqs/:id', protect, async (req, res) => {
  try {
    const updatedMcq = await Mcq.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedMcq) return res.status(404).json({ message: 'MCQ not found' });
    res.json(updatedMcq);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update MCQ' });
  }
});

// @route   DELETE /api/admin/mcqs/:id
// @desc    Soft Delete MCQ by ID
router.delete('/mcqs/:id', protect, async (req, res) => {
  try {
    await Mcq.findByIdAndUpdate(req.params.id, { isDeleted: true });
    res.json({ message: 'MCQ deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete MCQ' });
  }
});

// @route   POST /api/admin/problems
// @desc    Add new Coding Problem
router.post('/problems', protect, async (req, res) => {
  const { title, description, difficulty, category, testCases, starterTemplates, companyTags } = req.body;
  if (!title || !description || !difficulty || !testCases) {
    return res.status(400).json({ message: 'Please specify title, description, difficulty, and testCases' });
  }

  try {
    const newProb = await Question.create({
      title,
      description,
      difficulty,
      category: category || 'General',
      testCases,
      starterTemplates: starterTemplates || {
        javascript: 'function solve() {\n  // Code\n}',
        python: 'def solve():\n    pass',
        java: 'public class Solution {\n    // Code\n}'
      },
      companyTags: companyTags || []
    });
    res.status(201).json(newProb);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create coding problem' });
  }
});

// @route   POST /api/admin/companies
// @desc    Add or update Company info
router.post('/companies', protect, async (req, res) => {
  const { name, examPattern, previousQuestions, interviewExperiences, technicalQuestions, hrQuestions } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Company name is required' });
  }

  try {
    const newComp = await Company.create({
      name,
      examPattern: examPattern || { rounds: [], syllabus: [], difficulty: 'Medium' },
      previousQuestions: previousQuestions || [],
      interviewExperiences: interviewExperiences || [],
      technicalQuestions: technicalQuestions || [],
      hrQuestions: hrQuestions || []
    });
    res.status(201).json(newComp);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create company profile' });
  }
});

module.exports = router;
