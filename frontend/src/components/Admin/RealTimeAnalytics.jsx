import React from 'react';
import useSWR from 'swr';
import axios from 'axios';
import { useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function RealTimeAnalytics() {
  const { API_BASE, token } = useContext(AppContext);

  const fetcher = url => axios.get(url, { headers: { Authorization: `Bearer ${token}` } }).then(res => res.data);
  
  // Real-time polling every 10 seconds
  const { data, error } = useSWR(`${API_BASE}/admin/analytics/realtime`, fetcher, { refreshInterval: 10000 });

  if (error) return <div>Failed to load charts.</div>;
  if (!data) return <div>Loading real-time charts...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Real-Time Activity Trends (Last 30 Days)</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* Registrations Chart */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Daily User Registrations</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.registrationData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickFormatter={(tick) => tick.slice(5)} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="count" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorReg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Problem Solves Chart */}
        <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>Daily Problem Solves (Accepted)</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.solveData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} tickFormatter={(tick) => tick.slice(5)} />
                <YAxis stroke="var(--text-muted)" fontSize={12} />
                <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '8px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                <Bar dataKey="count" fill="var(--color-success)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}
