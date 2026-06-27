const express = require('express');
const router = express.Router();
const { db: { Question, Submission, User }, protect, syncUserStats } = require('shared');
const { executeCode } = require('../services/codeRunner');
const { runLocalCode } = require('../services/localCompiler');
const { submissionQueue } = require('../queues/submissionQueue');

// @route   POST /api/compiler/run
// @desc    Execute arbitrary code with custom input
router.post('/run', async (req, res) => {
  const { language, code, input } = req.body;
  
  if (!language || !code) {
    return res.status(400).json({ success: false, message: 'Language and code are required' });
  }

  try {
    const localResult = await runLocalCode({
      language,
      code,
      input: input || '',
      timeLimitMs: 2000,
      memoryLimitMb: 256
    });

    res.json({
      success: localResult.success,
      stdout: localResult.stdout,
      stderr: localResult.stderr,
      compileError: localResult.compileError,
      runtimeError: localResult.runtimeError,
      executionTime: Math.floor(localResult.executionTime),
      memoryUsed: localResult.memoryUsed,
      exitCode: localResult.exitCode
    });

  } catch (error) {
    console.error('Compiler run error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

// @route   POST /api/compiler/submit
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

    // 2. Add job to Queue
    await submissionQueue.add('submission', {
      submissionId: submission._id,
      userId,
      questionId: problemId,
      code,
      language,
      cases: allCases
    });

    res.json({
      status: 'Pending',
      submissionId: submission._id,
      message: 'Submission enqueued successfully'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Submission processing failed' });
  }
});

module.exports = router;
