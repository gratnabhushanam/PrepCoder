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
  const [outputResults, setOutputResults] = useState(null);
  const [activeConsoleTab, setActiveConsoleTab] = useState('results'); // results, submissions
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [resubmitMode, setResubmitMode] = useState(true);

  const defaultTemplates = {
    python: "def main():\n    # Read input from stdin\n    # Example: n = int(input())\n    pass\n\nif __name__ == '__main__':\n    main()",
    javascript: "// The platform automatically injects __INPUT_LINES__ and __readline__()\n// Example: const n = parseInt(__readline__(), 10);\n\nfunction solve() {\n  \n}\nsolve();",
    java: "import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner scanner = new Scanner(System.in);\n        // Read input using scanner.nextLine(), etc.\n        \n    }\n}"
  };

  // Change starter code when language changes
  const handleLanguageChange = (newLang) => {
    if (code && !Object.values(defaultTemplates).includes(code)) {
      if (window.confirm('Switching languages will replace your current code with the default template. Are you sure?')) {
        setCode(defaultTemplates[newLang] || '');
        setLanguage(newLang);
      }
    } else {
      setCode(defaultTemplates[newLang] || '');
      setLanguage(newLang);
    }
  };

  // Load single problem details
  useEffect(() => {
    if (id) {
      setLoading(true);
      const fetchProblemDetail = async () => {
        try {
          const res = await axios.get(`${API_BASE}/coding/problem/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setProblem(res.data);
          setResubmitMode(!res.data.is_solved);
          if (res.data.last_code) {
            setCode(res.data.last_code);
          } else {
            setCode(defaultTemplates[res.data.last_language || 'python']);
          }
          if (res.data.last_language) {
            setLanguage(res.data.last_language);
          }
          setOutputResults(null);
          fetchSubmissions();
        } catch (err) {
          console.error('Failed to load problem details:', err);
          if (err.response?.status === 404) {
             navigate('/coding');
          }
        } finally {
          setLoading(false);
        }
      };
      
      const fetchSubmissions = async () => {
        try {
          const res = await axios.get(`${API_BASE}/coding/submissions?problemId=${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserSubmissions(res.data);
        } catch (err) {
          console.error('Error fetching submissions:', err);
        }
      };
      
      fetchProblemDetail();
    } else {
      navigate('/coding');
    }
  }, [id, API_BASE, token, navigate]);

  const mapLanguageToMonaco = (lang) => {
    const map = {
      javascript: 'javascript',
      python: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c'
    };
    return map[lang] || 'javascript';
  };

  const handleRunCode = async () => {
    setRunning(true);
    setOutputResults(null);
    setActiveConsoleTab('results');
    try {
      const res = await axios.post(`${API_BASE}/coding/run`, {
        problemId: id,
        language,
        code
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOutputResults({ type: 'run', cases: res.data });
    } catch (err) {
      setOutputResults({ type: 'error', error: err.response?.data?.message || 'Compile/Run request failed.' });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setSubmitting(true);
    setOutputResults(null);
    setActiveConsoleTab('results');
    try {
      const res = await axios.post(`${API_BASE}/coding/submit`, {
        problemId: id,
        language,
        code
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setOutputResults({
        type: 'submit',
        status: res.data.status,
        passedCases: res.data.passedCases,
        totalCases: res.data.totalCases,
        cases: res.data.results,
        stats: res.data.stats,
        runtime: (Math.random() * 0.15 + 0.05).toFixed(2), // Simulate runtime
        memory: Math.floor(Math.random() * 10 + 10) // Simulate memory
      });

      if (res.data.status === 'Accepted') {
        setShowSuccessPopup(true);
        setResubmitMode(false);
        setProblem(p => ({ ...p, is_solved: true }));
        setTimeout(() => setShowSuccessPopup(false), 3000);
      }

      // Re-fetch submissions log
      const subsRes = await axios.get(`${API_BASE}/coding/submissions?problemId=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserSubmissions(subsRes.data);

    } catch (err) {
      setOutputResults({ type: 'error', error: err.response?.data?.message || 'Submission request failed.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Coding Workspace...</div>;

  if (!problem) return null;

  return (
    <div className="ide-container" style={{ animation: 'fadeIn 0.4s ease' }}>
      
      {/* Left Pane: Description & Test Cases */}
      <div className="ide-left-pane">
        <div className="ide-header" style={{ padding: '0.75rem 1.5rem', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            &larr; Back
          </button>
          <span className={`badge ${problem.difficulty === 'Easy' ? 'badge-easy' : problem.difficulty === 'Medium' ? 'badge-medium' : 'badge-hard'}`}>
            {problem.difficulty}
          </span>
        </div>
        
        <div className="ide-content" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.75rem' }}>{problem.title}</h2>
          
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {problem.companies?.map((tag, idx) => (
              <span key={idx} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                🏢 {tag}
              </span>
            ))}
          </div>

          {/* Description Text */}
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            {problem.statement}
          </div>

          {problem.inputFormat && (
            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Input Format:</strong>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{problem.inputFormat}</div>
            </div>
          )}

          {problem.outputFormat && (
            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Output Format:</strong>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{problem.outputFormat}</div>
            </div>
          )}

          {problem.constraints && (
            <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid var(--color-warning)' }}>
              <strong style={{ display: 'block', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>Constraints:</strong>
              <code style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'pre-wrap' }}>{problem.constraints}</code>
            </div>
          )}

          {/* Public Test Cases Preview */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', marginTop: '2rem' }}>Examples</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {problem.testCases?.map((tc, idx) => (
              <div key={idx} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '1rem', fontSize: '0.85rem', height: 'auto', overflow: 'visible' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>Example {idx + 1}</div>
                <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-muted)' }}>Input:</strong> <br/><code style={{ color: 'var(--color-accent)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginTop: '0.25rem' }}>{tc.input}</code></div>
                <div><strong style={{ color: 'var(--text-muted)' }}>Output:</strong> <br/><code style={{ color: 'var(--text-primary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', display: 'block', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', marginTop: '0.25rem' }}>{tc.expected_output || tc.expected || tc.expectedOutput || tc.output}</code></div>
              </div>
            ))}
          </div>

          {Array.isArray(problem.hints) && problem.hints.length > 0 && (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem' }}>Hints</h3>
              <ul style={{ paddingLeft: '1.5rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                {problem.hints.map((hint, idx) => <li key={idx} style={{ marginBottom: '0.5rem' }}>{hint}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Editor & Console Output */}
      <div className="ide-right-pane">
        
        {/* Editor Wrapper */}
        <div className="ide-editor-wrapper" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="ide-header" style={{ padding: '0.5rem 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Language:</span>
              <select 
                value={language} 
                onChange={(e) => handleLanguageChange(e.target.value)}
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', borderRadius: '4px', padding: '0.2rem 0.5rem', cursor: 'pointer', outline: 'none' }}
              >
                <option value="python">Python 3</option>
                <option value="javascript">JavaScript (Node)</option>
                <option value="java">Java 21</option>
                <option value="cpp">C++ (Simulated)</option>
                <option value="c">C (Simulated)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleRunCode} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} disabled={running || submitting}>
                {running ? 'Running...' : 'Run Code'}
              </button>
              {problem?.is_solved && !resubmitMode ? (
                <button onClick={() => setResubmitMode(true)} className="btn btn-secondary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}>
                  Resubmit
                </button>
              ) : (
                <button onClick={handleSubmitCode} className="btn btn-primary" style={{ padding: '0.4rem 1.25rem', fontSize: '0.85rem' }} disabled={running || submitting}>
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
              )}
            </div>
          </div>
          
          <div style={{ flex: 1, backgroundColor: '#1e1e1e' }}>
            <Editor
              height="100%"
              language={mapLanguageToMonaco(language)}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || '')}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                lineNumbers: 'on',
                folding: true,
                autoClosingBrackets: 'always',
                autoClosingQuotes: 'always',
                formatOnPaste: true,
                tabSize: 4
              }}
            />
          </div>
        </div>

        {/* Console / Output Drawer */}
        <div className="ide-console-wrapper">
          <div className="ide-header" style={{ padding: '0.4rem 1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                onClick={() => setActiveConsoleTab('results')}
                style={{ background: 'transparent', border: 'none', color: activeConsoleTab === 'results' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeConsoleTab === 'results' ? '2px solid var(--color-primary)' : 'none', padding: '0.2rem 0', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Compiler Output
              </button>
              <button 
                onClick={() => setActiveConsoleTab('submissions')}
                style={{ background: 'transparent', border: 'none', color: activeConsoleTab === 'submissions' ? 'var(--text-primary)' : 'var(--text-muted)', borderBottom: activeConsoleTab === 'submissions' ? '2px solid var(--color-primary)' : 'none', padding: '0.2rem 0', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Submissions History
              </button>
            </div>
          </div>

          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#050608', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
            
            {/* Output tab content */}
            {activeConsoleTab === 'results' && (
              <div>
                {!outputResults ? (
                  <div style={{ color: '#6b7280' }}>Run or Submit your code to check compiler outputs here...</div>
                ) : outputResults.type === 'error' ? (
                  <div style={{ color: 'var(--color-danger)' }}>{outputResults.error}</div>
                ) : outputResults.type === 'run' ? (
                  <div>
                    <h4 style={{ color: '#f3f4f6', marginBottom: '1rem', fontSize: '1.1rem' }}>Run Results</h4>
                    {outputResults.cases.map((c, i) => (
                      <div key={i} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          {c.passed ? <span style={{ color: 'var(--color-success)' }}>✓</span> : <span style={{ color: 'var(--color-danger)' }}>✗</span>}
                          <strong style={{ color: c.passed ? 'var(--color-success)' : 'var(--color-danger)' }}>
                            Test Case {i+1} {c.passed ? 'Passed' : 'Failed'}
                          </strong>
                        </div>
                        {c.error ? (
                          <div style={{ color: 'var(--color-danger)', marginTop: '0.25rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.5rem', borderRadius: '4px' }}>{c.error}</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <div>
                              <div style={{ color: '#6b7280', marginBottom: '0.2rem' }}>Input:</div>
                              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', color: '#abb2bf', whiteSpace: 'pre-wrap' }}>{c.input}</div>
                            </div>
                            <div>
                              <div style={{ color: '#6b7280', marginBottom: '0.2rem' }}>Expected:</div>
                              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', color: '#4ade80', whiteSpace: 'pre-wrap' }}>{c.expected}</div>
                            </div>
                            <div>
                              <div style={{ color: '#6b7280', marginBottom: '0.2rem' }}>Your Output:</div>
                              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem', borderRadius: '4px', color: c.passed ? '#abb2bf' : 'var(--color-danger)', whiteSpace: 'pre-wrap' }}>{c.output}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    {/* Judge Result Screen strictly matched to output rules */}
                    <div style={{ fontFamily: 'var(--font-mono)', color: '#f3f4f6', marginBottom: '2rem' }}>
                      <div style={{ color: '#6b7280' }}>==============================</div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem', margin: '0.5rem 0' }}>Submission Result</div>
                      <div style={{ color: '#6b7280', marginBottom: '1.5rem' }}>==============================</div>
                      
                      <div style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        Status: <strong style={{ color: outputResults.status === 'Accepted' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {outputResults.status} {outputResults.status === 'Accepted' ? '✅' : '❌'}
                        </strong>
                      </div>

                      {/* If failed, show failed hidden test case */}
                      {outputResults.status !== 'Accepted' && outputResults.cases?.find(c => !c.passed && c.isHidden) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                          <div style={{ color: 'var(--color-danger)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Failed Hidden Test Case:</div>
                          <div style={{ color: '#9ca3af' }}>
                            {`Hidden Test Case ${outputResults.cases.findIndex(c => !c.passed && c.isHidden) - outputResults.cases.filter(c => !c.isHidden).length + 1}`}
                          </div>
                        </div>
                      )}

                      {/* If accepted, show Sample and Hidden cases */}
                      {outputResults.status === 'Accepted' && (
                        <>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Sample Test Cases:</div>
                            {outputResults.cases?.filter(c => !c.isHidden).map((c, i) => (
                              <div key={i} style={{ color: '#9ca3af', marginBottom: '0.2rem' }}>
                                ✓ Test Case {i + 1} Passed
                              </div>
                            ))}
                          </div>

                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Hidden Test Cases:</div>
                            {outputResults.cases?.filter(c => c.isHidden).map((c, i) => (
                              <div key={i} style={{ color: '#9ca3af', marginBottom: '0.2rem' }}>
                                ✓ Hidden Test Case {i + 1} Passed
                              </div>
                            ))}
                          </div>
                        </>
                      )}

                      <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>{outputResults.status === 'Accepted' ? 'Total Passed:' : 'Passed:'}</div>
                        <div style={{ color: '#9ca3af' }}>
                          {outputResults.passedCases} / {outputResults.totalCases}
                        </div>
                      </div>

                      {/* If Accepted, show Execution Time and Memory */}
                      {outputResults.status === 'Accepted' && (
                        <>
                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Execution Time:</div>
                            <div style={{ color: '#9ca3af' }}>{Math.floor(outputResults.runtime * 1000)} ms</div>
                          </div>
                          
                          <div style={{ marginBottom: '1.5rem' }}>
                            <div style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Memory Used:</div>
                            <div style={{ color: '#9ca3af' }}>{outputResults.memory} MB</div>
                          </div>
                        </>
                      )}

                      <div style={{ color: '#6b7280' }}>==============================</div>
                    </div>

                    {/* Real-time stats */}
                    {outputResults.stats && (
                      <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '1rem', color: '#f3f4f6' }}>
                        <h4 style={{ color: '#f3f4f6', marginBottom: '0.75rem' }}>Your Progress Updated</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                          <div><div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Total Solved</div><div style={{ fontSize: '1.1rem' }}>{outputResults.stats.totalSolved}</div></div>
                          <div><div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Easy Solved</div><div style={{ fontSize: '1.1rem' }}>{outputResults.stats.easySolved || 0}</div></div>
                          <div><div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Medium Solved</div><div style={{ fontSize: '1.1rem' }}>{outputResults.stats.mediumSolved || 0}</div></div>
                          <div><div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Hard Solved</div><div style={{ fontSize: '1.1rem' }}>{outputResults.stats.hardSolved || 0}</div></div>
                          <div><div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Current Streak</div><div style={{ fontSize: '1.1rem' }}>🔥 {outputResults.stats.currentStreak}</div></div>
                          <div><div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Acceptance Rate</div><div style={{ fontSize: '1.1rem' }}>{outputResults.stats.acceptanceRate}%</div></div>
                          <div><div style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Total Submissions</div><div style={{ fontSize: '1.1rem' }}>{outputResults.stats.totalSubmissions}</div></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submissions Tab Content */}
            {activeConsoleTab === 'submissions' && (
              <div>
                {userSubmissions.length === 0 ? (
                  <div style={{ color: 'var(--text-muted)' }}>No submissions log for this problem yet.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {userSubmissions.map((sub, idx) => (
                      <div key={sub.id || sub._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '4px' }}>
                        <div>
                          <div style={{ marginBottom: '0.25rem' }}>
                            <strong style={{ color: 'var(--text-primary)', marginRight: '0.5rem' }}>Submission #{userSubmissions.length - idx}</strong>
                            <span style={{ color: sub.status === 'Accepted' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                              {sub.status}
                            </span>
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', gap: '1rem' }}>
                            <span>Language: {sub.language}</span>
                            <span>Passed: {sub.passed_cases}/{sub.total_cases}</span>
                            <span>Runtime: {(Math.random() * 0.15 + 0.05).toFixed(2)}s</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'right' }}>
                          {new Date(sub.submitted_at || sub.submittedAt).toLocaleDateString()}<br/>
                          {new Date(sub.submitted_at || sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {showSuccessPopup && (
        <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--bg-secondary)', border: '1px solid var(--color-success)', borderRadius: '12px', padding: '2.5rem 4rem', zIndex: 9999, boxShadow: '0 10px 40px rgba(0,0,0,0.7)', textAlign: 'center', animation: 'fadeIn 0.3s ease' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', animation: 'bounce 1s infinite' }}>🎉</div>
          <h2 style={{ fontSize: '2rem', color: 'var(--color-success)', marginBottom: '1rem' }}>Congratulations!</h2>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Problem Solved Successfully</p>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>All test cases passed.</p>
          <div style={{ display: 'inline-block', background: 'rgba(34, 197, 94, 0.2)', color: 'var(--color-success)', padding: '0.5rem 1.5rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '1.1rem' }}>
            +1 Problem Solved
          </div>
        </div>
      )}
    </div>
  );
}
