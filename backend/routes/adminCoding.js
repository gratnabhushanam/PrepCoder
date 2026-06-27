const express = require('express');
const router = express.Router();
const { Concept, Question, User, Contest } = require('../config/db');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Add Concept
router.post('/concepts', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Concept name required' });

    const newConcept = await Concept.create({ name, description, icon });
    res.status(201).json({ message: 'Concept created', id: newConcept._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add concept' });
  }
});

// Delete User
router.delete('/users/:id', protect, adminOnly, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
});

// --- CONTEST ROUTES ---

// Create Contest
router.post('/contests', protect, adminOnly, async (req, res) => {
  try {
    const { title, description, startTime, endTime, duration, questions, status } = req.body;
    if (!title || !startTime || !endTime || !duration) {
      return res.status(400).json({ message: 'Missing required contest fields' });
    }
    
    const newContest = await Contest.create({
      title, description, startTime, endTime, duration, questions, status
    });
    
    res.status(201).json({ message: 'Contest created successfully', id: newContest._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create contest' });
  }
});

// Get Contests (Admin view)
router.get('/contests', protect, adminOnly, async (req, res) => {
  try {
    const contests = await Contest.find({ isDeleted: { $ne: true } })
      .populate('questions', 'title difficulty')
      .sort({ startTime: -1 })
      .lean();
    res.json(contests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch contests' });
  }
});

// Get Concepts
router.get('/concepts', protect, adminOnly, async (req, res) => {
  try {
    const concepts = await Concept.find().sort({ createdAt: -1 });
    res.json(concepts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch concepts' });
  }
});

// Upload Question
router.post('/questions', protect, adminOnly, async (req, res) => {
  try {
    const {
      concept_id, title, difficulty, statement, constraints,
      input_format, output_format, examples, hints, editorial, video_solution,
      companies, public_testcases, hidden_testcases, starterTemplates
    } = req.body;

    if (!title || !statement || !difficulty) {
      return res.status(400).json({ message: 'Missing required question fields' });
    }

    const newQuestion = await Question.create({
      concept_id: concept_id || null,
      title,
      difficulty,
      statement,
      constraints,
      input_format,
      output_format,
      examples: examples || [],
      hints: hints || [],
      editorial,
      video_solution,
      companies: companies || [],
      public_testcases: public_testcases || [],
      hidden_testcases: hidden_testcases || [],
      starterTemplates: starterTemplates || {}
    });

    res.status(201).json({ message: 'Question uploaded successfully', id: newQuestion._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload question' });
  }
});

// Get all questions (Admin view)
router.get('/questions', protect, adminOnly, async (req, res) => {
  try {
    const questions = await Question.find({ isDeleted: { $ne: true } })
      .populate('concept_id', 'name')
      .sort({ createdAt: -1 })
      .lean();

    const formattedQuestions = questions.map(q => ({
      ...q,
      id: q._id,
      concept_name: q.concept_id ? q.concept_id.name : null
    }));

    res.json(formattedQuestions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Get question by ID (Full Details)
router.get('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return res.status(404).json({ message: 'Question not found' });
    
    res.json(question);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch question details' });
  }
});

// Update Question
router.put('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    const questionId = req.params.id;
    const {
      concept_id, title, difficulty, statement, constraints,
      input_format, output_format, examples, hints, editorial, video_solution,
      companies, public_testcases, hidden_testcases, starterTemplates, status
    } = req.body;

    const updatedQuestion = await Question.findByIdAndUpdate(questionId, {
      concept_id: concept_id || null,
      title,
      difficulty,
      statement,
      constraints,
      input_format,
      output_format,
      examples: examples || [],
      hints: hints || [],
      editorial,
      video_solution,
      status: status || 'Active',
      companies: companies || [],
      public_testcases: public_testcases || [],
      hidden_testcases: hidden_testcases || [],
      starterTemplates: starterTemplates || {},
      updatedAt: new Date()
    }, { new: true });

    if (!updatedQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    res.json({ message: 'Question updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update question' });
  }
});

// Soft Delete Question
router.delete('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    const questionId = req.params.id;
    await Question.findByIdAndUpdate(questionId, { isDeleted: true });
    
    // Remove from all users' solvedProblems array to instantly update stats
    await User.updateMany(
      { solvedProblems: questionId },
      { $pull: { solvedProblems: questionId } }
    );
    const { UserStats } = require('../config/db');
    if (UserStats) {
      await UserStats.updateMany(
        { solvedProblems: questionId },
        { $pull: { solvedProblems: questionId } }
      );
    }
    
    res.json({ message: 'Question deleted successfully and user stats updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

module.exports = router;
