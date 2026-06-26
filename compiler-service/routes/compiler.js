const express = require('express');
const router = express.Router();
const { db: { Question, Submission, User }, protect, syncUserStats } = require('shared');
const { executeCode } = require('../services/codeRunner');

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

    const results = await executeCode('Submission', language, code, allCases);
    
    const totalCases = allCases.length;
    const passedCases = results.filter(r => r.passed).length;
    const failedCases = totalCases - passedCases;
    const isAccepted = passedCases === totalCases;
    const score = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;
    
    let finalVerdict = 'Accepted';
    if (!isAccepted) {
      const firstFailed = results.find(r => !r.passed);
      if (firstFailed?.error) {
        if (firstFailed.error.includes('Time Limit Exceeded') || firstFailed.error.includes('timed out')) {
          finalVerdict = 'Time Limit Exceeded';
        } else if (firstFailed.error.includes('Compilation Error')) {
          finalVerdict = 'Compilation Error';
        } else if (firstFailed.error.includes('Memory Limit Exceeded')) {
          finalVerdict = 'Memory Limit Exceeded';
        } else if (firstFailed.error.includes('Output Limit Exceeded')) {
          finalVerdict = 'Output Limit Exceeded';
        } else {
          finalVerdict = 'Runtime Error';
        }
      } else {
        finalVerdict = 'Wrong Answer';
      }
    }

    const executionTime = Math.max(...results.map(r => r.time || 0));
    const memory = Math.max(...results.map(r => r.memory || 0));

    // Save Submission
    const submission = new Submission({
      user_id: userId,
      question_id: problemId,
      code,
      language,
      status: finalVerdict,
      passed_cases: passedCases,
      total_cases: totalCases,
      execution_time: executionTime,
      memory_used: memory
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

    res.json({
      status: finalVerdict,
      passed: passedCases,
      failed: failedCases,
      score,
      executionTime,
      memory
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Submission processing failed' });
  }
});

module.exports = router;
