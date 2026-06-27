import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { Plus, List, Trophy, Calendar, Clock, Loader, AlertCircle } from 'lucide-react';

export default function AdminContests() {
  const { API_BASE, token } = useContext(AppContext);
  const [contests, setContests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // 'list' | 'create'
  const [message, setMessage] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('120'); // minutes
  const [status, setStatus] = useState('Upcoming');
  const [selectedQuestions, setSelectedQuestions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contestsRes, questionsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/contests`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/coding/questions`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setContests(contestsRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      console.error('Failed to fetch data for contests', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContest = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!title || !startTime || !duration) {
      setMessage('❌ Title, Start Time, and Duration are required.');
      return;
    }

    try {
      // Calculate endTime based on startTime and duration
      const start = new Date(startTime);
      const end = new Date(start.getTime() + parseInt(duration) * 60000);

      await axios.post(`${API_BASE}/admin/contests`, {
        title,
        description,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        duration: parseInt(duration),
        status,
        questions: selectedQuestions
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage('✅ Contest created successfully!');
      
      // Reset form
      setTitle('');
      setDescription('');
      setStartTime('');
      setDuration('120');
      setSelectedQuestions([]);
      
      fetchData();
      setTimeout(() => setView('list'), 1500);
    } catch (err) {
      console.error(err);
      setMessage('❌ Failed to create contest.');
    }
  };

  const toggleQuestionSelection = (qId) => {
    if (selectedQuestions.includes(qId)) {
      setSelectedQuestions(selectedQuestions.filter(id => id !== qId));
    } else {
      setSelectedQuestions([...selectedQuestions, qId]);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}><Loader className="spin" /> Loading Contests...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><Trophy color="var(--color-primary)" /> Contest Management</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setView('list')}
          >
            <List size={16} /> All Contests
          </button>
          <button 
            className={`btn ${view === 'create' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => { setView('create'); setMessage(''); }}
          >
            <Plus size={16} /> Create Contest
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '1rem', background: message.includes('✅') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: message.includes('✅') ? '#10B981' : '#EF4444', borderRadius: '8px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {message}
        </div>
      )}

      {view === 'list' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          {contests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No contests created yet. Click "Create Contest" to add one.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Contest Title</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Status</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Start Time</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Duration</th>
                  <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Questions</th>
                </tr>
              </thead>
              <tbody>
                {contests.map((c) => (
                  <tr key={c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 600 }}>{c.title}</td>
                    <td style={{ padding: '1rem' }}>
                      <span className={`status-badge ${c.status === 'Active' ? 'status-success' : c.status === 'Upcoming' ? 'status-warning' : ''}`}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} /> {new Date(c.startTime).toLocaleString()}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      <Clock size={14} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} /> 
                      {c.duration} mins
                    </td>
                    <td style={{ padding: '1rem' }}>{c.questions?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: '2rem' }}>
          <form onSubmit={handleCreateContest}>
            <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Contest Title</label>
                <input type="text" className="form-control" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Coder Challenge #12" required />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-control" value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="Upcoming">Upcoming</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Description (Optional)</label>
              <textarea className="form-control" rows="2" value={description} onChange={e => setDescription(e.target.value)} placeholder="Contest rules or description..."></textarea>
            </div>

            <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input type="datetime-local" className="form-control" value={startTime} onChange={e => setStartTime(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input type="number" className="form-control" value={duration} onChange={e => setDuration(e.target.value)} required min="10" />
              </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} color="var(--color-primary)" /> Select Questions for Contest
              </h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '1rem' }}>
                {questions.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)' }}>No questions available. Please create coding problems first.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {questions.map(q => (
                      <label key={q._id || q.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: '6px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedQuestions.includes(q._id || q.id)}
                          onChange={() => toggleQuestionSelection(q._id || q.id)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600 }}>{q.title}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{q.difficulty} • {q.concept_name || 'General'}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Selected: <span style={{ fontWeight: 'bold', color: 'var(--color-primary)' }}>{selectedQuestions.length}</span> questions
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 2rem', width: '100%', fontSize: '1.1rem' }}>
              Create Contest
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
