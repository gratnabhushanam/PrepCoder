import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import useSWR from 'swr';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { user, API_BASE, token } = useContext(AppContext);
  
  const [mentorData, setMentorData] = useState(null);
  const [loadingMentor, setLoadingMentor] = useState(false);

  const fetcher = url => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);

  // Poll backend every 5 seconds for real-time updates without page reload
  const { data: stats } = useSWR(token ? `${API_BASE}/dashboard/stats` : null, fetcher, { refreshInterval: 5000 });
  const { data: tasks } = useSWR(token ? `${API_BASE}/dashboard/tasks` : null, fetcher, { refreshInterval: 5000 });
  const { data: charts } = useSWR(token ? `${API_BASE}/dashboard/charts` : null, fetcher, { refreshInterval: 5000 });

  const generateMentorPlan = async () => {
    setLoadingMentor(true);
    try {
      const res = await axios.get(`${API_BASE}/ai/mentor-plan`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMentorData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMentor(false);
    }
  };

  if (!user || !stats) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading user dashboard...</div>;

  const score = stats.readinessScore || 0;
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const strokeDashoffset = circ - (score / 100) * circ;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Welcome Banner & Rank */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.2rem' }}>
            Hello, {user.name}!
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Track your progress, practice coding algorithms, and test with interactive mock modules.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="card" style={{ padding: '0.5rem 1rem', display: 'flex', gap: '0.5rem', alignItems: 'center', margin: 0 }}>
             <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Global Rank</span>
             <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>#{stats.rank}</span>
          </div>
          <Link to="/ai-interview" className="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Mock Interview
          </Link>
        </div>
      </div>

      {/* Grid: Gauge & Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Left Column: Readiness Circle */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Placement Readiness
          </h3>
          
          <div className="readiness-gauge" style={{ marginBottom: '1.5rem' }}>
            <svg width="160" height="160">
              <circle cx="80" cy="80" r={radius} stroke="var(--border-color)" strokeWidth="12" fill="transparent" />
              <circle 
                cx="80" 
                cy="80" 
                r={radius} 
                stroke="url(#dashboardGradient)" 
                strokeWidth="12" 
                fill="transparent"
                strokeDasharray={circ} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round"
                style={{ 
                  transform: 'rotate(-90deg)', 
                  transformOrigin: '50% 50%', 
                  transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)' 
                }} 
              />
              <defs>
                <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="var(--color-accent)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="readiness-value">
              <div className="readiness-num">{score}%</div>
              <div className="readiness-label">Score</div>
            </div>
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
            {score < 60 
              ? 'Complete coding submissions and ATS resume scan to boost your score above 75%!' 
              : 'Excellent score! Keep practicing mock interview sessions to lock in placement selection.'}
          </p>
        </div>

        {/* Right Column: Statistics Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div className="grid-2" style={{ height: '100%' }}>
            
            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.8rem', background: 'rgba(168, 85, 247, 0.1)', color: 'var(--color-accent)', borderRadius: 'var(--radius-md)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Algorithms Solved</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.algorithmsSolved}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.8rem', background: 'rgba(142, 70, 45, 0.1)', color: 'var(--color-success)', borderRadius: 'var(--radius-md)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>MCQs Practiced</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.mcqsPracticed}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.8rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-info)', borderRadius: 'var(--radius-md)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></svg>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>ATS Score</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.atsScore ? `${stats.atsScore}%` : 'N/A'}</div>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ padding: '0.8rem', background: 'rgba(251, 191, 36, 0.1)', color: 'var(--color-warning)', borderRadius: 'var(--radius-md)' }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <div>
                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Daily Streak</h4>
                <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.streak} Days</div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Graphs Section */}
      {charts && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
          <div className="card">
            <h3 className="card-title">Coding Progress</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.codingProgress}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  <Bar dataKey="solved" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="card">
            <h3 className="card-title">MCQ Performance</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.mcqPerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="name" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  <Line type="monotone" dataKey="score" stroke="var(--color-success)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">ATS Improvement</h3>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={charts.atsImprovement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="attempt" stroke="#888" fontSize={12} />
                  <YAxis stroke="#888" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                  <Line type="monotone" dataKey="score" stroke="var(--color-info)" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Grid: Tasks Checklist & Recent Activity & AI Mentor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
        
        {/* Left Side: Tasks checklist */}
        <div className="card">
          <h3 className="card-title">Daily Progress Tasks</h3>
          <p className="card-desc">Tasks dynamically update based on your database progress.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks && tasks.map(t => (
              <div 
                key={t.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: t.done ? 'rgba(34, 197, 94, 0.05)' : 'var(--bg-secondary)',
                  border: `1px solid ${t.done ? 'rgba(34, 197, 94, 0.2)' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: `2px solid ${t.done ? 'var(--color-success)' : 'var(--text-muted)'}`,
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: t.done ? 'var(--color-success)' : 'transparent',
                  color: 'white'
                }}>
                  {t.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
                </div>
                <span style={{ 
                  fontSize: '0.95rem', 
                  color: t.done ? 'var(--text-muted)' : 'var(--text-primary)',
                  textDecoration: t.done ? 'line-through' : 'none'
                }}>
                  {t.text}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Recent Activity */}
        <div className="card">
          <h3 className="card-title">Recent Activity</h3>
          <p className="card-desc">Your latest accepted submissions and test results.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats.recentActivity && stats.recentActivity.length > 0 ? stats.recentActivity.map((activity, idx) => (
              <div key={idx} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{activity.text}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{new Date(activity.date).toLocaleString()}</div>
              </div>
            )) : (
               <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent activity yet. Start solving problems!</p>
            )}
          </div>
        </div>

        {/* Right Side: AI Placement Mentor */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--color-accent)' }}>✨</span>
            AI Placement Mentor
          </h3>
          <p className="card-desc">Generate study guides, schedule goals, and retrieve weak topic suggestions.</p>

          {!mentorData ? (
            <div style={{ margin: 'auto', textAlign: 'center', padding: '2rem' }}>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                Your study recommendations are ready to be compiled by AI.
              </p>
              <button onClick={generateMentorPlan} className="btn btn-primary" disabled={loadingMentor}>
                {loadingMentor ? 'Compiling Profile...' : 'Generate AI Study Plan'}
              </button>
            </div>
          ) : (
            <div style={{ overflowY: 'auto', flex: 1, maxHeight: '350px', paddingRight: '0.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Weak Topic Analysis</h4>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  {mentorData.weakTopicAnalysis}
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Company Suitability</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {mentorData.companyRecommendations?.map((r, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                      <span style={{ fontWeight: 650 }}>{r.name}</span>
                      <span style={{ color: r.suitability === 'High' ? 'var(--color-success)' : r.suitability === 'Medium' ? 'var(--color-warning)' : 'var(--text-muted)' }}>
                        {r.suitability} Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-accent)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>7-Day Action Plan</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {mentorData.studyPlan?.map((p, i) => (
                    <div key={i} style={{ fontSize: '0.85rem', padding: '0.5rem 0.75rem', borderLeft: '3px solid var(--color-primary)', background: 'var(--bg-secondary)' }}>
                      <span style={{ fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>{p.day}: {p.topic}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{p.details}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
