const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Concept, Question, Submission, User } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const { executeCode } = require('../services/codeRunner');

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

    const results = await executeCode(question.title, language, code, allCases);
    
    const totalCases = results.length;
    const passedCases = results.filter(r => r.passed).length;
    
    let status = 'Accepted';
    let runtimeErr = results.find(r => r.error);
    if (runtimeErr) {
      status = runtimeErr.error.includes('timed out') ? 'Time Limit Exceeded' : 'Runtime Error';
    } else if (passedCases < totalCases) {
      status = 'Wrong Answer';
    }

    // Save submission
    await Submission.create({
      user_id: userId,
      question_id: problemId,
      code,
      language,
      status,
      passed_cases: passedCases,
      total_cases: totalCases,
      execution_time: Math.floor(Math.random() * 50) + 10 // Mock execution time
    });

    let user = await User.findById(userId);

    if (status === 'Accepted') {
      // Check if previously accepted
      const prevAccepted = await Submission.exists({ 
        user_id: userId, 
        question_id: problemId, 
        status: 'Accepted',
        _id: { $ne: null } // Just needs to exist other than this one if we wanted to be strict, but we already created it. Wait, we just created it.
      });

      // Actually, since we JUST created the accepted submission, finding one will ALWAYS return true.
      // We need to count accepted submissions for this user and question. If it's exactly 1, it's the first time.
      const acceptedCount = await Submission.countDocuments({
        user_id: userId,
        question_id: problemId,
        status: 'Accepted'
      });

      if (acceptedCount === 1) {
        // First time solved!
        user.userProgress.total_solved += 1;
        if (question.difficulty === 'Easy') user.userProgress.easy_solved += 1;
        if (question.difficulty === 'Medium') user.userProgress.medium_solved += 1;
        if (question.difficulty === 'Hard') user.userProgress.hard_solved += 1;
        
        user.userProgress.current_streak += 1; // Simple streak logic
        if (!user.solvedProblems) user.solvedProblems = [];
        if (!user.solvedProblems.includes(problemId.toString())) {
          user.solvedProblems.push(problemId.toString());
        }
        await user.save();
      }
    }

    // Aggregating user submission stats
    const totalSubmissionsCount = await Submission.countDocuments({ user_id: userId });
    const acceptedSubmissionsCount = await Submission.countDocuments({ user_id: userId, status: 'Accepted' });
    const acceptanceRate = totalSubmissionsCount > 0 ? Math.round((acceptedSubmissionsCount / totalSubmissionsCount) * 100) : 0;

    res.json({
      status,
      passedCases,
      totalCases,
      results: results.map(r => ({
        passed: r.passed,
        isHidden: r.isHidden,
        error: r.error,
        input: r.isHidden ? 'Hidden' : r.input,
        output: r.isHidden ? 'Hidden' : r.output,
        expected: r.isHidden ? 'Hidden' : r.expected
      })),
      stats: {
        totalSolved: user.userProgress?.total_solved || 0,
        easySolved: user.userProgress?.easy_solved || 0,
        mediumSolved: user.userProgress?.medium_solved || 0,
        hardSolved: user.userProgress?.hard_solved || 0,
        currentStreak: user.userProgress?.current_streak || 0,
        longestStreak: user.userProgress?.current_streak || 0,
        totalSubmissions: totalSubmissionsCount,
        acceptanceRate: acceptanceRate
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
