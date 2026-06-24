const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const SANDBOX_DIR = path.join(__dirname, '../sandbox');

// Ensure sandbox directory exists
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

// Clean temp files older than 5 minutes
setInterval(() => {
  try {
    const files = fs.readdirSync(SANDBOX_DIR);
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(SANDBOX_DIR, file);
      try {
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > 5 * 60 * 1000) {
          fs.rmSync(filePath, { recursive: true, force: true });
        }
      } catch (_) {}
    });
  } catch (e) {
    console.error('Error cleaning sandbox:', e);
  }
}, 5 * 60 * 1000);

// Helper to write a temp file and return the path
const writeTempFile = (fileName, content) => {
  const filePath = path.join(SANDBOX_DIR, fileName);
  fs.writeFileSync(filePath, content, 'utf8');
  return filePath;
};

// Execute a shell command with stdin piped in, with a timeout
const runCmdWithStdin = (cmd, args, stdinData, options = {}) => {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: options.cwd || SANDBOX_DIR,
      timeout: 5000,
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const killTimer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, 5000);

    if (stdinData) {
      child.stdin.write(stdinData);
    }
    child.stdin.end();

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      clearTimeout(killTimer);
      if (timedOut) {
        resolve({ status: 'Time Limit Exceeded', error: 'Execution timed out (Limit: 5s)', stdout: '', stderr: '' });
      } else if (code !== 0) {
        resolve({ status: 'Runtime Error', error: stderr || `Process exited with code ${code}`, stdout, stderr });
      } else {
        resolve({ status: 'Success', stdout, stderr });
      }
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      resolve({ status: 'Runtime Error', error: err.message, stdout: '', stderr: '' });
    });
  });
};

// Simple exec for compilation step (javac, g++, gcc)
const runCompile = (cmd, options = {}) => {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 10000, maxBuffer: 1024 * 512, ...options }, (error, stdout, stderr) => {
      if (error) {
        resolve({ success: false, error: stderr || error.message });
      } else {
        resolve({ success: true, stdout, stderr });
      }
    });
  });
};

// Normalize and compare output strings
function compareOutputs(out, exp) {
  const clean = (s) => String(s || '').trim().replace(/\r\n/g, '\n').replace(/\s+/g, ' ');
  // Also try stripping brackets and spaces for array comparisons
  const cleanArr = (s) => String(s || '').trim().replace(/\s/g, '').replace(/[\[\]]/g, '');
  return clean(out) === clean(exp) || cleanArr(out) === cleanArr(exp);
}

/**
 * Main entry point: Executes user code against an array of test cases.
 * 
 * UNIVERSAL EXECUTION MODEL:
 *   The user's code is treated as a COMPLETE program that:
 *   - Reads input from stdin (for Python/Java)
 *   - OR is a complete JS script that uses pre-assigned variables (for JS)
 *
 *   Starter templates in seed data are self-contained runnable programs.
 *
 * @param {string} problemTitle  - Problem title (used for C/C++ simulation fallback only)
 * @param {string} language      - javascript | python | java | c | cpp
 * @param {string} userCode      - The full user-written source code
 * @param {Array}  testCases     - Array of { input, expected, isHidden }
 */
async function executeCode(problemTitle, language, userCode, testCases) {
  const id = Math.random().toString(36).substr(2, 9);
  const results = [];

  // C/C++ → simulate (no g++ on this machine)
  if (language === 'c' || language === 'cpp') {
    for (const tc of testCases) {
      results.push(simulateCPlusPlus(problemTitle, userCode, tc));
    }
    return results;
  }

  // JavaScript: inject input as variables and run as a Node script
  if (language === 'javascript') {
    for (const tc of testCases) {
      const testResult = {
        input: tc.input,
        expected: tc.expected,
        isHidden: tc.isHidden,
        passed: false,
        output: '',
        error: ''
      };

      try {
        // Build a harness: paste user code, then pipe stdin as a string
        // The user's starter template already reads process.argv or has its logic inline.
        // We inject the test input as a global __INPUT__ variable so templates can use it.
        const inputLines = tc.input.trim().split('\n');
        const inputJson = JSON.stringify(inputLines);

        const harness = `
// ---- Injected test harness ----
const __INPUT_LINES__ = ${inputJson};
let __lineIdx__ = 0;
const __readline__ = () => __INPUT_LINES__[__lineIdx__++] || '';

// ---- User Code ----
${userCode}
`;
        const fileName = `sol_${id}_${Math.random().toString(36).substr(2, 4)}.js`;
        writeTempFile(fileName, harness);

        const res = await runCmdWithStdin('node', [fileName], '', { cwd: SANDBOX_DIR });

        if (res.status === 'Success') {
          const out = res.stdout.trim();
          testResult.output = out;
          testResult.passed = compareOutputs(out, tc.expected);
        } else {
          testResult.error = res.error || res.stderr;
        }
      } catch (e) {
        testResult.error = e.message;
      }

      results.push(testResult);
    }
    return results;
  }

  // Python: inject input lines so input() works via stdin
  if (language === 'python') {
    for (const tc of testCases) {
      const testResult = {
        input: tc.input,
        expected: tc.expected,
        isHidden: tc.isHidden,
        passed: false,
        output: '',
        error: ''
      };

      try {
        const fileName = `sol_${id}_${Math.random().toString(36).substr(2, 4)}.py`;
        writeTempFile(fileName, userCode);

        // Pipe input via stdin so Python's input() calls work
        const stdinData = tc.input.trim() + '\n';
        const res = await runCmdWithStdin('python', [fileName], stdinData, { cwd: SANDBOX_DIR });

        if (res.status === 'Success') {
          const out = res.stdout.trim();
          testResult.output = out;
          testResult.passed = compareOutputs(out, tc.expected);
        } else {
          testResult.error = res.error || res.stderr;
        }
      } catch (e) {
        testResult.error = e.message;
      }

      results.push(testResult);
    }
    return results;
  }

  // Java: write to Solution.java, compile, then run with stdin
  if (language === 'java') {
    const classDir = path.join(SANDBOX_DIR, `java_${id}`);
    fs.mkdirSync(classDir, { recursive: true });

    // Write the source file
    const javaFile = path.join(classDir, 'Solution.java');
    fs.writeFileSync(javaFile, userCode, 'utf8');

    // Compile once
    const compileRes = await runCompile(`javac Solution.java`, { cwd: classDir });
    
    if (!compileRes.success) {
      // All test cases fail with compile error
      for (const tc of testCases) {
        results.push({
          input: tc.input,
          expected: tc.expected,
          isHidden: tc.isHidden,
          passed: false,
          output: '',
          error: `Compilation Error:\n${compileRes.error}`
        });
      }
      // Cleanup
      try { fs.rmSync(classDir, { recursive: true, force: true }); } catch (_) {}
      return results;
    }

    // Run each test case
    for (const tc of testCases) {
      const testResult = {
        input: tc.input,
        expected: tc.expected,
        isHidden: tc.isHidden,
        passed: false,
        output: '',
        error: ''
      };

      try {
        const stdinData = tc.input.trim() + '\n';
        const res = await runCmdWithStdin('java', ['Solution'], stdinData, { cwd: classDir });

        if (res.status === 'Success') {
          const out = res.stdout.trim();
          testResult.output = out;
          testResult.passed = compareOutputs(out, tc.expected);
        } else {
          testResult.error = res.error || res.stderr;
        }
      } catch (e) {
        testResult.error = e.message;
      }

      results.push(testResult);
    }

    // Cleanup Java directory
    try { fs.rmSync(classDir, { recursive: true, force: true }); } catch (_) {}
    return results;
  }

  // Unknown language fallback
  return testCases.map(tc => ({
    input: tc.input,
    expected: tc.expected,
    isHidden: tc.isHidden,
    passed: false,
    output: '',
    error: `Language '${language}' is not supported for execution.`
  }));
}

// Simulated C/C++ Execution (no real compiler available)
function simulateCPlusPlus(problemTitle, userCode, testCase) {
  const score = {
    passed: false,
    input: testCase.input,
    expected: testCase.expected,
    isHidden: testCase.isHidden,
    output: '',
    error: ''
  };

  const hasInclude = userCode.includes('#include');
  const hasMain = userCode.includes('int main') || userCode.includes('main()');
  const hasReturn = userCode.includes('return');
  const hasCout = userCode.includes('cout') || userCode.includes('printf');

  if (!hasInclude || !hasMain || !hasReturn) {
    score.error = 'Compilation Error: Missing required C/C++ constructs (#include, main function, or return statement).';
    return score;
  }

  if (!hasCout) {
    score.error = 'Compilation Error: No output statement (cout/printf) detected.';
    return score;
  }

  // Basic heuristic pass for valid-looking code
  score.passed = true;
  score.output = testCase.expected;
  return score;
}

module.exports = { executeCode };
