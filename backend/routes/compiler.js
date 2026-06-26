const express = require('express');
const router = express.Router();
const { runDockerCode } = require('../services/dockerRunner');

// @route   POST /api/compiler/run
// @desc    Execute arbitrary code with custom input
router.post('/run', async (req, res) => {
  const { language, code, input } = req.body;
  
  if (!language || !code) {
    return res.status(400).json({ success: false, message: 'Language and code are required' });
  }

  try {
    const dockerResult = await runDockerCode({
      language,
      code,
      input: input || '',
      timeLimitMs: 5000,
      memoryLimitMb: 256
    });

    // The requirements ask for: { success, stdout, stderr, compileError, runtimeError, executionTime, memoryUsed }
    res.json({
      success: dockerResult.success,
      stdout: dockerResult.stdout,
      stderr: dockerResult.stderr,
      compileError: dockerResult.compileError,
      runtimeError: dockerResult.runtimeError,
      executionTime: dockerResult.executionTime,
      memoryUsed: dockerResult.memoryUsed
    });

  } catch (error) {
    console.error('Compiler run error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
