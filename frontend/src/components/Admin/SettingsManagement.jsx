import React, { useState, useEffect } from 'react';
import { Save, Server, Shield, Bell } from 'lucide-react';

export default function SettingsManagement() {
  const [settings, setSettings] = useState({
    platformName: 'PrepAI',
    maintenanceMode: false,
    allowSignups: true,
    defaultTheme: 'dark',
    emailNotifications: true,
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Load from local storage for now since there's no backend settings model
  useEffect(() => {
    const saved = localStorage.getItem('adminSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('adminSettings', JSON.stringify(settings));
      setSaving(false);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    }, 800);
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Platform Settings</h2>

      {message && (
        <div style={{ padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        
        {/* General Settings */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-primary)' }}>
            <Server size={20} /> General
          </h3>
          
          <div className="form-group">
            <label className="form-label">Platform Name</label>
            <input 
              type="text" 
              className="form-control" 
              value={settings.platformName} 
              onChange={e => setSettings({...settings, platformName: e.target.value})} 
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
            <div>
              <label className="form-label" style={{ marginBottom: 0 }}>Maintenance Mode</label>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Disable access for non-admins</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.maintenanceMode}
                onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: settings.maintenanceMode ? 'var(--color-primary)' : 'var(--border-color)',
                transition: '.4s', borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: settings.maintenanceMode ? 'translateX(26px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>
        </div>

        {/* Security & Access */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: 'var(--color-warning)' }}>
            <Shield size={20} /> Security & Access
          </h3>
          
          <div className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <label className="form-label" style={{ marginBottom: 0 }}>Allow New Signups</label>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Let new users register</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '50px', height: '24px' }}>
              <input 
                type="checkbox" 
                checked={settings.allowSignups}
                onChange={e => setSettings({...settings, allowSignups: e.target.checked})}
                style={{ opacity: 0, width: 0, height: 0 }} 
              />
              <span style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: settings.allowSignups ? 'var(--color-primary)' : 'var(--border-color)',
                transition: '.4s', borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute', content: '""', height: '16px', width: '16px', left: '4px', bottom: '4px',
                  backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                  transform: settings.allowSignups ? 'translateX(26px)' : 'translateX(0)'
                }}></span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
        <button 
          onClick={handleSave} 
          disabled={saving}
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 2rem' }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
