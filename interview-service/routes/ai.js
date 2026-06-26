const express = require('express');
const router = express.Router();
const { db: { User }, protect, gemini: { getInterviewFeedback, getMentorPlan } } = require('shared');

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
