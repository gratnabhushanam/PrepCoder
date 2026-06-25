import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { Trash2, Shield, ShieldOff, Eye, Search } from 'lucide-react';

export default function UsersManagement() {
  const { API_BASE, token } = useContext(AppContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSubmissions, setUserSubmissions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [API_BASE, token]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to completely delete this user? This will remove all their submissions, attempts, and stats!')) {
      try {
        await axios.delete(`${API_BASE}/admin/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUsers(users.filter(u => u.id !== id && u._id !== id));
      } catch (e) {
        alert('Failed to delete user');
      }
    }
  };

  const handleRoleChange = async (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await axios.put(`${API_BASE}/admin/users/${id}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(users.map(u => (u.id === id || u._id === id) ? { ...u, role: newRole } : u));
    } catch (e) {
      alert('Failed to update role');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div>Loading users...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>User Management</h2>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.2rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Total: <strong>{users.length}</strong></span>
          <span style={{ color: 'var(--color-primary)' }}>Admins: <strong>{users.filter(u => u.role === 'admin').length}</strong></span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.2)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Name</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Email</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Role</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Solved</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Joined</th>
              <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.name}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 'bold', background: u.role === 'admin' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255,255,255,0.1)', color: u.role === 'admin' ? '#a855f7' : 'var(--text-primary)' }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem' }}>{u.solvedProblems?.length || 0}</td>
                <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={async () => {
                    setSelectedUser(u);
                    setLoadingSubs(true);
                    try {
                      const res = await axios.get(`${API_BASE}/admin/submissions`, { headers: { Authorization: `Bearer ${token}` } });
                      const uid = u._id || u.id;
                      setUserSubmissions(res.data.filter(s => (s.user_id && (s.user_id._id === uid || s.user_id.id === uid))));
                    } catch (e) {
                      console.error('Failed to load subs', e);
                    }
                    setLoadingSubs(false);
                  }} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title="View Details">
                    <Eye size={16} />
                  </button>
                  <button onClick={() => handleRoleChange(u._id || u.id, u.role)} style={{ background: 'transparent', border: '1px solid var(--border-color)', color: u.role === 'admin' ? 'var(--color-warning)' : 'var(--color-primary)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}>
                    {u.role === 'admin' ? <ShieldOff size={16} /> : <Shield size={16} />}
                  </button>
                  <button onClick={() => handleDelete(u._id || u.id)} style={{ background: 'transparent', border: '1px solid var(--color-danger)', color: 'var(--color-danger)', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }} title="Delete User">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setSelectedUser(null)}>
          <div style={{ background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '12px', width: '90%', maxWidth: '500px', border: '1px solid var(--border-color)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>User Profile Details</h3>
            <div style={{ display: 'grid', gap: '1rem', fontSize: '1.1rem' }}>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>Name:</span> <strong>{selectedUser.name}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>Email:</span> <strong>{selectedUser.email}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>Role:</span> <strong>{selectedUser.role.toUpperCase()}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>Joined Date:</span> <strong>{new Date(selectedUser.createdAt).toLocaleDateString()}</strong></div>
              <hr style={{ borderColor: 'var(--border-color)', margin: '0.5rem 0' }} />
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>Problems Solved:</span> <strong>{selectedUser.solvedProblems?.length || 0}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>MCQs Practiced:</span> <strong>{selectedUser.mcqStats?.totalAttempted || 0}</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>Current Streak:</span> <strong>{selectedUser.dailyStreak || 0} days</strong></div>
              <div><span style={{ color: 'var(--text-secondary)', display: 'inline-block', width: '150px' }}>Placement Readiness:</span> <strong>{selectedUser.readinessScore || 0}%</strong></div>
            </div>
            
            <div style={{ marginTop: '1.5rem', maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-primary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Recent Submissions</h4>
              {loadingSubs ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Loading submissions...</div>
              ) : userSubmissions.length === 0 ? (
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>No recent submissions found.</div>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.9rem' }}>
                  {userSubmissions.slice(0, 10).map((sub, i) => (
                    <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i === userSubmissions.slice(0,10).length - 1 ? 'none' : '1px solid var(--border-color)' }}>
                      <span style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }} title={sub.question_id?.title}>
                        {sub.question_id?.title || 'Unknown Problem'}
                      </span>
                      <span style={{ fontWeight: 'bold', color: sub.status === 'Accepted' ? 'var(--color-success)' : 'var(--color-danger)' }}>{sub.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button onClick={() => setSelectedUser(null)} style={{ marginTop: '2rem', width: '100%', padding: '0.75rem', background: 'var(--color-primary)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
