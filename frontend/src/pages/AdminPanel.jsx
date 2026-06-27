import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import QuestionManagement from '../components/Admin/QuestionManagement';
import AdminSidebar from '../components/Admin/AdminSidebar';
import UsersManagement from '../components/Admin/UsersManagement';
import RealTimeAnalytics from '../components/Admin/RealTimeAnalytics';
import SettingsManagement from '../components/Admin/SettingsManagement';

// New Components
import AdminOverview from '../components/Admin/AdminOverview';
import AdminSystemHealth from '../components/Admin/AdminSystemHealth';
import AdminSubmissions from '../components/Admin/AdminSubmissions';
import AdminContests from '../components/Admin/AdminContests';

export default function AdminPanel() {
  const { API_BASE, user, token } = useContext(AppContext);

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, add_concept, add_prob, add_mcq, manage_questions, settings

  // Add Concept states
  const [conceptName, setConceptName] = useState('');
  const [conceptDesc, setConceptDesc] = useState('');
  const [conceptIcon, setConceptIcon] = useState('💡');

  // Add Problem states
  const [conceptsList, setConceptsList] = useState([]);
  const [probConceptId, setProbConceptId] = useState('');
  const [probTitle, setProbTitle] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [probDiff, setProbDiff] = useState('Easy');
  const [probConstraints, setProbConstraints] = useState('');
  const [probInputFormat, setProbInputFormat] = useState('');
  const [probOutputFormat, setProbOutputFormat] = useState('');
  const [probCompanies, setProbCompanies] = useState('');
  const [probEditorial, setProbEditorial] = useState('');
  const [probHints, setProbHints] = useState('');
  const [probVideo, setProbVideo] = useState('');
  
  // Testcases dynamic array
  const [publicCases, setPublicCases] = useState([{ input: '', expected_output: '' }]);
  const [hiddenCases, setHiddenCases] = useState([{ input: '', expected_output: '' }]);

  const [message, setMessage] = useState('');

  // Manage MCQs states
  const [mcqList, setMcqList] = useState([]);
  
  // Add MCQ states
  const [mcqQuestion, setMcqQuestion] = useState('');
  const [mcqDesc, setMcqDesc] = useState('');
  const [mcqOptionA, setMcqOptionA] = useState('');
  const [mcqOptionB, setMcqOptionB] = useState('');
  const [mcqOptionC, setMcqOptionC] = useState('');
  const [mcqOptionD, setMcqOptionD] = useState('');
  const [mcqCorrect, setMcqCorrect] = useState('A');
  const [mcqDifficulty, setMcqDifficulty] = useState('Medium');
  const [mcqCategory, setMcqCategory] = useState('Aptitude');
  const [mcqCustomCategory, setMcqCustomCategory] = useState('');
  const [mcqPoints, setMcqPoints] = useState(1);
  const [mcqStatus, setMcqStatus] = useState('Active');

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (e) {
      console.error('Failed to load admin metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchConcepts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/coding/concepts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConceptsList(res.data);
      if (res.data.length > 0) setProbConceptId(res.data[0].id);
    } catch (e) {
      console.error('Failed to load concepts:', e);
    }
  };

  const fetchMcqs = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/mcqs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMcqList(res.data);
    } catch (e) {
      console.error('Failed to load MCQs:', e);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    fetchConcepts();
    fetchMcqs();
  }, [API_BASE, token]);

  const handleAddConcept = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await axios.post(`${API_BASE}/admin/coding/concepts`, {
        name: conceptName,
        description: conceptDesc,
        icon: conceptIcon
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ Concept added successfully!');
      setConceptName('');
      setConceptDesc('');
      fetchConcepts();
    } catch (err) {
      setMessage('❌ Failed to add concept.');
    }
  };

  const handleAddProblem = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const companiesArr = probCompanies.split(',').map(c => c.trim()).filter(c => c);

      await axios.post(`${API_BASE}/admin/coding/questions`, {
        concept_id: probConceptId,
        title: probTitle,
        statement: probDesc,
        difficulty: probDiff,
        constraints: probConstraints,
        input_format: probInputFormat,
        output_format: probOutputFormat,
        editorial: probEditorial,
        hints: probHints.split('\n').filter(h => h.trim() !== ''),
        video_solution: probVideo,
        companies: companiesArr,
        public_testcases: publicCases.filter(tc => tc.input && tc.expected_output),
        hidden_testcases: hiddenCases.filter(tc => tc.input && tc.expected_output)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ Coding problem created successfully!');
      setProbTitle('');
      setProbDesc('');
      setProbConstraints('');
      setProbInputFormat('');
      setProbOutputFormat('');
      setProbEditorial('');
      setProbHints('');
      setProbVideo('');
      setProbCompanies('');
      setPublicCases([{ input: '', expected_output: '' }]);
      setHiddenCases([{ input: '', expected_output: '' }]);
      fetchAnalytics();
    } catch (err) {
      setMessage('❌ Failed to create coding problem.');
    }
  };

  const handleAddMcq = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const finalCategory = mcqCategory === 'Custom' ? mcqCustomCategory : mcqCategory;
      await axios.post(`${API_BASE}/admin/mcqs`, {
        question: mcqQuestion,
        description: mcqDesc,
        optionA: mcqOptionA,
        optionB: mcqOptionB,
        optionC: mcqOptionC,
        optionD: mcqOptionD,
        correctAnswer: mcqCorrect,
        difficulty: mcqDifficulty,
        category: finalCategory,
        points: mcqPoints,
        status: mcqStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMessage('✅ MCQ created successfully!');
      setMcqQuestion(''); setMcqDesc(''); setMcqOptionA(''); setMcqOptionB(''); setMcqOptionC(''); setMcqOptionD('');
      setMcqCorrect('A'); setMcqDifficulty('Medium'); setMcqPoints(1); setMcqStatus('Active');
      setMcqCustomCategory('');
      fetchMcqs();
      fetchAnalytics();
    } catch (err) {
      setMessage('❌ Failed to create MCQ.');
    }
  };

  const handleDeleteMcq = async (id) => {
    if (!window.confirm('Are you sure you want to delete this MCQ?')) return;
    try {
      await axios.delete(`${API_BASE}/admin/mcqs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage('✅ MCQ deleted successfully!');
      fetchMcqs();
      fetchAnalytics();
    } catch (err) {
      setMessage('❌ Failed to delete MCQ.');
    }
  };

  if (!user || user.role !== 'admin') {
    return <div className="main-content" style={{ textAlign: 'center', padding: '4rem 0' }}><h2>Access Denied. Admins Only.</h2></div>;
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Admin Workspace...</div>;

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      <AdminSidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setMessage(''); }} />
      
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', animation: 'fadeIn 0.5s ease' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Admin Control Center</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Configure test inventories, track platform usage, and review user analytics.</p>

      {message && (
        <div style={{
          background: message.includes('✅') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${message.includes('✅') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          color: message.includes('✅') ? 'var(--color-success)' : 'var(--color-danger)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.5rem',
          fontSize: '0.95rem'
        }}>
          {message}
        </div>
      )}

      {/* Tab Panel 1: Overview */}
      {activeTab === 'overview' && analytics && (
        <div>
          <div className="grid-4" style={{ marginBottom: '2.5rem' }}>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{analytics?.summary?.totalQuestions || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Total Questions</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-success)' }}>{analytics?.summary?.easyProblems || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Easy Questions</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-warning)' }}>{analytics?.summary?.mediumProblems || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Medium Questions</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-danger)' }}>{analytics?.summary?.hardProblems || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Hard Questions</div>
            </div>
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary)' }}>{analytics?.summary?.activeProblems || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Active Questions</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel: Question Management */}
      {activeTab === 'manage_questions' && (
        <QuestionManagement />
      )}

      {/* Tab Panel: Add MCQ */}
      {activeTab === 'add_mcq' && (
        <div className="card" style={{ maxWidth: '900px' }}>
          <h3 className="card-title">Add MCQ Question</h3>
          <form onSubmit={handleAddMcq}>
            <div className="form-group">
              <label className="form-label">Question</label>
              <textarea className="form-control" rows="3" required value={mcqQuestion} onChange={e => setMcqQuestion(e.target.value)} placeholder="Enter the MCQ question..." />
            </div>
            
            <div className="form-group">
              <label className="form-label">Description / Code Snippet (Optional)</label>
              <textarea className="form-control" rows="3" value={mcqDesc} onChange={e => setMcqDesc(e.target.value)} placeholder="Extra context or code snippet..." />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Option A</label>
                <input type="text" className="form-control" required value={mcqOptionA} onChange={e => setMcqOptionA(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Option B</label>
                <input type="text" className="form-control" required value={mcqOptionB} onChange={e => setMcqOptionB(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Option C</label>
                <input type="text" className="form-control" required value={mcqOptionC} onChange={e => setMcqOptionC(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Option D</label>
                <input type="text" className="form-control" required value={mcqOptionD} onChange={e => setMcqOptionD(e.target.value)} />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Correct Answer</label>
                <select className="form-control" required value={mcqCorrect} onChange={e => setMcqCorrect(e.target.value)}>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-control" value={mcqDifficulty} onChange={e => setMcqDifficulty(e.target.value)}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select className="form-control" required value={mcqCategory} onChange={e => setMcqCategory(e.target.value)}>
                  <option value="Aptitude">Aptitude</option>
                  <option value="Reasoning">Reasoning</option>
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                  <option value="SQL">SQL</option>
                  <option value="DBMS">DBMS</option>
                  <option value="Operating Systems">Operating Systems</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Custom">-- Custom Category --</option>
                </select>
              </div>
              {mcqCategory === 'Custom' && (
                <div className="form-group">
                  <label className="form-label">Custom Category Name</label>
                  <input type="text" className="form-control" required value={mcqCustomCategory} onChange={e => setMcqCustomCategory(e.target.value)} placeholder="e.g. Machine Learning" />
                </div>
              )}
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Points</label>
                <input type="number" className="form-control" required value={mcqPoints} onChange={e => setMcqPoints(parseInt(e.target.value))} min="1" max="100" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={mcqStatus} onChange={e => setMcqStatus(e.target.value)}>
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', marginTop: '1rem' }}>Create MCQ</button>
          </form>
        </div>
      )}

      {/* Tab Panel 2: Add Concept */}
      {activeTab === 'add_concept' && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 className="card-title">Add Concept Category</h3>
          <form onSubmit={handleAddConcept}>
            <div className="form-group">
              <label className="form-label">Concept Name</label>
              <input type="text" className="form-control" required value={conceptName} onChange={(e) => setConceptName(e.target.value)} placeholder="e.g. Arrays, Trees, Dynamic Programming" />
            </div>
            <div className="form-group">
              <label className="form-label">Icon (Emoji/String)</label>
              <input type="text" className="form-control" value={conceptIcon} onChange={(e) => setConceptIcon(e.target.value)} placeholder="e.g. 📊" />
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="3" value={conceptDesc} onChange={(e) => setConceptDesc(e.target.value)} placeholder="Brief description of the concept..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Concept</button>
          </form>
        </div>
      )}

      {/* Tab Panel 3: Add Coding Problem */}
      {activeTab === 'add_prob' && (
        <div className="card" style={{ maxWidth: '900px' }}>
          <h3 className="card-title">Upload Coding Question</h3>
          <form onSubmit={handleAddProblem}>
            
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Concept</label>
                <select className="form-control" required value={probConceptId} onChange={(e) => setProbConceptId(e.target.value)}>
                  {conceptsList.length === 0 && <option value="">No concepts available</option>}
                  {conceptsList.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Difficulty</label>
                <select className="form-control" value={probDiff} onChange={(e) => setProbDiff(e.target.value)}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Problem Title</label>
              <input type="text" className="form-control" required value={probTitle} onChange={(e) => setProbTitle(e.target.value)} placeholder="e.g. Two Sum" />
            </div>

            <div className="form-group">
              <label className="form-label">Problem Statement</label>
              <textarea className="form-control" rows="4" required value={probDesc} onChange={(e) => setProbDesc(e.target.value)} placeholder="Detailed problem statement..." />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Input Format</label>
                <textarea className="form-control" rows="2" value={probInputFormat} onChange={(e) => setProbInputFormat(e.target.value)} placeholder="e.g. First line contains N..." />
              </div>
              <div className="form-group">
                <label className="form-label">Output Format</label>
                <textarea className="form-control" rows="2" value={probOutputFormat} onChange={(e) => setProbOutputFormat(e.target.value)} placeholder="e.g. Print a single integer..." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Constraints</label>
              <textarea className="form-control" rows="2" value={probConstraints} onChange={(e) => setProbConstraints(e.target.value)} placeholder="e.g. 1 <= N <= 10^5" />
            </div>

            <div className="form-group">
              <label className="form-label">Company Tags (Comma separated)</label>
              <input type="text" className="form-control" value={probCompanies} onChange={(e) => setProbCompanies(e.target.value)} placeholder="e.g. Amazon, Google, TCS" />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Editorial Solution (Markdown)</label>
                <textarea className="form-control" rows="2" value={probEditorial} onChange={(e) => setProbEditorial(e.target.value)} placeholder="Explanation of the approach..." />
              </div>
              <div className="form-group">
                <label className="form-label">Hints (One per line)</label>
                <textarea className="form-control" rows="2" value={probHints} onChange={(e) => setProbHints(e.target.value)} placeholder="Hint 1\nHint 2..." />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Video Solution URL</label>
              <input type="text" className="form-control" value={probVideo} onChange={(e) => setProbVideo(e.target.value)} placeholder="https://youtube.com/..." />
            </div>

            {/* Test Cases Section */}
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Public Test Cases (Visible to Students)</h4>
              {publicCases.map((tc, idx) => (
                <div key={idx} className="grid-2" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Input</label>
                    <textarea className="form-control" rows="2" value={tc.input} onChange={e => {
                      const newArr = [...publicCases]; newArr[idx].input = e.target.value; setPublicCases(newArr);
                    }} placeholder="Input string"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Output</label>
                    <textarea className="form-control" rows="2" value={tc.expected_output} onChange={e => {
                      const newArr = [...publicCases]; newArr[idx].expected_output = e.target.value; setPublicCases(newArr);
                    }} placeholder="Output string"/>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={() => setPublicCases([...publicCases, {input: '', expected_output: ''}])}>+ Add Public Test Case</button>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Hidden Test Cases (Used for Submission)</h4>
              {hiddenCases.map((tc, idx) => (
                <div key={idx} className="grid-2" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '4px', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Input</label>
                    <textarea className="form-control" rows="2" value={tc.input} onChange={e => {
                      const newArr = [...hiddenCases]; newArr[idx].input = e.target.value; setHiddenCases(newArr);
                    }} placeholder="Input string"/>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expected Output</label>
                    <textarea className="form-control" rows="2" value={tc.expected_output} onChange={e => {
                      const newArr = [...hiddenCases]; newArr[idx].expected_output = e.target.value; setHiddenCases(newArr);
                    }} placeholder="Output string"/>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-secondary" onClick={() => setHiddenCases([...hiddenCases, {input: '', expected_output: ''}])}>+ Add Hidden Test Case</button>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>Upload Question</button>
          </form>
        </div>
      )}

      {/* New Component Mappings */}
      {activeTab === 'dashboard' && <AdminOverview analytics={analytics} />}
      {(activeTab === 'system_health' || activeTab === 'compiler_status' || activeTab === 'logs' || activeTab === 'compiler_config') && <AdminSystemHealth />}
      {activeTab === 'submissions' && <AdminSubmissions />}
      
      {/* Existing Component Mappings */}
      {activeTab === 'settings' && <SettingsManagement />}
      {activeTab === 'users' && <UsersManagement />}
      {activeTab === 'analytics' && <RealTimeAnalytics />}
      {activeTab === 'reports' && <div style={{padding:'2rem'}}><h2>Reports coming soon</h2></div>}
      {activeTab === 'announcements' && <div style={{padding:'2rem'}}><h2>Announcements coming soon</h2></div>}
      {activeTab === 'contests' && <AdminContests />}

      </div>
    </div>
  );
}
