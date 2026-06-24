const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { protect } = require('../middleware/authMiddleware');
const { User } = require('../config/db');
const { analyzeResume, getInterviewFeedback, getMentorPlan } = require('../services/gemini');

// Configure Multer storage in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF format is supported for resume upload.'), false);
    }
  }
});

// @route   POST /api/ai/resume-check
// @desc    Upload resume PDF, parse text, calculate ATS score & suggestions
router.post('/resume-check', protect, upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a PDF resume file.' });
  }

  try {
    // Extract text from PDF buffer
    const pdfData = await pdfParse(req.file.buffer);
    const resumeText = pdfData.text;

    if (!resumeText || resumeText.trim().length === 0) {
      return res.status(400).json({ message: 'Could not extract text from the PDF. Ensure it contains selectable text.' });
    }

    // Call Gemini API / Fallback to analyze
    const analysis = await analyzeResume(resumeText);
    
    // Save resume results to User profile
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const newResumeData = {
      atsScore: analysis.atsScore,
      skills: analysis.skills,
      missingKeywords: analysis.missingKeywords,
      suggestions: analysis.suggestions,
      uploadedAt: new Date()
    };

    // Increment readiness score by 10 points for completing resume evaluation
    const prevScore = user.readinessScore || 45;
    const newReadiness = Math.min(100, prevScore + 10);

    await User.findByIdAndUpdate(req.user._id, {
      resumeData: newResumeData,
      readinessScore: newReadiness
    });

    res.json({
      message: 'Resume analyzed successfully',
      readinessScore: newReadiness,
      analysis: newResumeData
    });

  } catch (error) {
    console.error('Resume checker error:', error);
    res.status(500).json({ message: error.message || 'Failed to process resume' });
  }
});

// @route   POST /api/ai/interview
// @desc    Conduct interactive AI interview question-answering rounds
router.post('/interview', protect, async (req, res) => {
  const { interviewType, history, latestAnswer } = req.body;
  if (!interviewType || !history) {
    return res.status(400).json({ message: 'Missing interviewType or chat history' });
  }

  try {
    // Get next question and grading details
    const step = await getInterviewFeedback(interviewType, history, latestAnswer);
    
    // If interview is marked completed and we just finished graded rounds, save the final interview scores to user profile
    if (step.question.toLowerCase().includes('complete') && latestAnswer) {
      const user = await User.findById(req.user._id);
      if (user) {
        // Collect scores
        const newStats = {
          interviewType,
          score: step.score,
          communicationScore: step.communicationScore,
          technicalScore: step.technicalScore,
          confidenceScore: step.confidenceScore,
          date: new Date()
        };

        const currentHistory = user.aiInterviewStats || [];
        const newReadiness = Math.min(100, (user.readinessScore || 45) + 8); // +8 readiness boost for completing interview

        await User.findByIdAndUpdate(req.user._id, {
          $push: { aiInterviewStats: newStats },
          readinessScore: newReadiness
        });
      }
    }

    res.json(step);
  } catch (error) {
    console.error('Interview endpoint error:', error);
    res.status(500).json({ message: 'Failed to process interview message' });
  }
});

// @route   GET /api/ai/mentor-plan
// @desc    Generate personalized placement readiness study plan and recommendations
router.get('/mentor-plan', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const solvedCount = user.solvedProblems?.length || 0;
    
    const mentorReport = await getMentorPlan(
      user.readinessScore || 45,
      solvedCount,
      user.mcqStats || {}
    );

    res.json(mentorReport);
  } catch (error) {
    console.error('Mentor plan error:', error);
    res.status(500).json({ message: 'Failed to fetch mentor plan' });
  }
});

module.exports = router;
