import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useContext(AppContext);

  if (!user) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Please log in to view your profile settings.</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Profile summary header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          fontWeight: 800,
          color: 'white'
        }}>
          {user.name?.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.2rem' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '0.5rem' }}>📧 {user.email}</p>
          <span className="badge badge-easy" style={{ padding: '0.3rem 0.6rem' }}>Daily Streak: {user.dailyStreak || 0} Days</span>
        </div>
        <div>
          <button onClick={logout} className="btn btn-danger" style={{ padding: '0.5rem 1.25rem' }}>
            Log Out
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem' }}>
        
        {/* MCQ & Coding stats detail */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Skill Statistics</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Placement Readiness Score:</span>
              <strong style={{ color: 'var(--color-accent)' }}>{user.readinessScore || 45}%</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Solved Coding Challenges:</span>
              <strong>{user.solvedProblems?.length || 0}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>MCQ Questions Attempted:</span>
              <strong>{user.mcqStats?.totalAttempted || 0}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>MCQ Correct Answers:</span>
              <strong>{user.mcqStats?.correctAnswers || 0}</strong>
            </div>
          </div>
        </div>

        {/* AI Mock Interview History logs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>AI Interview Sessions</h3>
          
          {user.aiInterviewStats?.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 'auto 0', textAlign: 'center' }}>
              No mock interview runs completed yet.
              <Link to="/ai-interview" style={{ color: 'var(--color-accent)', display: 'block', marginTop: '0.5rem', fontWeight: 'bold' }}>Start Practice round →</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '220px' }}>
              {user.aiInterviewStats?.map((s, i) => (
                <div key={i} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '4px', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, marginBottom: '0.25rem' }}>
                    <span>{s.interviewType} Interview</span>
                    <span style={{ color: 'var(--color-success)' }}>Score: {s.score}/10</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Comm: {s.communicationScore} • Tech: {s.technicalScore} • Conf: {s.confidenceScore}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
