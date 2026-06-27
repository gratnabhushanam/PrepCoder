import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { Settings as SettingsIcon, User, Lock, Mail, Shield, CheckCircle } from 'lucide-react';

export default function Settings() {
  const { API_BASE, token, user, updateUserProfile } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Profile Form State
  const [name, setName] = useState('');
  
  // Security Form State
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await updateUserProfile({ name });
      if (res.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update profile.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update profile.' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setLoading(true);
    try {
      const res = await updateUserProfile({ password });
      if (res.success) {
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: res.message || 'Failed to update password.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to update password.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Please log in to view settings.</div>;
  }

  return (
    <div className="animation-fade-in" style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SettingsIcon size={24} color="var(--color-primary)" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.8rem', color: 'var(--text-primary)', margin: 0 }}>Account Settings</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, marginTop: '0.25rem' }}>Manage your profile and security preferences.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
        
        {/* Settings Sidebar */}
        <div className="card" style={{ padding: '1rem', alignSelf: 'start' }}>
          <button 
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ width: '100%', marginBottom: '0.5rem', textAlign: 'left', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
            onClick={() => { setActiveTab('profile'); setMessage(null); }}
          >
            <User size={18} style={{ marginRight: '0.75rem' }} /> Personal Info
          </button>
          <button 
            className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`} 
            style={{ width: '100%', textAlign: 'left', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
            onClick={() => { setActiveTab('security'); setMessage(null); }}
          >
            <Shield size={18} style={{ marginRight: '0.75rem' }} /> Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="card" style={{ padding: '2rem' }}>
          
          {message && (
            <div style={{ 
              padding: '1rem', 
              marginBottom: '2rem', 
              borderRadius: '8px', 
              background: message.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: message.type === 'success' ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}>
              {message.type === 'success' ? <CheckCircle size={18} /> : <Lock size={18} />}
              {message.text}
            </div>
          )}

          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="animation-fade-in">
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Personal Information</h2>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    style={{ paddingLeft: '3rem' }} 
                    placeholder="Your Name" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Email Address (Read-only)</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="email" 
                    className="form-control" 
                    value={user.email} 
                    readOnly 
                    style={{ paddingLeft: '3rem', opacity: 0.7, cursor: 'not-allowed' }} 
                  />
                </div>
                <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>Email cannot be changed currently.</small>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 2rem' }}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={handleUpdatePassword} className="animation-fade-in">
              <h2 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>Security & Password</h2>
              
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" 
                    className="form-control" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    style={{ paddingLeft: '3rem' }} 
                    placeholder="Enter new password" 
                    required 
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="password" 
                    className="form-control" 
                    value={confirmPassword} 
                    onChange={e => setConfirmPassword(e.target.value)} 
                    style={{ paddingLeft: '3rem' }} 
                    placeholder="Confirm new password" 
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 2rem' }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
