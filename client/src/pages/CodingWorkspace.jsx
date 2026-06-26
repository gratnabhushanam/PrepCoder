import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { AppContext } from '../context/AppContext';

export default function CodingWorkspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { API_BASE, token } = useContext(AppContext);

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Editor states
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Console tabs: 'testcases', 'output', 'compilerError', 'runtimeError', 'executionTime', 'memory'
  const [activeTab, setActiveTab] = useState('testcases');
  const [customInput, setCustomInput] = useState('');
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);

  const defaultTemplates = {
    python: "def main():\n    pass\n\nif __name__ == '__main__':\n    main()",
    javascript: "function solve() {\n  \n}\nsolve();",
    java: "import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n    }\n}",
    cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}",
    c: "#include <stdio.h>\n\nint main() {\n    return 0;\n}"
  };

  const handleLanguageChange = (newLang) => {
    const savedCode = localStorage.getItem(`saved_code_${id}_${newLang}`);
    setCode(savedCode || defaultTemplates[newLang] || '');
    setLanguage(newLang);
  };

  useEffect(() => {
    if (code && id && language) {
      localStorage.setItem(`saved_code_${id}_${language}`, code);
    }
  }, [code, id, language]);

  useEffect(() => {
    if (id) {
      setLoading(true);
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

  const handleRunCode = async () => {
    setRunning(true);
    setSubmitResult(null);
    try {
      const res = await axios.post(`${API_BASE}/compiler/run`, {
        language,
        code,
        input: customInput
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRunResult(res.data);
      if (res.data.compileError) {
        setActiveTab('compilerError');
      } else if (res.data.runtimeError) {
        setActiveTab('runtimeError');
      } else {
        setActiveTab('output');
      }
    } catch (err) {
      setRunResult({ compileError: 'Failed to connect to compilation server.' });
      setActiveTab('compilerError');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitting(true);
    setRunResult(null);
    try {
      const res = await axios.post(`${API_BASE}/compiler/submit`, {
        problemId: id,
        language,
        code
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubmitResult(res.data);
      if (res.data.status === 'Compilation Error') {
        setActiveTab('compilerError');
      } else if (res.data.status === 'Runtime Error') {
        setActiveTab('runtimeError');
      } else {
        setActiveTab('output');
      }
    } catch (err) {
      setSubmitResult({ status: 'Error', error: 'Submission failed.' });
      setActiveTab('output');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem', color: '#fff' }}>Loading Coding Workspace...</div>;
  if (!problem) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Left Panel: Problem Description */}
      <div style={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #333', backgroundColor: '#111' }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>&larr; Back</button>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Description</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{problem.title}</h1>
          <span style={{ display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', marginBottom: '1.5rem', backgroundColor: problem.difficulty === 'Easy' ? '#0f5132' : problem.difficulty === 'Medium' ? '#664d03' : '#842029', color: problem.difficulty === 'Easy' ? '#75b798' : problem.difficulty === 'Medium' ? '#ffcd39' : '#ea868f' }}>
            {problem.difficulty}
          </span>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, color: '#ccc', marginBottom: '2rem' }}>
            {problem.statement}
          </div>

          {problem.constraints && (
            <div style={{ marginBottom: '2rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>Constraints:</strong>
              <div style={{ backgroundColor: '#222', padding: '1rem', borderRadius: '6px', marginTop: '0.5rem', fontFamily: 'monospace', color: '#ffb86c' }}>
                {problem.constraints}
              </div>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <strong style={{ fontSize: '1.1rem' }}>Examples:</strong>
            {problem.testCases?.map((tc, idx) => (
              <div key={idx} style={{ backgroundColor: '#222', padding: '1rem', borderRadius: '6px', marginTop: '0.5rem' }}>
                <div style={{ marginBottom: '0.5rem' }}><strong>Input:</strong><br /><code style={{ fontFamily: 'monospace', color: '#8be9fd' }}>{tc.input}</code></div>
                <div><strong>Output:</strong><br /><code style={{ fontFamily: 'monospace', color: '#50fa7b' }}>{tc.expected_output || tc.expected || tc.expectedOutput || tc.output}</code></div>
              </div>
            ))}
          </div>

          {problem.hints?.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <strong style={{ fontSize: '1.1rem' }}>Hints:</strong>
              <ul style={{ paddingLeft: '1.5rem', color: '#999', marginTop: '0.5rem' }}>
                {problem.hints.map((hint, idx) => <li key={idx}>{hint}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Editor and Console */}
      <div style={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 1rem', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333' }}>
          <select value={language} onChange={(e) => handleLanguageChange(e.target.value)} style={{ backgroundColor: '#333', color: '#fff', border: 'none', borderRadius: '4px', padding: '0.3rem 0.5rem' }}>
            <option value="c">C</option>
            <option value="cpp">C++</option>
            <option value="java">Java</option>
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={handleRunCode} disabled={running || submitting} style={{ padding: '0.4rem 1.2rem', backgroundColor: '#333', color: '#fff', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>
              {running ? 'Running...' : 'Run'}
            </button>
            <button onClick={handleSubmitCode} disabled={running || submitting} style={{ padding: '0.4rem 1.2rem', backgroundColor: '#2ea043', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div style={{ flex: 1 }}>
          <Editor
            height="100%"
            language={mapLanguageToMonaco(language)}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value || '')}
            options={{ minimap: { enabled: false }, fontSize: 14, tabSize: 4 }}
          />
        </div>

        {/* Console */}
        <div style={{ height: '250px', backgroundColor: '#1e1e1e', borderTop: '1px solid #333', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 1rem', borderBottom: '1px solid #333', backgroundColor: '#252526' }}>
            {['testcases', 'output', 'compilerError', 'runtimeError', 'executionTime', 'memory'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ background: 'transparent', border: 'none', color: activeTab === tab ? '#fff' : '#888', cursor: 'pointer', padding: '0.2rem 0', borderBottom: activeTab === tab ? '2px solid #fff' : 'none', fontSize: '0.85rem', textTransform: 'capitalize' }}
              >
                {tab.replace(/([A-Z])/g, ' $1')}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', fontFamily: 'monospace', fontSize: '0.9rem' }}>
            {activeTab === 'testcases' && (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ marginBottom: '0.5rem', color: '#888' }}>Custom Input:</div>
                <textarea 
                  value={customInput} 
                  onChange={(e) => setCustomInput(e.target.value)}
                  style={{ flex: 1, backgroundColor: '#111', color: '#fff', border: '1px solid #333', padding: '0.5rem', fontFamily: 'monospace', resize: 'none' }}
                />
              </div>
            )}
            {activeTab === 'output' && (
              <div>
                {submitResult ? (
                  <div>
                    <h3 style={{ color: submitResult.status === 'Accepted' ? '#50fa7b' : '#ff5555', marginBottom: '1rem' }}>{submitResult.status}</h3>
                    <p>Passed: {submitResult.passed} / {submitResult.passed + submitResult.failed}</p>
                    <p>Score: {submitResult.score}%</p>
                  </div>
                ) : runResult ? (
                  <div>
                    {runResult.success ? <span style={{ color: '#50fa7b' }}>Finished successfully.</span> : <span style={{ color: '#ff5555' }}>Execution Failed.</span>}
                    <div style={{ marginTop: '1rem', color: '#888' }}>Stdout:</div>
                    <div style={{ backgroundColor: '#111', padding: '0.5rem', minHeight: '50px', whiteSpace: 'pre-wrap', color: '#fff' }}>{runResult.stdout || 'No output'}</div>
                    {runResult.stderr && (
                      <>
                        <div style={{ marginTop: '1rem', color: '#888' }}>Stderr:</div>
                        <div style={{ backgroundColor: '#111', padding: '0.5rem', whiteSpace: 'pre-wrap', color: '#ff5555' }}>{runResult.stderr}</div>
                      </>
                    )}
                  </div>
                ) : <span style={{ color: '#888' }}>Run or submit code to see output here.</span>}
              </div>
            )}
            {activeTab === 'compilerError' && (
              <div>
                {(submitResult?.status === 'Compilation Error' || runResult?.compileError) ? (
                  <div style={{ color: '#ff5555', whiteSpace: 'pre-wrap', backgroundColor: '#3b1818', padding: '1rem', borderRadius: '4px' }}>
                    {runResult ? runResult.compileError : 'Compilation Error occurred during submission.'}
                  </div>
                ) : <span style={{ color: '#888' }}>No compiler errors.</span>}
              </div>
            )}
            {activeTab === 'runtimeError' && (
              <div>
                {(submitResult?.status === 'Runtime Error' || runResult?.runtimeError) ? (
                  <div style={{ color: '#ffb86c', whiteSpace: 'pre-wrap', backgroundColor: '#3d2915', padding: '1rem', borderRadius: '4px' }}>
                    {runResult ? runResult.runtimeError : 'Runtime Error occurred during submission.'}
                  </div>
                ) : <span style={{ color: '#888' }}>No runtime errors.</span>}
              </div>
            )}
            {activeTab === 'executionTime' && (
              <div>
                {submitResult ? (
                  <div style={{ color: '#8be9fd' }}>{submitResult.executionTime} ms</div>
                ) : runResult ? (
                  <div style={{ color: '#8be9fd' }}>{runResult.executionTime} ms</div>
                ) : <span style={{ color: '#888' }}>No execution data available.</span>}
              </div>
            )}
            {activeTab === 'memory' && (
              <div>
                {submitResult ? (
                  <div style={{ color: '#ff79c6' }}>{submitResult.memory} MB</div>
                ) : runResult ? (
                  <div style={{ color: '#ff79c6' }}>{runResult.memoryUsed} MB</div>
                ) : <span style={{ color: '#888' }}>No memory data available.</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
