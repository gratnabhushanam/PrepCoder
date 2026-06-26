const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { db: { Concept, Question, Submission, User }, protect, syncUserStats } = require('shared');
const { executeCode } = require('../services/codeRunner');

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
