const express = require('express');
const router = express.Router();
const { runLocalCode } = require('../services/localCompiler');

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
      executionTime: `${Math.floor(localResult.executionTime)} ms`,
      memory: `${localResult.memoryUsed} MB`,
      exitCode: localResult.exitCode
    });

  } catch (error) {
    console.error('Compiler run error:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
});

module.exports = router;
