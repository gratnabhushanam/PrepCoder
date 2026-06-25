const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Concept, Question, Submission, User } = require('../config/db');
const { executeCode } = require('../services/codeRunner');
const { syncUserStats } = require('../utils/statsUpdater');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/coding/concepts
// @desc    Get all concepts and user progress
router.get('/concepts', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const concepts = await Concept.find().lean();
    const questions = await Question.find({ status: 'Active' }).lean();
    
    // Get user's accepted submissions
    const acceptedSubs = await Submission.find({ 
      user_id: userId, 
      status: 'Accepted' 
    }).distinct('question_id');

    const acceptedQuestionIds = new Set(acceptedSubs.map(id => id.toString()));

    const formattedConcepts = concepts.map(c => {
      const conceptQuestions = questions.filter(q => q.concept_id && q.concept_id.toString() === c._id.toString());
      
      const totalCount = conceptQuestions.length;
      const easyCount = conceptQuestions.filter(q => q.difficulty === 'Easy').length;
      const mediumCount = conceptQuestions.filter(q => q.difficulty === 'Medium').length;
      const hardCount = conceptQuestions.filter(q => q.difficulty === 'Hard').length;
      
      const solvedCount = conceptQuestions.filter(q => acceptedQuestionIds.has(q._id.toString())).length;

      return {
        id: c._id,
        name: c.name,
        description: c.description,
        icon: c.icon,
        totalCount,
        easyCount,
        mediumCount,
        hardCount,
        progress: totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0
      };
    });

    res.json(formattedConcepts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/coding/questions
// @desc    Get questions filtered by concept, difficulty, company
router.get('/questions', protect, async (req, res) => {
  const { concept_id, difficulty, company } = req.query;
  const userId = req.user._id || req.user.id;

  try {
    const query = { status: 'Active' };
    if (concept_id) query.concept_id = concept_id;
    if (difficulty) query.difficulty = difficulty;
    if (company) query.companies = company;

    const questions = await Question.find(query).populate('concept_id', 'name').lean();

    // Fetch user's accepted questions
    const userAcceptedSubs = await Submission.find({ 
      user_id: userId, 
      status: 'Accepted' 
    }).distinct('question_id');
    const acceptedIds = new Set(userAcceptedSubs.map(id => id.toString()));

    // Aggregate overall submission stats per question
    const stats = await Submission.aggregate([
      {
        $group: {
          _id: "$question_id",
          solved_users: { $addToSet: { $cond: [{ $eq: ["$status", "Accepted"] }, "$user_id", null] } },
          total_subs: { $sum: 1 },
          accepted_subs: { $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] } }
        }
      }
    ]);

    const statsMap = {};
    stats.forEach(s => {
      // Remove null from addToSet
      const validUsers = s.solved_users.filter(u => u !== null);
      statsMap[s._id.toString()] = {
        solved_users: validUsers.length,
        total_subs: s.total_subs,
        accepted_subs: s.accepted_subs
      };
    });

    const formattedQuestions = questions.map(q => {
      const stat = statsMap[q._id.toString()] || { solved_users: 0, total_subs: 0, accepted_subs: 0 };
      const total = stat.total_subs;
      const accepted = stat.accepted_subs;

      return {
        id: q._id,
        title: q.title,
        difficulty: q.difficulty,
        concept_name: q.concept_id ? q.concept_id.name : null,
        is_solved: acceptedIds.has(q._id.toString()),
        solved_users: stat.solved_users,
        acceptance_rate: total > 0 ? ((accepted / total) * 100).toFixed(2) : '0.00',
        companies: q.companies || []
      };
    });

    res.json(formattedQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/coding/problem/:id
// @desc    Get single problem by ID with public testcases
router.get('/problem/:id', protect, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).lean();
    if (!question) return res.status(404).json({ message: 'Problem not found' });

    const userId = req.user._id || req.user.id;
    
    const is_solved = await Submission.exists({ 
      user_id: userId, 
      question_id: question._id, 
      status: 'Accepted' 
    });

    const lastSub = await Submission.findOne({ 
      user_id: userId, 
      question_id: question._id 
    }).sort({ submitted_at: -1 }).lean();

    res.json({
      id: question._id,
      title: question.title,
      difficulty: question.difficulty,
      statement: question.statement,
      constraints: question.constraints,
      inputFormat: question.input_format,
      outputFormat: question.output_format,
      examples: question.examples || [],
      hints: question.hints || [],
      companies: question.companies || [],
      testCases: question.public_testcases || [],
      starterTemplates: question.starterTemplates || {},
      is_solved: !!is_solved,
      last_code: lastSub ? lastSub.code : null,
      last_language: lastSub ? lastSub.language : null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/coding/run
// @desc    Execute code against sample test cases (Non-hidden)
router.post('/run', async (req, res) => {
  const { problemId, language, code } = req.body;
  if (!problemId || !language || !code) return res.status(400).json({ message: 'Missing fields' });

  try {
    const question = await Question.findById(problemId).lean();
    if (!question) return res.status(404).json({ message: 'Problem not found' });

    const formattedCases = (question.public_testcases || []).map(tc => ({ 
      input: tc.input, 
      expected: tc.expected_output,
      isHidden: false 
    }));
    
    const results = await executeCode(question.title, language, code, formattedCases);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Execution failed' });
  }
});

// @route   POST /api/coding/submit
// @desc    Submit code, evaluate all cases, save submission
router.post('/submit', protect, async (req, res) => {
  const { problemId, language, code } = req.body;
  const userId = req.user._id || req.user.id;

  if (!problemId || !language || !code) return res.status(400).json({ message: 'Missing fields' });

  try {
    const question = await Question.findById(problemId).lean();
    if (!question) return res.status(404).json({ message: 'Problem not found' });

    const publicCases = (question.public_testcases || []).map(tc => ({ input: tc.input, expected: tc.expected_output, isHidden: false }));
    const hiddenCases = (question.hidden_testcases || []).map(tc => ({ input: tc.input, expected: tc.expected_output, isHidden: true }));
    
    const allCases = [...publicCases, ...hiddenCases];

    // Synchronous execution fallback (No Redis required)
    const results = await executeCode('Submission', language, code, allCases);
    
    const totalCases = allCases.length;
    const passedCases = results.filter(r => r.passed).length;
    const isAccepted = passedCases === totalCases;
    
    let finalVerdict = 'Accepted';
    if (!isAccepted) {
      const firstFailed = results.find(r => !r.passed);
      if (firstFailed?.error) {
        if (firstFailed.error.includes('Time Limit Exceeded') || firstFailed.error.includes('timed out')) {
          finalVerdict = 'Time Limit Exceeded';
        } else if (firstFailed.error.includes('Compilation Error')) {
          finalVerdict = 'Compilation Error';
        } else {
          finalVerdict = 'Runtime Error';
        }
      } else {
        finalVerdict = 'Wrong Answer';
      }
    }

    // Save Submission
    const submission = new Submission({
      user_id: userId,
      question_id: problemId,
      code,
      language,
      status: finalVerdict,
      passed_cases: passedCases,
      total_cases: totalCases,
      execution_time: Math.max(...results.map(r => r.time || 0)),
      memory_used: Math.max(...results.map(r => r.memory || 0))
    });
    await submission.save();

    // If Accepted, update user stats
    let user = await User.findById(userId);
    if (isAccepted && user) {
      if (!user.solvedProblems) user.solvedProblems = [];
      if (!user.solvedProblems.includes(problemId.toString())) {
        user.solvedProblems.push(problemId.toString());
        
        const today = new Date().toISOString().split('T')[0];
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;
        if (lastActive !== today) {
          user.dailyStreak = (user.dailyStreak || 0) + 1;
          user.lastActiveDate = new Date();
        }
        await user.save();
        await syncUserStats(userId);
      }
    }

    const UserStats = require('../models/UserStats');
    const stats = await UserStats.findOne({ userId }) || {};
    
    // Calculate total submissions and acceptance rate
    const allUserSubs = await Submission.find({ user_id: userId });
    const totalSubmissions = allUserSubs.length;
    const acceptedSubs = allUserSubs.filter(s => s.status === 'Accepted').length;
    const acceptanceRate = totalSubmissions > 0 ? Math.round((acceptedSubs / totalSubmissions) * 100) : 0;

    // Calculate difficulty breakdown
    let easySolved = 0, mediumSolved = 0, hardSolved = 0;
    if (stats.solvedProblems && stats.solvedProblems.length > 0) {
      const solvedQs = await Question.find({ _id: { $in: stats.solvedProblems } });
      solvedQs.forEach(q => {
        if (q.difficulty === 'Easy') easySolved++;
        else if (q.difficulty === 'Medium') mediumSolved++;
        else if (q.difficulty === 'Hard') hardSolved++;
      });
    }

    res.json({
      status: finalVerdict,
      passedCases,
      totalCases,
      results: [], // Hide detailed hidden case results
      stats: {
        totalSolved: stats.solvedProblems?.length || 0,
        easySolved,
        mediumSolved,
        hardSolved,
        currentStreak: stats.currentStreak || 0,
        longestStreak: stats.longestStreak || 0,
        totalSubmissions,
        acceptanceRate
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Submission processing failed' });
  }
});

// GET user submissions for a specific problem
router.get('/submissions', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const problemId = req.query.problemId;
    
    if (!problemId) {
      return res.status(400).json({ message: 'problemId is required' });
    }

    const subs = await Submission.find({ 
      user_id: userId, 
      question_id: problemId 
    }).sort({ submitted_at: -1 }).lean();

    res.json(subs.map(s => ({
      ...s,
      id: s._id
    })));
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

module.exports = router;
