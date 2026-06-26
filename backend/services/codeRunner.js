const { runLocalCode } = require('./localCompiler');

// Normalize and compare output strings
function compareOutputs(out, exp) {
  const clean = (s) => String(s || '').trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  const cleanArr = (s) => String(s || '').trim().replace(/\s/g, '').replace(/[\[\]]/g, '');
  return clean(out) === clean(exp) || cleanArr(out) === cleanArr(exp);
}

/**
 * Main entry point: Executes user code against an array of test cases using Docker.
 * 
 * @param {string} problemTitle  - Problem title
 * @param {string} language      - javascript | python | java | c | cpp
 * @param {string} userCode      - The full user-written source code
 * @param {Array}  testCases     - Array of { input, expected, isHidden }
 */
async function executeCode(problemTitle, language, userCode, testCases) {
  const results = [];

  for (const tc of testCases) {
    const testResult = {
      input: tc.input,
      expected: tc.expected,
      isHidden: tc.isHidden,
      passed: false,
      output: '',
      error: '',
      time: 0,
      memory: 0
    };

    const localResult = await runLocalCode({
      language,
      code: userCode,
      input: tc.input,
      timeLimitMs: 2000,
      memoryLimitMb: 256
    });

    if (localResult.compileError) {
      testResult.error = `Compilation Error:\n${localResult.compileError}`;
      results.push(testResult);
      // If compilation fails, we shouldn't test the remaining cases.
      // We will mark them all as compilation error.
      break; 
    } else if (localResult.runtimeError) {
      testResult.error = localResult.runtimeError;
    } else {
      const out = localResult.stdout.trim();
      testResult.output = out;
      testResult.passed = compareOutputs(out, tc.expected);
    }
    
    testResult.time = localResult.executionTime;
    testResult.memory = localResult.memoryUsed;

    results.push(testResult);
  }
  
  // If we broke early due to compile error, fill the rest with the same error so the frontend logic doesn't break
  if (results.length > 0 && results[0].error && results[0].error.includes('Compilation Error')) {
      const compileErr = results[0].error;
      while(results.length < testCases.length) {
          const tc = testCases[results.length];
          results.push({
              input: tc.input,
              expected: tc.expected,
              isHidden: tc.isHidden,
              passed: false,
              output: '',
              error: compileErr,
              time: 0,
              memory: 0
          });
      }
  }

  return results;
}

module.exports = { executeCode };
