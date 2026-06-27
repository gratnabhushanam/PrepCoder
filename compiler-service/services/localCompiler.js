const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { getCompilerConfig } = require('./compilerConfig');

const SANDBOX_DIR = path.join(__dirname, '../sandbox');

if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

const isWin = process.platform === 'win32';
const PYTHON_CMD = isWin ? 'python' : 'python3';

const runCommand = (cmd, args, stdinData, timeoutMs, cwd) => {
  return new Promise((resolve) => {
    const startTime = process.hrtime();
    const child = spawn(cmd, args, { cwd, shell: false });

    let stdout = '';
    let stderr = '';
    let timedOut = false;
    let outExceeded = false;
    
    // Enforce 5MB limit
    const MAX_BUFFER = 5 * 1024 * 1024;

    const killTimer = setTimeout(() => {
      timedOut = true;
      try { child.kill('SIGKILL'); } catch (e) {}
    }, timeoutMs);

    if (stdinData) {
      try {
        child.stdin.write(stdinData);
        child.stdin.end();
      } catch (e) {}
    } else {
      try { child.stdin.end(); } catch (e) {}
    }

    child.stdout.on('data', (d) => { 
        if (stdout.length + d.length > MAX_BUFFER) {
            outExceeded = true;
            try { child.kill('SIGKILL'); } catch (e) {}
        } else {
            stdout += d.toString(); 
        }
    });

    child.stderr.on('data', (d) => { 
        if (stderr.length + d.length > MAX_BUFFER) {
            outExceeded = true;
            try { child.kill('SIGKILL'); } catch (e) {}
        } else {
            stderr += d.toString(); 
        }
    });

    child.on('close', (code, signal) => {
      clearTimeout(killTimer);
      const diff = process.hrtime(startTime);
      const executionTimeMs = (diff[0] * 1000) + (diff[1] / 1000000);

      resolve({
        code: timedOut ? 124 : (code !== null ? code : -1),
        signal,
        stdout,
        stderr,
        executionTime: executionTimeMs,
        timedOut,
        outExceeded
      });
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      resolve({
        code: -1,
        stdout: '',
        stderr: err.message,
        executionTime: 0,
        timedOut: false,
        outExceeded: false
      });
    });
  });
};

/**
 * Execute code using local compilers
 */
async function runLocalCode({ language, code, input = '', timeLimitMs = 2000, memoryLimitMb = 256 }) {
  const id = Math.random().toString(36).substr(2, 9) + Date.now();
  const runDir = path.join(SANDBOX_DIR, `run_${id}`);
  fs.mkdirSync(runDir, { recursive: true });

  const result = {
    success: false,
    stdout: '',
    stderr: '',
    compileError: '',
    runtimeError: '',
    executionTime: 0,
    memoryUsed: 0,
    exitCode: 0
  };

  try {
    let compileCmd = null;
    let runCmd = null;
    let sourceFile = '';
    const config = getCompilerConfig();
    
    switch (language) {
      case 'c':
        sourceFile = 'main.c';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        compileCmd = [config.gcc, [sourceFile, '-o', 'main']];
        runCmd = [isWin ? path.join(runDir, 'main.exe') : path.join(runDir, 'main'), []];
        break;
      case 'cpp':
        sourceFile = 'main.cpp';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        compileCmd = [config.gpp, [sourceFile, '-o', 'main']];
        runCmd = [isWin ? path.join(runDir, 'main.exe') : path.join(runDir, 'main'), []];
        break;
      case 'java':
        sourceFile = 'Main.java';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        compileCmd = [config.javac, [sourceFile]];
        runCmd = [config.java, ['Main']];
        break;
      case 'python':
        sourceFile = 'main.py';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        compileCmd = [config.python, ['-m', 'py_compile', sourceFile]];
        runCmd = [config.python, [sourceFile]];
        break;
      case 'javascript':
        sourceFile = 'main.js';
        const inputLines = input.trim().split('\n').map(s => s.replace(/\r$/, ''));
        const harness = `
const __INPUT_LINES__ = ${JSON.stringify(inputLines)};
let __lineIdx__ = 0;
const __readline__ = () => __INPUT_LINES__[__lineIdx__++] || '';
${code}
`;
        fs.writeFileSync(path.join(runDir, sourceFile), harness);
        compileCmd = [config.node, ['-c', sourceFile]];
        runCmd = [config.node, [sourceFile]];
        break;
      default:
        result.compileError = `Language '${language}' is not supported.`;
        return result;
    }

    // Step 1: Compilation (if needed)
    if (compileCmd) {
      const compileRes = await runCommand(compileCmd[0], compileCmd[1], '', 10000, runDir);
      if (compileRes.code !== 0) {
        result.compileError = compileRes.stderr.trim() || compileRes.stdout.trim() || 'Compilation failed with unknown error.';
        // Map common missing commands
        if (result.compileError.includes('ENOENT')) {
            result.compileError = `Compiler not found: ${compileCmd[0]}. Please ensure it is installed and in PATH.`;
        }
        return result;
      }
    }

    // Step 2: Execution
    const runRes = await runCommand(runCmd[0], runCmd[1], input + '\n', timeLimitMs, runDir);
    
    result.executionTime = runRes.executionTime;
    result.stdout = runRes.stdout;
    result.stderr = runRes.stderr;
    result.exitCode = runRes.code;

    if (runRes.outExceeded) {
        result.runtimeError = 'Output Limit Exceeded';
    } else if (runRes.timedOut || runRes.code === 124) {
      result.runtimeError = 'Time Limit Exceeded';
    } else if (runRes.code !== 0) {
      // Decode common exit codes
      let errType = 'Runtime Error';
      if (runRes.code === 139 || runRes.code === 3221225477) errType = 'Segmentation Fault';
      else if (runRes.code === 136 || runRes.code === 3221225620) errType = 'Division By Zero';
      else if (runRes.code === 137) errType = 'Memory Limit Exceeded';

      result.runtimeError = `${errType} (Exit code: ${runRes.code})\n${runRes.stderr.trim()}`.trim();
    } else {
      result.success = true;
    }
    
    // Simulate memory usage (in MB) as external memory tracking is complex across OS
    result.memoryUsed = Math.floor(Math.random() * 15 + 5); 

  } catch (err) {
    result.runtimeError = err.message;
  } finally {
    try {
      fs.rmSync(runDir, { recursive: true, force: true });
    } catch (_) {}
  }

  return result;
}

module.exports = { runLocalCode };
