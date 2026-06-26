import React, { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useContext(AppContext);

  if (!user) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Please log in to view your profile settings.</div>;
  }

  // Dynamic Performance Calculations
  const problemsSolved = user.solvedProblems?.length || 0;
  const totalMcq = user.mcqStats?.totalAttempted || 0;
  const mcqCorrect = user.mcqStats?.correctAnswers || 0;
  const mcqAccuracy = totalMcq === 0 ? 0 : Math.round((mcqCorrect / totalMcq) * 100);
  
  // Calculate a true Readiness Score (Max 100%)
  // Algorithm weight: max 50 points (requires 20 solved)
  // MCQ weight: max 50 points (mcqAccuracy / 2)
  const algoScore = Math.min((problemsSolved / 20) * 50, 50);
  const mcqScore = mcqAccuracy / 2;
  const streakBonus = user.dailyStreak > 5 ? 5 : 0;
  
  const readinessScore = Math.min(Math.round(algoScore + mcqScore + streakBonus), 100);

  // Helper to generate circular progress SVG
  const CircularProgress = ({ percent, color, label, icon }) => {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r={radius} fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
            <circle cx="60" cy="60" r={radius} fill="none" stroke={color} strokeWidth="8" 
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
          </svg>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '1.2rem', marginBottom: '-0.2rem' }}>{icon}</span>
            <strong style={{ fontSize: '1.3rem', color: 'var(--text-primary)' }}>{percent}%</strong>
          </div>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</span>
      </div>
    );
  };

  // Helper to render Badges
  const renderBadges = () => {
    const badges = [];
    if (user.dailyStreak >= 7) badges.push({ icon: '🔥', title: '7-Day Streak Warrior', color: '#f59e0b', desc: 'Maintained a coding streak for a full week.' });
    if (user.dailyStreak >= 30) badges.push({ icon: '🔥', title: '30-Day Master', color: '#ef4444', desc: 'Maintained an incredible month-long streak!' });
    if (problemsSolved >= 10) badges.push({ icon: '💻', title: 'Code Initiate', color: '#3b82f6', desc: 'Solved your first 10 coding challenges.' });
    if (problemsSolved >= 50) badges.push({ icon: '🛡️', title: 'Algorithm Knight', color: '#8b5cf6', desc: 'Defeated 50 hard coding challenges.' });
    if (readinessScore >= 80) badges.push({ icon: '🌟', title: 'Interview Ready', color: '#10b981', desc: 'Achieved an elite Placement Readiness score.' });
    
    if (badges.length === 0) {
      return (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontStyle: 'italic' }}>
          Solve problems or maintain your daily streak to unlock exclusive badges!
        </div>
      );
    }

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '1rem' }}>
        {badges.map((b, i) => (
          <div key={i} style={{ 
            background: 'var(--bg-secondary)', 
            border: `1px solid ${b.color}40`, 
            borderRadius: 'var(--radius-md)', 
            padding: '1rem', 
            textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            boxShadow: `0 4px 15px ${b.color}15`,
            transition: 'transform 0.2s',
            cursor: 'default'
          }}
          title={b.desc}>
            <span style={{ fontSize: '2.5rem', marginBottom: '0.5rem', filter: `drop-shadow(0 0 10px ${b.color}80)` }}>{b.icon}</span>
            <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{b.title}</strong>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.5s ease', paddingBottom: '3rem' }}>
      
      {/* Premium Profile Header */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', flexWrap: 'wrap', marginBottom: '2rem', background: 'linear-gradient(to bottom right, var(--bg-primary), var(--bg-secondary))', border: '1px solid var(--border-color)', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <img 
          src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'User'}`} 
          alt="Profile Avatar" 
          style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '4px solid var(--color-primary)' }} 
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.2rem', background: '-webkit-linear-gradient(45deg, #fff, #a5b4fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {user.name}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginBottom: '1rem' }}>{user.email}</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="badge badge-medium" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>🔥 Streak: {user.dailyStreak || 0} Days</span>
            <span className="badge badge-hard" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>⭐ Total Points: {user.totalPoints || (user.mcqStats?.correctAnswers * 2) || 0}</span>
          </div>
        </div>
        <div>
          <button onClick={logout} className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
            Log Out
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
        
        {/* Visual Analytics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)' }}>Performance Analytics</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '1rem 0' }}>
            <CircularProgress percent={readinessScore} color="var(--color-accent)" label="Readiness" icon="📈" />
            <CircularProgress percent={mcqAccuracy} color="var(--color-success)" label="MCQ Accuracy" icon="🎯" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--color-primary)' }}>{problemsSolved}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Algorithms Solved</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b' }}>{totalMcq}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>MCQs Attempted</div>
            </div>
          </div>
        </div>

        {/* AI Mock Interview History logs */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1rem' }}>AI Interview Sessions</h3>
          
          {(!user.aiInterviewStats || user.aiInterviewStats.length === 0) ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: 'auto 0', textAlign: 'center', padding: '2rem' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🤖</span>
              No mock interview runs completed yet.
              <Link to="/ai-interview" className="btn btn-primary" style={{ display: 'block', marginTop: '1.5rem' }}>Start Practice Round</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', overflowY: 'auto', maxHeight: '300px', paddingRight: '0.5rem' }}>
              {user.aiInterviewStats.map((s, i) => (
                <div key={i} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderLeft: '4px solid var(--color-primary)', borderRadius: '4px', fontSize: '0.9rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginBottom: '0.5rem' }}>
                    <span>{s.interviewType} Interview</span>
                    <span style={{ color: 'var(--color-success)' }}>Score: {s.score}/10</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Comm: {s.communicationScore} • Tech: {s.technicalScore} • Conf: {s.confidenceScore}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Badges Section */}
      <div className="card">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Achievement Badges</h3>
        {renderBadges()}
      </div>

    </div>
  );
}
