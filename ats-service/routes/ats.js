const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const { db: { User }, protect, gemini: { analyzeResume } } = require('shared');

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

// @route   POST /api/ats/resume-check
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

module.exports = router;
