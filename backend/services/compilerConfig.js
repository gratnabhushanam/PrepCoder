const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG_FILE = path.join(__dirname, '../compiler_config.json');

const isWin = process.platform === 'win32';

let configCache = null;

const detectCommand = (cmd) => {
    try {
        const detectCmd = isWin ? `where ${cmd}` : `which ${cmd}`;
        const output = execSync(detectCmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
        if (output) {
            // where can return multiple lines, take the first one
            return output.split(/\r?\n/)[0].trim();
        }
    } catch (e) {
        return null;
    }
    return null;
};

const getCompilerConfig = () => {
    if (configCache) return configCache;

    let userConfig = {};
    if (fs.existsSync(CONFIG_FILE)) {
        try {
            userConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        } catch (e) {
            console.error('Failed to read compiler_config.json', e);
        }
    }

    // Default auto-detected or fallback paths
    const defaultConfig = {
        gcc: detectCommand('gcc') || 'gcc',
        gpp: detectCommand('g++') || 'g++',
        java: detectCommand('java') || 'java',
        javac: detectCommand('javac') || 'javac',
        python: detectCommand('python') || detectCommand('python3') || (isWin ? 'python' : 'python3'),
        node: detectCommand('node') || 'node'
    };

    configCache = { ...defaultConfig, ...userConfig };
    return configCache;
};

const updateCompilerConfig = (newConfig) => {
    const current = getCompilerConfig();
    const updated = { ...current, ...newConfig };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
    configCache = updated;
    return configCache;
};

module.exports = {
    getCompilerConfig,
    updateCompilerConfig,
    detectCommand
};
