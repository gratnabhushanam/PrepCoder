import React, { useContext, useState, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { MapPin, Briefcase, Calendar, Link as LinkIcon, Award, Code, CheckCircle, Zap, Star, Shield, TrendingUp, Activity, BarChart2, Trophy } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user } = useContext(AppContext);
  const [loading, setLoading] = useState(true);

  // Simulate loading state for skeleton effect
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (!user) {
    return <div style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>Please log in to view your profile.</div>;
  }

  // Fallback Mock Data for requested fields
  const username = user.username || (user.email ? user.email.split('@')[0] : 'User');
  const role = user.role === 'admin' ? 'Administrator' : 'Student Developer';
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Jan 2026';
  
  const progress = user.userProgress || { total_solved: 0, easy_solved: 0, medium_solved: 0, hard_solved: 0 };
  const stats = {
    rating: progress.total_solved > 0 ? 1500 + progress.total_solved * 5 : 'Unranked',
    globalRank: progress.total_solved > 0 ? Math.max(1, 20000 - progress.total_solved * 100) : 'Unranked',
    streak: user.dailyStreak || 0,
    points: progress.easy_solved * 10 + progress.medium_solved * 20 + progress.hard_solved * 30,
    acceptance: progress.total_solved > 0 ? '100%' : 'N/A',
    solved: {
      total: progress.total_solved,
      easy: progress.easy_solved,
      medium: progress.medium_solved,
      hard: progress.hard_solved
    }
  };

  // Helper to render GitHub-style Submission Heatmap Mock
  const renderSubmissionHeatmap = () => {
    const weeks = Array.from({ length: 52 });
    return (
      <div className="activity-calendar">
        {weeks.map((_, i) => (
          <div key={i} className="calendar-col">
            {Array.from({ length: 7 }).map((_, j) => {
              const level = progress.total_solved > 0 ? Math.floor(Math.random() * 5) : 0;
              const title = progress.total_solved > 0 ? `${Math.floor(Math.random()*10)} submissions` : '0 submissions';
              return <div key={j} className={`calendar-cell level-${level}`} title={title}></div>;
            })}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-banner skeleton" style={{ height: '200px' }}></div>
        <div className="profile-grid">
          <div className="card skeleton" style={{ height: '300px' }}></div>
          <div className="card skeleton" style={{ height: '300px' }}></div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container animation-fade-in">
      
      {/* Top Header Section */}
      <div className="profile-header-card card">
        <div className="profile-banner"></div>
        <div className="profile-header-content">
          <div className="profile-avatar-wrapper">
            <img 
              src={user.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name || 'User'}`} 
              alt="Avatar" 
              className="profile-avatar"
            />
          </div>
          
          <div className="profile-info-main">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 className="profile-name">{user.name}</h1>
                <h2 className="profile-username">@{username}</h2>
                <p className="profile-bio">Full Stack Developer | Competitive Programmer | Building awesome things.</p>
                
                <div className="profile-meta">
                  <span className="meta-item"><Briefcase size={16}/> {role}</span>
                  <span className="meta-item"><MapPin size={16}/> California, USA</span>
                  <span className="meta-item"><Calendar size={16}/> Joined {memberSince}</span>
                  <span className="meta-item"><LinkIcon size={16}/> <a href="#" style={{color:'var(--color-primary)'}}>github.com/{username}</a></span>
                </div>
              </div>
              <Link to="/settings" className="btn btn-secondary">Edit Profile</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        
        {/* Left Column (Stats & Basics) */}
        <div className="profile-col profile-left">
          
          {/* Detailed Stats */}
          <div className="card">
            <div className="card-header"><h3><TrendingUp size={18}/> Statistics</h3></div>
            <div className="stats-list">
              <div className="stat-row">
                <span className="stat-label">Contest Rating</span>
                <span className="stat-value">{stats.rating}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Global Rank</span>
                <span className="stat-value">{typeof stats.globalRank === 'number' ? `#${stats.globalRank.toLocaleString()}` : stats.globalRank}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Acceptance Rate</span>
                <span className="stat-value">{stats.acceptance}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Current Streak</span>
                <span className="stat-value" style={{color: 'var(--color-warning)'}}><Zap size={14} style={{display:'inline', verticalAlign:'middle'}}/> {stats.streak} Days</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Total Points</span>
                <span className="stat-value">{stats.points.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Solved Problems Breakdown */}
          <div className="card">
            <div className="card-header"><h3><Code size={18}/> Solved Problems</h3></div>
            <div className="solved-ring-container">
              <div className="solved-total">
                <span className="solved-number">{stats.solved.total}</span>
                <span className="solved-text">Solved</span>
              </div>
              <div className="solved-bars">
                <div className="solved-bar-item">
                  <span className="diff-label" style={{color: 'var(--color-success)'}}>Easy</span>
                  <div className="progress-bar"><div className="fill" style={{width: `${stats.solved.total ? (stats.solved.easy / stats.solved.total) * 100 : 0}%`, background: 'var(--color-success)'}}></div></div>
                  <span className="count">{stats.solved.easy}</span>
                </div>
                <div className="solved-bar-item">
                  <span className="diff-label" style={{color: 'var(--color-warning)'}}>Medium</span>
                  <div className="progress-bar"><div className="fill" style={{width: `${stats.solved.total ? (stats.solved.medium / stats.solved.total) * 100 : 0}%`, background: 'var(--color-warning)'}}></div></div>
                  <span className="count">{stats.solved.medium}</span>
                </div>
                <div className="solved-bar-item">
                  <span className="diff-label" style={{color: 'var(--color-danger)'}}>Hard</span>
                  <div className="progress-bar"><div className="fill" style={{width: `${stats.solved.total ? (stats.solved.hard / stats.solved.total) * 100 : 0}%`, background: 'var(--color-danger)'}}></div></div>
                  <span className="count">{stats.solved.hard}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Languages */}
          <div className="card">
            <div className="card-header"><h3><BarChart2 size={18}/> Favorite Languages</h3></div>
            <div className="language-tags">
              <span className="lang-tag"><span className="lang-dot" style={{background:'#f7df1e'}}></span> JavaScript (45%)</span>
              <span className="lang-tag"><span className="lang-dot" style={{background:'#3776ab'}}></span> Python (30%)</span>
              <span className="lang-tag"><span className="lang-dot" style={{background:'#00599c'}}></span> C++ (15%)</span>
            </div>
          </div>
        </div>

        {/* Right Column (Activity & Heatmap) */}
        <div className="profile-col profile-right">
          
          <div className="card submission-heatmap">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={18} /> Submission Heatmap
              </h3>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{progress.total_solved > 0 ? (progress.total_solved * 4) : 0} submissions in the last year</span>
            </div>
            <div className="calendar-wrapper">
              {renderSubmissionHeatmap()}
            </div>
            <div className="calendar-legend">
              <span>Less</span>
              <div className="calendar-cell level-0"></div>
              <div className="calendar-cell level-1"></div>
              <div className="calendar-cell level-2"></div>
              <div className="calendar-cell level-3"></div>
              <div className="calendar-cell level-4"></div>
              <span>More</span>
            </div>
          </div>

          {/* Badges / Achievements */}
          <div className="card">
            <div className="card-header"><h3><Award size={18}/> Achievements</h3></div>
            <div className="badges-grid">
              <div className="badge-card" style={{ '--badge-color': 'var(--color-warning)' }}>
                <Zap size={24} className="badge-icon"/>
                <span className="badge-title">7-Day Streak</span>
              </div>
              <div className="badge-card" style={{ '--badge-color': 'var(--color-primary)' }}>
                <Star size={24} className="badge-icon"/>
                <span className="badge-title">Rising Star</span>
              </div>
              <div className="badge-card" style={{ '--badge-color': 'var(--color-info)' }}>
                <Code size={24} className="badge-icon"/>
                <span className="badge-title">100 Problems</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="card-header"><h3>Recent Activity</h3></div>
            <div className="activity-timeline">
              <div className="timeline-item">
                <div className="timeline-icon success"><CheckCircle size={14}/></div>
                <div className="timeline-content">
                  <p>Solved <strong>Two Sum</strong></p>
                  <small className="text-muted">2 hours ago</small>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon warning"><Zap size={14}/></div>
                <div className="timeline-content">
                  <p>Earned <strong>7-Day Streak</strong> Badge</p>
                  <small className="text-muted">Yesterday</small>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-icon primary"><Trophy size={14}/></div>
                <div className="timeline-content">
                  <p>Participated in <strong>Weekly Contest 104</strong></p>
                  <small className="text-muted">3 days ago</small>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
