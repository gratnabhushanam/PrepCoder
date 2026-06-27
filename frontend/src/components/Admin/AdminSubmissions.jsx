import React, { useState } from 'react';
import { Eye, Download, Search, Filter } from 'lucide-react';

export default function AdminSubmissions() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock live submissions data
  const mockSubmissions = [
    { id: 'SUB-9821', user: 'johndoe', problem: 'Two Sum', lang: 'Python', status: 'Accepted', time: '45ms', memory: '14.2MB', date: 'Just now' },
    { id: 'SUB-9820', user: 'alicesmith', problem: 'Reverse Linked List', lang: 'Java', status: 'Wrong Answer', time: '120ms', memory: '42.1MB', date: '2 min ago' },
    { id: 'SUB-9819', user: 'bob_dev', problem: 'Merge Intervals', lang: 'C++', status: 'Time Limit Exceeded', time: '2001ms', memory: '8.4MB', date: '5 min ago' },
    { id: 'SUB-9818', user: 'charlie99', problem: 'Valid Parentheses', lang: 'JavaScript', status: 'Runtime Error', time: '0ms', memory: '0MB', date: '12 min ago' },
    { id: 'SUB-9817', user: 'johndoe', problem: 'Two Sum', lang: 'Python', status: 'Compilation Error', time: '-', memory: '-', date: '15 min ago' },
    { id: 'SUB-9816', user: 'eve_hacker', problem: 'LRU Cache', lang: 'Go', status: 'Accepted', time: '12ms', memory: '6.2MB', date: '22 min ago' },
  ];

  const getStatusColor = (status) => {
    switch(status) {
      case 'Accepted': return 'var(--color-success)';
      case 'Wrong Answer': return 'var(--color-danger)';
      case 'Time Limit Exceeded': return 'var(--color-warning)';
      case 'Compilation Error': return 'var(--color-info)';
      case 'Runtime Error': return 'var(--color-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  const getStatusBg = (status) => {
    switch(status) {
      case 'Accepted': return 'rgba(34, 197, 94, 0.1)';
      case 'Wrong Answer': return 'rgba(239, 68, 68, 0.1)';
      case 'Time Limit Exceeded': return 'rgba(245, 158, 11, 0.1)';
      case 'Compilation Error': return 'rgba(14, 165, 233, 0.1)';
      case 'Runtime Error': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(255,255,255,0.05)';
    }
  };

  return (
    <div className="animation-fade-in" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Submission Monitoring</h2>
      
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        
        {/* Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem', borderBottom: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search by ID, User, or Problem..."
              style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16}/> Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', whiteSpace: 'nowrap' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
              <tr>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>ID</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>User</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Problem</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Time / Mem</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lang</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Submitted</th>
                <th style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockSubmissions.filter(s => s.user.includes(searchTerm) || s.problem.includes(searchTerm) || s.id.includes(searchTerm)).map((sub, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border-color)', transition: 'var(--transition-fast)' }} className="table-row-hover">
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>{sub.id}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>@{sub.user}</td>
                  <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{sub.problem}</td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span style={{ 
                      padding: '0.3rem 0.6rem', 
                      borderRadius: 'var(--radius-sm)', 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      color: getStatusColor(sub.status),
                      background: getStatusBg(sub.status)
                    }}>
                      {sub.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    {sub.time} / {sub.memory}
                  </td>
                  <td style={{ padding: '1rem 1.5rem' }}>
                    <span className="badge badge-medium">{sub.lang}</span>
                  </td>
                  <td style={{ padding: '1rem 1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{sub.date}</td>
                  <td style={{ padding: '1rem 1.5rem', display: 'flex', gap: '0.5rem' }}>
                    <button className="btn-icon" title="View Source"><Eye size={18}/></button>
                    <button className="btn-icon" title="Download"><Download size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          <span>Showing 1 to 6 of 8,920 entries</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem' }}>Prev</button>
            <button className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem' }}>Next</button>
          </div>
        </div>
      </div>
      
      <style>{`
        .table-row-hover:hover {
          background: rgba(255,255,255,0.02);
        }
      `}</style>
    </div>
  );
}
