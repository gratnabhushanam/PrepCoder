const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SANDBOX_DIR = path.join(__dirname, '../sandbox');

// Ensure sandbox directory exists
if (!fs.existsSync(SANDBOX_DIR)) {
  fs.mkdirSync(SANDBOX_DIR, { recursive: true });
}

// Map languages to their respective Docker images
const DOCKER_IMAGES = {
  c: 'gcc:latest',
  cpp: 'gcc:latest',
  java: 'eclipse-temurin:21-jdk',
  python: 'python:3.10-slim',
  javascript: 'node:18-slim'
};

/**
 * Execute a command with timeout and return stdout, stderr, and exit code.
 */
const runCommand = (cmd, args, stdinData, timeoutMs = 10000) => {
  return new Promise((resolve) => {
    const startTime = process.hrtime();
    // Use standard spawn without shell to avoid argument splitting issues on Windows (e.g. paths with spaces)
    // Node.js will automatically find docker.exe in the PATH.
    const child = spawn(cmd, args, { shell: false });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    const killTimer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);

    if (stdinData) {
      child.stdin.write(stdinData);
    }
    child.stdin.end();

    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });

    child.on('close', (code) => {
      clearTimeout(killTimer);
      const diff = process.hrtime(startTime);
      const executionTimeMs = (diff[0] * 1000) + (diff[1] / 1000000);

      resolve({
        code: timedOut ? 124 : code, // 124 is standard timeout exit code
        stdout,
        stderr,
        executionTime: executionTimeMs,
        timedOut
      });
    });

    child.on('error', (err) => {
      clearTimeout(killTimer);
      resolve({
        code: -1,
        stdout: '',
        stderr: err.message,
        executionTime: 0,
        timedOut: false
      });
    });
  });
};

/**
 * Execute code using Docker
 */
async function runDockerCode({ language, code, input = '', timeLimitMs = 5000, memoryLimitMb = 256 }) {
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
    memoryUsed: 0 // Mocked or estimated for now, Docker stats API is heavy
  };

  try {
    let compileCmd = null;
    let runCmd = [];
    let sourceFile = '';
    
    // Replace backslashes in runDir for Docker volume mounting on Windows
    // Docker on Windows expects standard paths but sometimes needs /c/... format, 
    // Usually, passing absolute paths like C:\... to -v works in modern Docker Desktop.
    
    switch (language) {
      case 'c':
        sourceFile = 'main.c';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        compileCmd = ['docker', ['run', '--rm', '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.c, 'gcc', sourceFile, '-o', 'a.out']];
        runCmd = ['docker', ['run', '--rm', '-i', '--network', 'none', '--cpus=1.0', `--memory=${memoryLimitMb}m`, '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.c, './a.out']];
        break;
      case 'cpp':
        sourceFile = 'main.cpp';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        compileCmd = ['docker', ['run', '--rm', '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.cpp, 'g++', sourceFile, '-o', 'a.out']];
        runCmd = ['docker', ['run', '--rm', '-i', '--network', 'none', '--cpus=1.0', `--memory=${memoryLimitMb}m`, '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.cpp, './a.out']];
        break;
      case 'java':
        sourceFile = 'Solution.java';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        compileCmd = ['docker', ['run', '--rm', '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.java, 'javac', sourceFile]];
        runCmd = ['docker', ['run', '--rm', '-i', '--network', 'none', '--cpus=1.0', `--memory=${memoryLimitMb}m`, '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.java, 'java', 'Solution']];
        break;
      case 'python':
        sourceFile = 'script.py';
        fs.writeFileSync(path.join(runDir, sourceFile), code);
        runCmd = ['docker', ['run', '--rm', '-i', '--network', 'none', '--cpus=1.0', `--memory=${memoryLimitMb}m`, '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.python, 'python3', sourceFile]];
        break;
      case 'javascript':
        sourceFile = 'script.js';
        const inputLines = input.trim().split('\\n');
        const harness = `
const __INPUT_LINES__ = ${JSON.stringify(inputLines)};
let __lineIdx__ = 0;
const __readline__ = () => __INPUT_LINES__[__lineIdx__++] || '';
${code}
`;
        fs.writeFileSync(path.join(runDir, sourceFile), harness);
        runCmd = ['docker', ['run', '--rm', '-i', '--network', 'none', '--cpus=1.0', `--memory=${memoryLimitMb}m`, '-v', `${runDir}:/app`, '-w', '/app', DOCKER_IMAGES.javascript, 'node', sourceFile]];
        break;
      default:
        result.compileError = `Language '${language}' is not supported.`;
        return result;
    }

    // Step 1: Compilation (if needed)
    if (compileCmd) {
      const compileRes = await runCommand(compileCmd[0], compileCmd[1], '', 15000);
      if (compileRes.code !== 0) {
        // If docker fails to run (e.g., docker daemon not running), the stderr will contain docker error.
        // If gcc fails to compile, it will be in stderr (or stdout).
        result.compileError = compileRes.stderr.trim() || compileRes.stdout.trim() || 'Compilation failed with unknown error.';
        
        // Handle case where docker is not found or daemon is off
        if (compileRes.stderr.includes('Cannot connect to the Docker daemon') || compileRes.stderr.includes('is not recognized')) {
             result.compileError = 'System Error: Docker is not installed or not running on the host.';
        }
        return result;
      }
    }

    // Step 2: Execution
    const runRes = await runCommand(runCmd[0], runCmd[1], input + '\n', timeLimitMs);
    
    result.executionTime = runRes.executionTime;
    result.stdout = runRes.stdout;
    result.stderr = runRes.stderr;

    if (runRes.timedOut || runRes.code === 124) {
      result.runtimeError = 'Time Limit Exceeded';
    } else if (runRes.code !== 0) {
      if (runRes.code === 137) {
        result.runtimeError = 'Memory Limit Exceeded';
      } else {
        result.runtimeError = runRes.stderr.trim() || runRes.stdout.trim() || `Runtime Error (Exit code: ${runRes.code})`;
      }
    } else {
      result.success = true;
    }
    
    // Simulate memory usage (in MB)
    result.memoryUsed = Math.floor(Math.random() * 20 + 10); 

  } catch (err) {
    result.runtimeError = err.message;
  } finally {
    try {
      fs.rmSync(runDir, { recursive: true, force: true });
    } catch (_) {}
  }

  return result;
}

module.exports = { runDockerCode };
