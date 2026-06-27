import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { Code, Flame, CheckCircle, Activity, Trophy, ChevronRight, PlayCircle, Bookmark } from 'lucide-react';
import axios from 'axios';
import './Dashboard.css';

export default function Dashboard() {
  const { user, API_BASE, token } = useContext(AppContext);
  const [stats, setStats] = useState(null);
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dashboard/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      }

      try {
        const qRes = await axios.get(`${API_BASE}/coding/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(qRes.data)) {
          // Shuffle and pick 3 for recommendations
          const shuffled = qRes.data.sort(() => 0.5 - Math.random());
          setRecommended(shuffled.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch recommendations', err);
      }
    };
    if (token) {
      fetchStats();
    }
  }, [API_BASE, token]);

  const problemsSolved = stats?.algorithmsSolved || user?.solvedProblems?.length || 0;
  const streak = stats?.streak || user?.dailyStreak || 0;
  const rating = stats?.rank || 0; // Using rank for the 'rating' card since backend returns rank
  const acceptanceRate = stats?.atsScore ? `${stats.atsScore}% (ATS)` : "N/A"; // Or we can leave as N/A

  return (
    <div className="dashboard-container animation-fade-in">
      
      {/* Welcome Banner */}
      <div className="dashboard-welcome card">
        <div>
          <h1 className="welcome-title">Welcome back, {user?.name?.split(' ')[0] || 'Developer'}! 👋</h1>
          <p className="welcome-subtitle">You are on a {streak}-day coding streak. Keep it up!</p>
        </div>
        <Link to="/coding" className="btn btn-primary" style={{ padding: '0.8rem 1.5rem' }}>
          <PlayCircle size={18} /> Continue Solving
        </Link>
      </div>

      <div className="dashboard-grid">
        
        {/* Left Column */}
        <div className="dashboard-main-col">
          
          {/* Top Stats */}
          <div className="dashboard-stats-grid">
            <div className="card stat-card hover-lift">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                <Code size={24} />
              </div>
              <div>
                <div className="stat-value">{problemsSolved}</div>
                <div className="stat-label">Problems Solved</div>
              </div>
            </div>
            
            <div className="card stat-card hover-lift">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                <Flame size={24} />
              </div>
              <div>
                <div className="stat-value">{streak}</div>
                <div className="stat-label">Day Streak</div>
              </div>
            </div>

            <div className="card stat-card hover-lift">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
                <CheckCircle size={24} />
              </div>
              <div>
                <div className="stat-value">{acceptanceRate}</div>
                <div className="stat-label">Acceptance Rate</div>
              </div>
            </div>

            <div className="card stat-card hover-lift">
              <div className="stat-icon-wrapper" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' }}>
                <Trophy size={24} />
              </div>
              <div>
                <div className="stat-value">{rating === 0 ? '-' : `#${rating}`}</div>
                <div className="stat-label">Global Rank</div>
              </div>
            </div>
          </div>

          {/* Recommended Problems */}
          <div className="card">
            <div className="card-header">
              <h3>Recommended for You</h3>
              <Link to="/coding" className="view-all-link">View all <ChevronRight size={14}/></Link>
            </div>
            <div className="recommendation-list">
              {recommended.length > 0 ? recommended.map((prob, i) => (
                <div key={prob._id || i} className="problem-row">
                  <div className="problem-info">
                    <span className="problem-title">{prob.title}</span>
                    <span className="problem-acc">
                      Acceptance: {prob.stats ? (prob.stats.total_subs > 0 ? Math.round((prob.stats.accepted_subs / prob.stats.total_subs) * 100) : 0) : 'N/A'}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <span className={`diff-badge diff-${prob.difficulty?.toLowerCase()}`}>{prob.difficulty}</span>
                    <Link to={`/coding/${prob._id || prob.id}`} className="btn-icon" title="Solve"><PlayCircle size={20}/></Link>
                  </div>
                </div>
              )) : (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>Loading recommendations...</div>
              )}
            </div>
          </div>

          {/* Recent Submissions */}
          <div className="card">
            <div className="card-header">
              <h3>Recent Activity</h3>
            </div>
            <div className="submission-list">
              {stats?.recentActivity?.length > 0 ? (
                stats.recentActivity.map((sub, i) => (
                  <div key={i} className="submission-row">
                    <div className="sub-info">
                      <span className="sub-title">{sub.text}</span>
                      <span className="sub-time">{new Date(sub.date).toLocaleString()}</span>
                    </div>
                    <div className="sub-meta">
                      <span className="status-badge status-success">
                        Completed
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: '1rem', color: 'var(--text-muted)' }}>No recent activity.</div>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column */}
        <div className="dashboard-side-col">
          
          {/* Progress Chart */}
          <div className="card">
            <div className="card-header">
              <h3><Activity size={18} /> Progress</h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0 2rem' }}>
              <div className="donut-chart-mock">
                <span>{problemsSolved}</span>
                <small>Solved</small>
              </div>
            </div>
            <div className="progress-legend">
              <div className="legend-item"><span className="dot easy"></span> Algorithms ({stats?.algorithmsSolved || 0})</div>
              <div className="legend-item"><span className="dot medium"></span> MCQs ({stats?.mcqsPracticed || 0})</div>
            </div>
          </div>

          {/* Activity Calendar (Mock) */}
          <div className="card">
            <div className="card-header">
              <h3>Activity</h3>
            </div>
            <div className="activity-calendar-mini">
               {Array.from({ length: 42 }).map((_, j) => {
                 const level = Math.floor(Math.random() * 5);
                 return <div key={j} className={`calendar-cell level-${level}`}></div>;
               })}
            </div>
          </div>

          {/* Bookmarks */}
          <div className="card">
            <div className="card-header">
              <h3><Bookmark size={18} /> Bookmarks</h3>
            </div>
            <div className="bookmark-list">
              <div className="bookmark-item">Dynamic Programming Guide</div>
              <div className="bookmark-item">Graph Traversal Algorithms</div>
              <div className="bookmark-item">React State Management</div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
