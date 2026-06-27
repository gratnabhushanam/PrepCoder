import React from 'react';
import { Activity, Server, Cpu, Database, HardDrive, RefreshCw } from 'lucide-react';

export default function AdminSystemHealth() {
  return (
    <div className="animation-fade-in" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>System Health & Compiler Status</h2>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={16} /> Refresh Status
        </button>
      </div>

      {/* Server Vitals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>CPU USAGE</span>
            <Cpu size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>24%</div>
          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
            <div style={{ width: '24%', height: '100%', background: 'var(--color-primary)', borderRadius: '2px' }}></div>
          </div>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>MEMORY USAGE</span>
            <HardDrive size={18} color="var(--color-warning)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>4.2 GB</div>
          <div style={{ height: '4px', background: 'var(--bg-tertiary)', borderRadius: '2px' }}>
            <div style={{ width: '65%', height: '100%', background: 'var(--color-warning)', borderRadius: '2px' }}></div>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', display: 'block' }}>65% of 8.0 GB Total</span>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>COMPILER QUEUE</span>
            <Server size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>0</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 500 }}>System is optimal</span>
        </div>

        <div className="card glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>DATABASE LATENCY</span>
            <Database size={18} color="var(--color-info)" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>12ms</div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 500 }}>Healthy connection</span>
        </div>
      </div>

      {/* Compiler Configurations / Installed Languages */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Active Language Environments</h3>
      <div className="card" style={{ marginBottom: '2.5rem', overflow: 'hidden', padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--border-color)' }}>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Language</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Compiler / Engine</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Status</th>
              <th style={{ padding: '1rem', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {[
              { lang: 'Python 3', engine: 'python3', status: 'Online' },
              { lang: 'Node.js', engine: 'node v18.x', status: 'Online' },
              { lang: 'Java', engine: 'javac 17', status: 'Online' },
              { lang: 'C++', engine: 'g++ (GCC)', status: 'Online' },
              { lang: 'Go', engine: 'go version 1.20', status: 'Online' },
              { lang: 'Rust', engine: 'rustc 1.70', status: 'Online' }
            ].map((env, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                <td style={{ padding: '1rem', fontWeight: 600 }}>{env.lang}</td>
                <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{env.engine}</td>
                <td style={{ padding: '1rem' }}>
                  <span style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>{env.status}</span>
                </td>
                <td style={{ padding: '1rem' }}>
                  <button className="btn-icon" title="Test Engine"><Activity size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Live Execution Logs */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '1rem' }}>Execution Logs</h3>
      <div className="card terminal-style" style={{ height: '300px', overflowY: 'auto', background: '#0d1117' }}>
        <div style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }}>[SYSTEM] Log stream connected. Tail: /var/log/compiler.log</div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>[INFO] 13:56:02 - Executing Python script (RunID: py_92kx1)</div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>[INFO] 13:56:02 - Execution completed. Time: 45ms, Memory: 12MB. Status: 0</div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>[INFO] 13:56:45 - Executing Java compilation (RunID: jv_88z2)</div>
        <div style={{ color: 'var(--color-danger)', marginBottom: '0.2rem' }}>[WARN] 13:56:47 - Java compilation failed: Syntax error on line 4.</div>
        <div style={{ color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>[INFO] 13:57:12 - Executing Node.js script (RunID: js_11p0)</div>
      </div>
    </div>
  );
}
