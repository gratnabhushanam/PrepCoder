import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { Layers, Calendar, Code2, Clock, Cpu, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Submissions() {
  const { API_BASE, token } = useContext(AppContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/coding/submissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubmissions(res.data);
      } catch (err) {
        console.error('Failed to fetch submissions', err);
        setError('Failed to load submissions.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSubmissions();
    } else {
      setLoading(false);
    }
  }, [API_BASE, token]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Accepted':
        return <span className="status-badge status-success"><CheckCircle size={14} /> Accepted</span>;
      case 'Wrong Answer':
        return <span className="status-badge status-danger"><XCircle size={14} /> Wrong Answer</span>;
      case 'Time Limit Exceeded':
        return <span className="status-badge status-warning"><Clock size={14} /> TLE</span>;
      case 'Runtime Error':
      case 'Compilation Error':
        return <span className="status-badge status-danger"><AlertTriangle size={14} /> {status}</span>;
      default:
        return <span className="status-badge"><AlertTriangle size={14} /> {status}</span>;
    }
  };

  const getDifficultyColor = (diff) => {
    if (diff === 'Easy') return 'var(--color-success)';
    if (diff === 'Medium') return 'var(--color-warning)';
    if (diff === 'Hard') return 'var(--color-danger)';
    return 'var(--text-secondary)';
  };

  if (!token) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Please log in to view your submissions.</div>;
  }

  return (
    <div className="animation-fade-in" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={24} color="var(--color-primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>My Submissions</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, marginTop: '0.25rem' }}>View your past coding problem attempts.</p>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading submissions...</p>
        </div>
      ) : error ? (
        <div className="card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-danger)' }}>
          {error}
        </div>
      ) : submissions.length === 0 ? (
        <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
          <Layers size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
          <h2 style={{ color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No Submissions Yet</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>You haven't attempted any coding problems yet.</p>
          <Link to="/coding" className="btn btn-primary">Start Coding</Link>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem' }}>Time Submitted</th>
                <th style={{ padding: '1rem' }}>Question</th>
                <th style={{ padding: '1rem' }}>Status</th>
                <th style={{ padding: '1rem' }}>Language</th>
                <th style={{ padding: '1rem' }}>Runtime / Memory</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="hover-row">
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={14} />
                      {new Date(sub.createdAt).toLocaleString()}
                    </div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {sub.question_id ? (
                      <Link to={`/coding/workspace/${sub.question_id._id}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {sub.question_id.title}
                        <div style={{ fontSize: '0.8rem', color: getDifficultyColor(sub.question_id.difficulty), marginTop: '0.25rem' }}>
                          {sub.question_id.difficulty}
                        </div>
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Deleted Question</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {getStatusBadge(sub.status)}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className="badge badge-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Code2 size={12} /> {sub.language}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {sub.status === 'Accepted' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Clock size={12} /> {sub.execution_time} ms</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Cpu size={12} /> {(sub.memory_used / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
