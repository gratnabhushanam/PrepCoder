import React, { useState, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { AppContext } from '../context/AppContext';
import Split from 'react-split';
import { Maximize2, Minimize2, Settings, RefreshCw, Copy, Code, Download, Share, Play } from 'lucide-react';
import toast from 'react-hot-toast';
import './OnlineCompiler.css';

export default function OnlineCompiler() {
  const { API_BASE } = useContext(AppContext);

  // Editor states
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  const editorRef = useRef(null);
  
  // Console tabs: 'output', 'console', 'errors', 'metrics'
  const [activeTab, setActiveTab] = useState('output');
  const [customInput, setCustomInput] = useState('');
  
  // Results
  const [runResult, setRunResult] = useState(null);

  const defaultTemplates = {
    python: "def main():\n    print('Hello World')\n\nif __name__ == '__main__':\n    main()",
    javascript: "console.log('Hello World');",
    typescript: "const greeting: string = 'Hello World';\nconsole.log(greeting);",
    java: "import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        System.out.println(\"Hello World\");\n    }\n}",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << \"Hello World\" << endl;\n    return 0;\n}",
    c: "#include <stdio.h>\n\nint main() {\n    printf(\"Hello World\\n\");\n    return 0;\n}",
    go: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    fmt.Println(\"Hello World\")\n}",
    rust: "fn main() {\n    println!(\"Hello World\");\n}",
    kotlin: "fun main() {\n    println(\"Hello World\")\n}",
    php: "<?php\n  echo \"Hello World\\n\";\n?>",
    ruby: "puts 'Hello World'",
    swift: "print(\"Hello World\")",
    csharp: "using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine(\"Hello World\");\n    }\n}"
  };

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    if (window.confirm('Changing language will reset your code to the default template. Continue?')) {
      setLanguage(lang);
      setCode(defaultTemplates[lang] || '');
      if (editorRef.current) {
        editorRef.current.setValue(defaultTemplates[lang] || '');
      }
    }
  };

  const handleEditorMount = (editor, monaco) => {
    editorRef.current = editor;
    const initialCode = defaultTemplates[language] || '';
    setCode(initialCode);
    editor.setValue(initialCode);
  };

  const handleFormatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      toast.success('Code formatted');
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset your code to the default template?')) {
      const initialCode = defaultTemplates[language] || '';
      setCode(initialCode);
      if (editorRef.current) {
        editorRef.current.setValue(initialCode);
      }
      toast.success('Code reset to template');
    }
  };

  const handleCopy = () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    navigator.clipboard.writeText(currentCode);
    toast.success('Code copied to clipboard');
  };

  const handleDownload = () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    const extensions = {
      python: 'py', javascript: 'js', typescript: 'ts', java: 'java',
      cpp: 'cpp', c: 'c', go: 'go', rust: 'rs', kotlin: 'kt',
      php: 'php', ruby: 'rb', swift: 'swift', csharp: 'cs'
    };
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${extensions[language] || 'txt'}`;
    a.click();
    toast.success('File downloaded');
  };

  const handleShare = () => {
    // Basic share just copies the code for now
    handleCopy();
    toast.success('Code copied for sharing!');
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  };

  const handleRunCode = async () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    if (!currentCode.trim()) {
      toast.error('Code editor is empty!');
      return;
    }

    setRunning(true);
    setRunResult(null);
    setActiveTab('output');
    
    try {
      const res = await axios.post(`${API_BASE}/compiler/run`, {
        language,
        code: currentCode,
        input: customInput,
        requestId: Date.now() // Bust cache
      });

      setRunResult(res.data);
      if (res.data.success) {
        toast.success('Execution completed');
      } else {
        toast.error('Execution failed');
        if (res.data.compileError || res.data.runtimeError) {
          setActiveTab('errors');
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to connect to compilation server');
      setRunResult({
        success: false,
        stdout: '',
        stderr: err.response?.data?.message || err.message,
        executionTime: '0 ms',
        memory: '0 MB'
      });
      setActiveTab('errors');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className={`compiler-container ${isFullScreen ? 'fullscreen-mode' : ''}`}>
      
      {/* Top Navbar for Compiler */}
      <div className="compiler-navbar">
        <div className="compiler-nav-left">
          <Link to="/" className="compiler-logo">
            <span>✨</span> PrepAI Compiler
          </Link>
        </div>
        
        <div className="compiler-toolbar">
          <div className="toolbar-group">
            <div className="select-wrapper">
              <Code size={16} />
              <select value={language} onChange={handleLanguageChange}>
                <option value="c">C (GCC)</option>
                <option value="cpp">C++ (G++)</option>
                <option value="java">Java</option>
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node)</option>
                <option value="typescript">TypeScript</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="kotlin">Kotlin</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="swift">Swift</option>
                <option value="csharp">C#</option>
              </select>
            </div>
          </div>

          <div className="toolbar-group">
            <div className="select-wrapper">
              <Settings size={16} />
              <select value={theme} onChange={(e) => setTheme(e.target.value)}>
                <option value="vs-dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>
            
            <div className="select-wrapper">
              <span style={{fontSize:'0.8rem', fontWeight:600}}>Aa</span>
              <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
              </select>
            </div>
          </div>

          <div className="toolbar-group actions-group">
            <button className="btn-icon" onClick={handleFormatCode} title="Format Code">
              <Code size={18} />
            </button>
            <button className="btn-icon" onClick={handleCopy} title="Copy Code">
              <Copy size={18} />
            </button>
            <button className="btn-icon" onClick={handleDownload} title="Download Code">
              <Download size={18} />
            </button>
            <button className="btn-icon" onClick={handleShare} title="Share Code">
              <Share size={18} />
            </button>
            <button className="btn-icon" onClick={handleReset} title="Reset Code">
              <RefreshCw size={18} />
            </button>
            <button className="btn-icon" onClick={toggleFullScreen} title="Toggle Fullscreen">
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>

          <button 
            className="btn btn-primary run-btn" 
            onClick={handleRunCode}
            disabled={running}
          >
            {running ? (
              <><RefreshCw className="spin" size={18} /> Running...</>
            ) : (
              <><Play size={18} fill="currentColor" /> Run Code</>
            )}
          </button>
        </div>
      </div>

      {/* Main Split Layout */}
      <Split 
        className="compiler-split"
        sizes={[70, 30]}
        minSize={100}
        gutterSize={6}
        direction="vertical"
      >
        {/* Top: Editor */}
        <div className="compiler-editor-wrapper">
          <Editor
            height="100%"
            language={language === 'c' || language === 'cpp' ? 'cpp' : language}
            theme={theme}
            value={code}
            onChange={(val) => setCode(val)}
            onMount={handleEditorMount}
            options={{
              fontSize: fontSize,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: true,
              formatOnPaste: true,
              padding: { top: 16 }
            }}
          />
        </div>

        {/* Bottom: Console / Results */}
        <div className="compiler-console-wrapper">
          <div className="console-header">
            <div className="console-tabs">
              <button 
                className={`console-tab ${activeTab === 'input' ? 'active' : ''}`}
                onClick={() => setActiveTab('input')}
              >
                Custom Input
              </button>
              <button 
                className={`console-tab ${activeTab === 'output' ? 'active' : ''}`}
                onClick={() => setActiveTab('output')}
              >
                Output
              </button>
              <button 
                className={`console-tab ${activeTab === 'errors' ? 'active' : ''}`}
                onClick={() => setActiveTab('errors')}
              >
                Errors
              </button>
              <button 
                className={`console-tab ${activeTab === 'metrics' ? 'active' : ''}`}
                onClick={() => setActiveTab('metrics')}
              >
                Metrics
              </button>
            </div>
            
            {runResult && (
              <div className={`status-badge ${runResult.success ? 'success' : 'error'}`}>
                {runResult.success ? 'Success' : 'Failed'}
              </div>
            )}
          </div>

          <div className="console-body">
            {activeTab === 'input' && (
              <div className="tab-content">
                <textarea
                  className="custom-input-textarea"
                  placeholder="Enter STDIN for your program here..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                ></textarea>
              </div>
            )}

            {activeTab === 'output' && (
              <div className="tab-content terminal-style">
                {runResult ? (
                  runResult.stdout ? (
                    <pre>{runResult.stdout}</pre>
                  ) : (
                    <span className="text-muted">Program exited with no standard output.</span>
                  )
                ) : (
                  <span className="text-muted">Run your code to see the output here.</span>
                )}
              </div>
            )}

            {activeTab === 'errors' && (
              <div className="tab-content terminal-style error-text">
                {runResult ? (
                  runResult.compileError ? (
                    <pre>{runResult.compileError}</pre>
                  ) : runResult.runtimeError ? (
                    <pre>{runResult.runtimeError}</pre>
                  ) : runResult.stderr ? (
                    <pre>{runResult.stderr}</pre>
                  ) : (
                    <span className="text-muted" style={{color: 'var(--color-success)'}}>No errors detected.</span>
                  )
                ) : (
                  <span className="text-muted">Compile errors and standard errors will appear here.</span>
                )}
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="tab-content metrics-grid">
                {runResult ? (
                  <>
                    <div className="metric-box">
                      <div className="metric-label">Execution Time</div>
                      <div className="metric-value">{runResult.executionTime || '0 ms'}</div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">Memory Used</div>
                      <div className="metric-value">{runResult.memory || '0 MB'}</div>
                    </div>
                    <div className="metric-box">
                      <div className="metric-label">Exit Code</div>
                      <div className="metric-value">{runResult.exitCode ?? '-'}</div>
                    </div>
                  </>
                ) : (
                  <span className="text-muted">Run your code to view performance metrics.</span>
                )}
              </div>
            )}
          </div>
        </div>
      </Split>
    </div>
  );
}
