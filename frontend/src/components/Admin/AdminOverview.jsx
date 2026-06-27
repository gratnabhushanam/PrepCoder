import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../../context/AppContext';
import { Users, Code, Activity, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminOverview({ analytics }) {
  const { API_BASE, token } = useContext(AppContext);
  const [realtimeData, setRealtimeData] = useState({ registrationData: [], solveData: [] });

  useEffect(() => {
    const fetchRealtime = async () => {
      try {
        const res = await axios.get(`${API_BASE}/admin/analytics/realtime`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setRealtimeData(res.data);
      } catch (err) {
        console.error('Failed to fetch realtime data', err);
      }
    };
    fetchRealtime();
  }, [API_BASE, token]);

  // Use real data if available, fallback to zeros for the chart shape
  const last7Days = realtimeData.solveData.slice(-7).map(d => d.count);
  const chartData = last7Days.length > 0 ? last7Days : [0, 0, 0, 0, 0, 0, 0];
  const maxValue = Math.max(...chartData, 10);

  return (
    <div className="animation-fade-in" style={{ padding: '2rem' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '2rem', color: 'var(--text-primary)' }}>Dashboard Overview</h2>
      
      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', borderRadius: '12px' }}>
            <Users size={28} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{analytics?.summary?.totalUsers || 1245}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>TOTAL USERS</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: '12px' }}>
            <Code size={28} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{analytics?.summary?.totalQuestions || 45}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>TOTAL PROBLEMS</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '12px' }}>
            <Activity size={28} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{analytics?.summary?.totalSubmissions || 8920}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>TOTAL SUBMISSIONS</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--color-warning)', borderRadius: '12px' }}>
            <TrendingUp size={28} />
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{analytics?.summary?.activeProblems || 0}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '0.25rem' }}>ACTIVE PROBLEMS</div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Today's Metrics */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Today's Activity & Metrics</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        <div className="card glass" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <CheckCircle size={24} style={{ color: 'var(--color-success)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analytics?.summary?.acceptedSolutions || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Accepted Solutions</div>
        </div>
        <div className="card glass" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <AlertTriangle size={24} style={{ color: 'var(--color-danger)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analytics?.submissionsStatus?.['Compilation Error'] || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Compiler Errors</div>
        </div>
        <div className="card glass" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <Activity size={24} style={{ color: 'var(--color-warning)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analytics?.submissionsStatus?.['Runtime Error'] || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Runtime Errors</div>
        </div>
        <div className="card glass" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
          <Users size={24} style={{ color: 'var(--color-info)', margin: '0 auto 0.5rem' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{analytics?.summary?.newUsersToday || 0}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>New Registrations Today</div>
        </div>
      </div>

      {/* Charts Row (Mock CSS Chart for aesthetics) */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Submissions (Last 7 Days)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '1rem', paddingTop: '2rem' }}>
            {chartData.map((val, idx) => (
              <div key={idx} style={{ 
                flex: 1, 
                backgroundColor: 'var(--color-primary)', 
                height: `${(val / maxValue) * 100}%`,
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                transition: 'height 1s ease-out'
              }}>
                <span style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.5rem' }}>Language Usage</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}><span>Python</span><span>45%</span></div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: '45%', height: '100%', background: '#3776ab' }}></div></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}><span>C++</span><span>30%</span></div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: '30%', height: '100%', background: '#00599c' }}></div></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}><span>JavaScript</span><span>15%</span></div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: '15%', height: '100%', background: '#f7df1e' }}></div></div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}><span>Java</span><span>10%</span></div>
              <div style={{ height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}><div style={{ width: '10%', height: '100%', background: '#b07219' }}></div></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
