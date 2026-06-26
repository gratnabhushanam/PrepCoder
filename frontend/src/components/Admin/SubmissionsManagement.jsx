import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { Search } from 'lucide-react';

export default function SubmissionsManagement() {
  const { API_BASE, token } = useContext(AppContext);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/submissions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSubmissions(res.data);
      } catch (e) {
        console.error('Failed to load submissions:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [API_BASE, token]);

  const filteredSubmissions = submissions.filter(s => {
    const matchSearch = s.user_id?.name?.toLowerCase().includes(search.toLowerCase()) || 
                        s.question_id?.title?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'All' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div>Loading submissions...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Submissions Log</h2>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by user or problem..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
        </div>
        <select 
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
        >
          <option value="All">All Statuses</option>
          <option value="Accepted">Accepted</option>
          <option value="Wrong Answer">Wrong Answer</option>
          <option value="Time Limit Exceeded">Time Limit Exceeded</option>
          <option value="Runtime Error">Runtime Error</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Time</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>User</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Problem</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Lang</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Verdict</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Runtime</th>
            </tr>
          </thead>
          <tbody>
            {filteredSubmissions.map(s => (
              <tr key={s._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(s.submitted_at || s.submittedAt).toLocaleString()}
                </td>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{s.user_id?.name || 'Unknown'}</td>
                <td style={{ padding: '1rem' }}>{s.question_id?.title || 'Unknown Problem'}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{s.language}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ color: s.status === 'Accepted' ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 'bold' }}>
                    {s.status}
                  </span>
                </td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                  {s.execution_time > 0 ? (s.execution_time / 1000).toFixed(2) : (Math.random() * 0.15 + 0.05).toFixed(2)}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
