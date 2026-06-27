const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Concept, Question, Submission, User, Contest } = require('../config/db');
const { executeCode } = require('../services/codeRunner');
const { syncUserStats } = require('../utils/statsUpdater');
const { protect } = require('../middleware/authMiddleware');
const redisClient = require('../config/redis');
const { submissionQueue, processSubmission } = require('../queues/submissionQueue');

// @route   GET /api/coding/public/trending
// @desc    Get top trending questions for the home page (Public)
router.get('/public/trending', async (req, res) => {
  try {
    const questions = await Question.find({ status: 'Active', isDeleted: { $ne: true } })
      .select('title difficulty')
      .limit(5)
      .lean();
    
    const formatted = questions.map((q, i) => ({
      _id: q._id,
      title: `${i + 1}. ${q.title}`,
      diff: q.difficulty,
      acc: q.difficulty === 'Easy' ? '62.4%' : (q.difficulty === 'Medium' ? '45.1%' : '31.8%')
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching trending questions:', error);
    res.status(500).json({ message: 'Server Error fetching trending questions' });
  }
});

// @route   GET /api/coding/concepts
// @desc    Get all concepts and user progress
router.get('/concepts', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const concepts = await Concept.find().lean();
    const questions = await Question.find({ status: 'Active', isDeleted: { $ne: true } }).lean();
    
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
    const query = { status: 'Active', isDeleted: { $ne: true } };
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
        acceptance_rate: total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0',
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
    if (!question || question.isDeleted) return res.status(404).json({ message: 'Problem not found' });

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

// @route   GET /api/coding/submissions
// @desc    Get user submissions history
router.get('/submissions', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const submissions = await Submission.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .populate('question_id', 'title difficulty concept_id')
      .lean();
    
    res.json(submissions);
  } catch (error) {
    console.error('Fetch submissions error:', error);
    res.status(500).json({ message: 'Server Error' });
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

    // 1. Save Pending Submission
    const submission = new Submission({
      user_id: userId,
      question_id: problemId,
      code,
      language,
      status: 'Pending',
      passed_cases: 0,
      total_cases: allCases.length,
      execution_time: 0,
      memory_used: 0
    });
    await submission.save();

    // 2. Add job to Queue or execute inline asynchronously if Redis is offline
    const jobData = {
      submissionId: submission._id,
      userId,
      questionId: problemId,
      code,
      language,
      cases: allCases
    };

    if (redisClient.status === 'ready') {
      await submissionQueue.add('submission', jobData);
    } else {
      const io = req.app.get('io');
      // Fire and forget (runs asynchronously)
      processSubmission(jobData, io).catch(e => console.error("Fallback process error:", e));
    }

    res.json({
      status: 'Pending',
      submissionId: submission._id,
      message: redisClient.status === 'ready' ? 'Submission enqueued successfully' : 'Submission processing started (fallback mode)'
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
