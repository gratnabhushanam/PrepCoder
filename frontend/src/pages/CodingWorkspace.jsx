import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { AppContext } from '../context/AppContext';
import { io } from 'socket.io-client';
import Split from 'react-split';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Maximize2, Minimize2, Settings, RefreshCw, Copy, Code, Check, X, Download, Save, CheckCircle2, XCircle, AlertCircle, Play, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import './CodingWorkspace.css';

export default function CodingWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API_BASE, token, user } = useContext(AppContext);

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [theme, setTheme] = useState('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  
  const editorRef = useRef(null);
  const socketRef = useRef(null);

  // Console tabs: 'testcases', 'customInput', 'output', 'submissions', 'console'
  const [activeTab, setActiveTab] = useState('testcases');
  const [customInput, setCustomInput] = useState('');
  
  // Results
  const [runResult, setRunResult] = useState(null); // Array of results or single custom result
  const [submitResult, setSubmitResult] = useState(null);
  const [isCustomRun, setIsCustomRun] = useState(false);

  // Submissions
  const [submissionsHistory, setSubmissionsHistory] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  
  // Notification States
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const defaultTemplates = {
    python: "def main():\n    pass\n\nif __name__ == '__main__':\n    main()",
    javascript: "function solve() {\n  \n}\nsolve();",
    java: "import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n    }\n}",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
    c: "#include <stdio.h>\n\nint main() {\n    return 0;\n}"
  };

  useEffect(() => {
    if (!API_BASE) return;
    const url = new URL(API_BASE);
    const wsUrl = `${url.protocol}//${url.host}`;
    
    const socket = io(wsUrl, { path: '/socket.io' });
    socketRef.current = socket;

    socket.on('submission_update', (data) => {
      setSubmitResult(data);
      if (['Completed', 'Error', 'Time Limit Exceeded', 'Compilation Error', 'Runtime Error', 'Memory Limit Exceeded', 'Output Limit Exceeded', 'Wrong Answer', 'Accepted'].includes(data.status) || data.verdict) {
        setSubmitting(false);
        setNotificationData(data);
        setShowNotification(true);
        setDetailsOpen(false);
        fetchSubmissions(); // refresh history
        
        // Auto-close if Accepted after 4 seconds
        if (data.verdict === 'Accepted') {
           setTimeout(() => {
             setShowNotification(prev => {
                if (prev) return false;
                return prev;
             });
           }, 4000);
        }
      }
    });

    return () => socket.disconnect();
  }, [API_BASE]);

  const handleLanguageChange = (newLang) => {
    const savedCode = localStorage.getItem(`saved_code_${id}_${newLang}`);
    setCode(savedCode || defaultTemplates[newLang] || '');
    setLanguage(newLang);
  };

  // Auto-Save every 2 seconds
  useEffect(() => {
    if (!autoSave) return;
    const timer = setInterval(() => {
       if (code && id && language) {
         localStorage.setItem(`saved_code_${id}_${language}`, code);
         setLastSaved(new Date());
       }
    }, 2000);
    return () => clearInterval(timer);
  }, [code, id, language, autoSave]);

  const fetchSubmissions = async () => {
    try {
       const res = await axios.get(`${API_BASE}/coding/submissions?problemId=${id}`, {
          headers: { Authorization: `Bearer ${token}` }
       });
       setSubmissionsHistory(res.data);
    } catch (e) {
       console.error("Failed to fetch submissions", e);
    }
  };

  useEffect(() => {
    if (id) {
      setLoading(true);
      fetchSubmissions();
      axios.get(`${API_BASE}/coding/problem/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => {
        setProblem(res.data);
        if (res.data.last_language) {
          setLanguage(res.data.last_language);
        }
        const targetLang = res.data.last_language || 'python';
        const savedCode = localStorage.getItem(`saved_code_${id}_${targetLang}`);
        if (savedCode) {
          setCode(savedCode);
        } else if (res.data.last_code) {
          setCode(res.data.last_code);
        } else {
          setCode(defaultTemplates[targetLang]);
        }
        if (res.data.testCases && res.data.testCases.length > 0) {
          setCustomInput(res.data.testCases[0].input);
        }
        setLoading(false);
      }).catch(err => {
        console.error(err);
        navigate('/coding');
      });
    }
  }, [id, API_BASE, token, navigate]);

  const mapLanguageToMonaco = (lang) => {
    const map = { javascript: 'javascript', python: 'python', java: 'java', cpp: 'cpp', c: 'c' };
    return map[lang] || 'javascript';
  };

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Add Ctrl+S binding
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      localStorage.setItem(`saved_code_${id}_${language}`, editor.getValue());
      setLastSaved(new Date());
      toast.success('Code saved manually');
    });
  };

  const formatCode = () => {
    if (editorRef.current) {
      editorRef.current.getAction('editor.action.formatDocument').run();
      toast.success('Code formatted');
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    toast.success('Code copied to clipboard!');
  };

  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${problem.title.replace(/\\s+/g, '_')}_solution.${language === 'python' ? 'py' : language === 'javascript' ? 'js' : language}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const resetCode = () => {
    if (window.confirm("Are you sure you want to reset your code to the default template? All your changes will be lost.")) {
      setCode(defaultTemplates[language] || '');
      toast.success('Code reset to default template');
    }
  };

  const handleRunCode = async () => {
    setRunning(true);
    setSubmitResult(null);
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    
    try {
      if (activeTab === 'customInput') {
        setIsCustomRun(true);
        const res = await axios.post(`${API_BASE}/compiler/run`, {
          language,
          code: currentCode,
          input: customInput,
          timestamp: Date.now(),
          requestId: Math.random().toString(36).substring(7)
        }, {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        });
        setRunResult([{
          input: customInput,
          expected: 'N/A',
          output: res.data.stdout,
          error: res.data.compileError || res.data.runtimeError,
          time: res.data.executionTime,
          memory: res.data.memory
        }]);
      } else {
        setIsCustomRun(false);
        const res = await axios.post(`${API_BASE}/coding/run`, {
          problemId: id,
          language,
          code: currentCode,
          timestamp: Date.now(),
          requestId: Math.random().toString(36).substring(7)
        }, {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        });
        setRunResult(res.data);
      }
      setActiveTab('output');
    } catch (err) {
      console.error("Run Code Error:", err);
      setRunResult([{ error: `Failed to connect to compilation server. Details: ${err.message}` }]);
      setActiveTab('output');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    const currentCode = editorRef.current ? editorRef.current.getValue() : code;
    if (!currentCode || currentCode.trim() === '') {
      toast.error('Code editor cannot be empty');
      return;
    }
    
    setSubmitting(true);
    setRunResult(null);
    setActiveTab('output');
    setSubmitResult({ status: 'Pending', message: 'Submitting code...' });
    
    try {
      const res = await axios.post(`${API_BASE}/coding/submit`, {
        problemId: id,
        language,
        code: currentCode,
        timestamp: Date.now(),
        requestId: Math.random().toString(36).substring(7)
      }, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      const subId = res.data.submissionId;
      if (subId && socketRef.current) {
         socketRef.current.emit('join_submission', subId);
      }
    } catch (err) {
      setSubmitResult({ status: 'Error', error: 'Submission failed.' });
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status, isPassed) => {
    if (status === 'Accepted' || isPassed) {
      return <span className="success-text"><CheckCircle2 size={16} /> Accepted</span>;
    }
    if (status === 'Pending' || status === 'Running') {
      return <span className="warning-text"><RefreshCw size={16} className="lucide-spin" /> {status}</span>;
    }
    return <span className="danger-text"><XCircle size={16} /> {status || 'Failed'}</span>;
  };

  const renderRunResultTable = (results) => {
    return (
      <table className="data-table">
        <thead>
          <tr>
            <th>Testcase</th>
            <th>Input</th>
            <th>Expected Output</th>
            <th>Your Output</th>
            <th>Status</th>
            <th>Time</th>
            <th>Memory</th>
          </tr>
        </thead>
        <tbody>
          {results.map((res, idx) => {
            const hasError = !!res.error;
            return (
              <tr key={idx}>
                <td>{isCustomRun ? 'Custom' : (res.isHidden ? `Hidden ${idx + 1}` : `Sample ${idx + 1}`)}</td>
                <td>
                  <div className="code-cell">{res.input || '-'}</div>
                </td>
                <td>
                  <div className="code-cell">{res.expected || '-'}</div>
                </td>
                <td>
                  <div className={`code-cell ${(!res.passed && !isCustomRun) || hasError ? 'danger-text' : ''}`}>
                    {res.error || res.output || '-'}
                  </div>
                </td>
                <td>{getStatusBadge(hasError ? 'Error' : (res.passed ? 'Accepted' : (isCustomRun ? 'Executed' : 'Wrong Answer')), res.passed)}</td>
                <td>{res.time !== undefined ? `${res.time} ms` : '-'}</td>
                <td>{res.memory !== undefined ? `${res.memory} MB` : '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };

  const renderOutputTab = () => {
    if (submitResult) {
      const isPending = submitResult.status === 'Pending' || submitResult.status === 'Running';
      const hasError = ['Compilation Error', 'Runtime Error', 'Error'].includes(submitResult.status || submitResult.verdict);
      const isAccepted = submitResult.status === 'Accepted' || submitResult.verdict === 'Accepted';

      return (
        <div>
          <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <h3 className={`verdict ${isAccepted ? 'success' : isPending ? 'warning' : 'danger'}`} style={{ margin: 0 }}>
              {submitResult.verdict || submitResult.status} {submitResult.message && ` - ${submitResult.message}`}
            </h3>
            
            {!hasError && submitResult.totalCases !== undefined && (
              <div style={{ color: '#D1D5DB' }}>
                Testcases: <strong style={{ color: isAccepted ? '#22C55E' : '#EF4444' }}>{submitResult.passedCases || submitResult.passed}</strong> / {submitResult.totalCases || (submitResult.passed + submitResult.failed)}
              </div>
            )}
          </div>

          {hasError && submitResult.error && (
            <div className="code-cell danger-text" style={{ width: '100%', maxWidth: 'none', padding: '1rem', marginBottom: '1rem' }}>
              {submitResult.error}
            </div>
          )}

          {submitResult.results && submitResult.results.length > 0 && (
            <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
              {renderRunResultTable(submitResult.results)}
            </div>
          )}

          {!isPending && !hasError && (
            <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
              {submitResult.executionTime !== undefined && (
                <div style={{ backgroundColor: '#0F1117', padding: '1rem', borderRadius: '6px', border: '1px solid #2B313D', minWidth: '200px' }}>
                  <div style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Execution Time</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{submitResult.executionTime} ms</div>
                  {submitResult.runtimePercentile && <div style={{ color: '#22C55E', fontSize: '0.85rem', marginTop: '0.5rem' }}>Beats {submitResult.runtimePercentile}%</div>}
                </div>
              )}
              {submitResult.memory !== undefined && (
                <div style={{ backgroundColor: '#0F1117', padding: '1rem', borderRadius: '6px', border: '1px solid #2B313D', minWidth: '200px' }}>
                  <div style={{ color: '#9CA3AF', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Memory</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{submitResult.memory} MB</div>
                  {submitResult.memoryPercentile && <div style={{ color: '#22C55E', fontSize: '0.85rem', marginTop: '0.5rem' }}>Beats {submitResult.memoryPercentile}%</div>}
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (runResult) {
      return (
        <div style={{ overflowX: 'auto' }}>
          {renderRunResultTable(runResult)}
        </div>
      );
    }

    return <span style={{ color: '#9CA3AF' }}>Run or Submit code to see output here.</span>;
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem', color: '#fff' }}>Loading Workspace...</div>;
  if (!problem) return null;

  return (
    <div className={`workspace-container ${isFullScreen ? 'fullscreen' : ''}`}>
      <Split sizes={[35, 65]} minSize={300} direction="horizontal" className="split-horizontal" gutterSize={8}>
        
        {/* Left Panel: Problem Description */}
        <div className="panel left-panel">
          <div className="panel-header">
            <button onClick={() => navigate(-1)} className="back-btn">&larr; Back</button>
            <span style={{ fontWeight: '600' }}>Description</span>
          </div>
          <div className="panel-content">
            <h1 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 'bold' }}>{problem.title}</h1>
            
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`difficulty-badge ${problem.difficulty.toLowerCase()}`}>
                {problem.difficulty}
              </span>
              {problem.category && (
                <span className="tag-badge">{problem.category}</span>
              )}
              {problem.companies?.length > 0 && (
                <span className="tag-badge">Companies: {problem.companies.join(', ')}</span>
              )}
              {problem.acceptance_rate && (
                <span style={{ color: '#9CA3AF', fontSize: '0.9rem' }}>Acceptance: {problem.acceptance_rate}%</span>
              )}
              {problem.is_solved && (
                <span className="success-text" style={{ fontSize: '0.9rem' }}>
                  <CheckCircle2 size={16} /> Solved
                </span>
              )}
            </div>

            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {problem.description || problem.statement || 'No description provided.'}
              </ReactMarkdown>
            </div>

            {problem.input_format && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'block' }}>Input Format</strong>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.input_format}</ReactMarkdown>
                </div>
              </div>
            )}
            
            {problem.output_format && (
              <div style={{ marginBottom: '1.5rem' }}>
                <strong style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'block' }}>Output Format</strong>
                <div className="markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.output_format}</ReactMarkdown>
                </div>
              </div>
            )}

            <div style={{ marginBottom: '2rem' }}>
              {problem.testCases?.map((tc, idx) => (
                <div key={idx} className="example-box">
                  <strong style={{ color: '#fff', marginBottom: '0.5rem', display: 'block' }}>Sample {idx + 1}</strong>
                  <div style={{ marginBottom: '0.8rem' }}><strong>Input:</strong><br /><code>{tc.input}</code></div>
                  <div style={{ marginBottom: '0.8rem' }}><strong>Output:</strong><br /><code>{tc.expected_output || tc.expected || tc.expectedOutput || tc.output}</code></div>
                  {tc.explanation && (
                    <div><strong>Explanation:</strong><br /><span style={{ color: '#9CA3AF' }}>{tc.explanation}</span></div>
                  )}
                </div>
              ))}
            </div>

            {problem.constraints && (
              <div style={{ marginBottom: '2rem' }}>
                <strong style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'block' }}>Constraints</strong>
                <div className="constraints-box">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {problem.constraints}
                  </ReactMarkdown>
                </div>
              </div>
            )}

            {problem.hints?.length > 0 && (
              <div style={{ marginBottom: '2rem' }}>
                <strong style={{ fontSize: '1.1rem', color: '#fff', marginBottom: '0.5rem', display: 'block' }}>Hints</strong>
                <ul style={{ paddingLeft: '1.5rem', color: '#9CA3AF', marginTop: '0.5rem', lineHeight: '1.6' }}>
                  {problem.hints.map((hint, idx) => <li key={idx} style={{ marginBottom: '0.5rem' }}>{hint}</li>)}
                </ul>
              </div>
            )}
            
            {problem.editorial && (
              <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '6px' }}>
                <strong style={{ fontSize: '1.1rem', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <AlertCircle size={18} /> Editorial / Notes
                </strong>
                <div className="markdown-content" style={{ marginBottom: 0 }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.editorial}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Editor and Console */}
        <div className="panel right-panel">
          <Split sizes={[60, 40]} minSize={100} direction="vertical" className="split-vertical" gutterSize={8}>
            
            {/* Top Editor Section */}
            <div className="editor-section">
              <div className="editor-toolbar">
                <div className="toolbar-left">
                  <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} className="lang-select">
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                  </select>
                  <select value={theme} onChange={(e) => setTheme(e.target.value)} className="lang-select">
                    <option value="vs-dark">Dark Theme</option>
                    <option value="vs-light">Light Theme</option>
                    <option value="hc-black">High Contrast</option>
                  </select>
                  <select value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="lang-select" title="Font Size">
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                  </select>
                </div>
                
                <div className="toolbar-right">
                  {lastSaved && (
                    <span className="auto-save-status">
                      <Check size={14} /> Saved
                    </span>
                  )}
                  <button onClick={() => setAutoSave(!autoSave)} className={`icon-btn ${autoSave ? 'active' : ''}`} title="Toggle Auto Save"><Save size={16} /></button>
                  <button onClick={formatCode} className="icon-btn" title="Format Code (Shift+Alt+F)"><Code size={16} /></button>
                  <button onClick={resetCode} className="icon-btn" title="Reset to Default"><RefreshCw size={16} /></button>
                  <button onClick={copyCode} className="icon-btn" title="Copy Code"><Copy size={16} /></button>
                  <button onClick={downloadCode} className="icon-btn" title="Download Code"><Download size={16} /></button>
                  <button onClick={() => setIsFullScreen(!isFullScreen)} className="icon-btn" title="Full Screen">
                    {isFullScreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ flex: 1, position: 'relative' }}>
                <Editor
                  height="100%"
                  language={mapLanguageToMonaco(language)}
                  theme={theme}
                  value={code}
                  onChange={(value) => setCode(value || '')}
                  onMount={handleEditorDidMount}
                  options={{ 
                    minimap: { enabled: true, scale: 0.75 }, 
                    fontSize: fontSize, 
                    tabSize: 4,
                    lineNumbers: 'on',
                    wordWrap: 'on',
                    matchBrackets: 'always',
                    autoClosingBrackets: 'always',
                    autoIndent: 'full',
                    formatOnType: true,
                    formatOnPaste: true,
                    automaticLayout: true,
                    scrollBeyondLastLine: false,
                    padding: { top: 16 }
                  }}
                />
              </div>

              <div className="editor-actions">
                <button onClick={handleRunCode} disabled={running || submitting} className="run-btn">
                  {running ? <RefreshCw size={16} className="lucide-spin" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3rem' }} /> : <Play size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3rem' }} />}
                  Run Code
                </button>
                <button onClick={handleSubmitCode} disabled={running || submitting} className="submit-btn">
                  {submitting ? <RefreshCw size={16} className="lucide-spin" style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3rem' }} /> : <Send size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.3rem' }} />}
                  Submit Code
                </button>
              </div>
            </div>

            {/* Bottom Console Section */}
            <div className="console-section">
              <div className="console-tabs">
                {['testcases', 'output', 'customInput', 'submissions', 'console'].map(tab => (
                  <button 
                    key={tab} 
                    onClick={() => setActiveTab(tab)}
                    className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab.replace(/([A-Z])/g, ' $1')}
                  </button>
                ))}
              </div>
              
              <div className="console-content">
                {activeTab === 'testcases' && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Testcase</th>
                          <th>Input</th>
                          <th>Expected Output</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problem.testCases?.map((tc, idx) => (
                          <tr key={idx}>
                            <td>Sample {idx + 1}</td>
                            <td><div className="code-cell">{tc.input}</div></td>
                            <td><div className="code-cell">{tc.expected_output || tc.expected || tc.expectedOutput || tc.output}</div></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'customInput' && (
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <div style={{ marginBottom: '0.5rem', color: '#9CA3AF' }}>Enter custom input for testing:</div>
                    <textarea 
                      value={customInput} 
                      onChange={(e) => setCustomInput(e.target.value)}
                      className="custom-input-area"
                      spellCheck="false"
                      placeholder="e.g. 1 2 3"
                    />
                  </div>
                )}
                
                {activeTab === 'output' && renderOutputTab()}

                {activeTab === 'console' && (
                  <div style={{ color: '#9CA3AF' }}>Console logs will appear here during execution...</div>
                )}

                {activeTab === 'submissions' && (
                  <div style={{ overflowX: 'auto' }}>
                    {submissionsHistory.length === 0 ? (
                      <p style={{ color: '#9CA3AF' }}>No submissions yet.</p>
                    ) : (
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>ID</th>
                            <th>Status</th>
                            <th>Passed / Total</th>
                            <th>Language</th>
                            <th>Runtime</th>
                            <th>Memory</th>
                            <th>Time</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissionsHistory.map((sub, i) => (
                            <tr key={i}>
                              <td style={{ color: '#9CA3AF' }}>#{sub._id?.substring(0, 8)}</td>
                              <td>{getStatusBadge(sub.status, sub.status === 'Accepted')}</td>
                              <td style={{ color: '#D1D5DB' }}>{sub.passed_cases} / {sub.total_cases}</td>
                              <td style={{ color: '#D1D5DB' }}>{sub.language}</td>
                              <td style={{ color: '#D1D5DB' }}>{sub.execution_time > 0 ? `${sub.execution_time} ms` : '-'}</td>
                              <td style={{ color: '#D1D5DB' }}>{sub.memory_used > 0 ? `${sub.memory_used} MB` : '-'}</td>
                              <td style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>{new Date(sub.submitted_at).toLocaleString()}</td>
                              <td>
                                <span className="action-link" onClick={() => setSelectedSubmission(sub)}>
                                  <Code size={14} /> View Code
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Split>
        </div>
      </Split>

      {/* Submission Modal */}
      {selectedSubmission && (
        <div className="modal-overlay" onClick={() => setSelectedSubmission(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Submission Details #{selectedSubmission._id?.substring(0, 8)}</div>
              <button className="modal-close" onClick={() => setSelectedSubmission(null)}><X size={20} /></button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '1rem', borderBottom: '1px solid #2B313D', display: 'flex', gap: '2rem', flexWrap: 'wrap', backgroundColor: '#1A1D24' }}>
                <div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Status</div>
                  <div style={{ fontSize: '1.1rem' }}>{getStatusBadge(selectedSubmission.status, selectedSubmission.status === 'Accepted')}</div>
                </div>
                <div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Language</div>
                  <div style={{ color: '#fff', fontSize: '1.1rem' }}>{selectedSubmission.language}</div>
                </div>
                <div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Testcases Passed</div>
                  <div style={{ color: '#fff', fontSize: '1.1rem' }}>{selectedSubmission.passed_cases} / {selectedSubmission.total_cases}</div>
                </div>
                <div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Submitted At</div>
                  <div style={{ color: '#fff', fontSize: '1.1rem' }}>{new Date(selectedSubmission.submitted_at).toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>User</div>
                  <div style={{ color: '#fff', fontSize: '1.1rem' }}>{user?.username || 'You'}</div>
                </div>
              </div>
              <div style={{ flex: 1, height: 'calc(100% - 85px)' }}>
                <Editor
                  height="100%"
                  language={mapLanguageToMonaco(selectedSubmission.language)}
                  theme={theme}
                  value={selectedSubmission.code}
                  options={{ 
                    readOnly: true,
                    minimap: { enabled: true, scale: 0.75 }, 
                    fontSize: fontSize,
                    scrollBeyondLastLine: false,
                    wordWrap: 'on'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Notification Overlay */}
      {showNotification && notificationData && (
        <div className="submission-toast-overlay">
          <div className="submission-toast-content">
            <div className="toast-header">
              <div className="toast-title">
                {notificationData.verdict === 'Accepted' ? (
                  <><span style={{ color: '#10B981', fontSize: '1.4rem' }}>✅</span> Accepted</>
                ) : (
                  <><span style={{ color: '#F59E0B', fontSize: '1.4rem' }}>⚠️</span> Submission Successful</>
                )}
              </div>
              <button className="toast-close-btn" onClick={() => setShowNotification(false)}>
                ✕
              </button>
            </div>
            
            <div className="toast-body">
              <div className="toast-message">
                {notificationData.verdict === 'Accepted' ? (
                  <>
                    <p style={{ color: '#10B981', fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>Congratulations!</p>
                    <p>All test cases passed successfully.</p>
                  </>
                ) : (
                  <>
                    <p>Your code has been submitted successfully.</p>
                    <p style={{ marginTop: '0.8rem', fontSize: '1.1rem' }}>
                      Status: <span style={{ color: '#EF4444', fontWeight: 600 }}>{notificationData.verdict || notificationData.status}</span>
                    </p>
                  </>
                )}
              </div>

              {notificationData.verdict === 'Accepted' ? (
                <div className="toast-stats">
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Execution Time</div>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 500 }}>
                      {notificationData.executionTime ? (notificationData.executionTime / 1000).toFixed(3) : '0.000'} sec
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Memory Used</div>
                    <div style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 500 }}>
                      {notificationData.memory || '0.0'} MB
                    </div>
                  </div>
                </div>
              ) : (
                <div className="toast-error-details">
                  <button className="toast-error-toggle" onClick={() => setDetailsOpen(!detailsOpen)}>
                    View Error Details <span>{detailsOpen ? '▲' : '▼'}</span>
                  </button>
                  {detailsOpen && (
                    <div className="toast-error-content">
                      {notificationData.results && notificationData.results.find(r => !r.passed && r.status !== 'Accepted') ? (() => {
                        const failed = notificationData.results.find(r => !r.passed && r.status !== 'Accepted');
                        if (failed.error && (failed.error.includes('Compilation Error') || failed.error.includes('Runtime Error'))) {
                          return `Error Details:\n${failed.error}`;
                        } else {
                          return `Failed Test Case\n\nInput:\n${failed.input}\n\nExpected Output:\n${failed.expected}\n\nYour Output:\n${failed.output || 'N/A'}`;
                        }
                      })() : (
                        notificationData.message || 'Unknown Error'
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="toast-footer">
              <button className="toast-ok-btn" onClick={() => setShowNotification(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
