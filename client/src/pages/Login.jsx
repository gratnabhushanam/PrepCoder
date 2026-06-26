import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Login() {
  const { loginUser, token } = useContext(AppContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (token) navigate('/dashboard');
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (forgotMode) {
      // Mock forgot-password API handler
      setTimeout(() => {
        setSuccessMsg('A password reset request has been processed. (Note: Simulated recovery completed successfully.)');
        setForgotMode(false);
        setLoading(false);
      }, 1000);
      return;
    }

    const res = await loginUser(email, password);
    setLoading(false);
    if (!res.success) {
      setError(res.message);
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div style={{
      maxWidth: '450px',
      margin: '4rem auto 0 auto',
      animation: 'slideIn 0.4s ease-out'
    }}>
      <div className="card" style={{ padding: '2.5rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>
          {forgotMode ? 'Reset Password' : 'Welcome Back'}
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
          {forgotMode ? 'Enter details to reset credentials' : 'Log in to continue your placement preparation'}
        </p>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            color: 'var(--color-danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}>
            ⚠️ {error}
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.25)',
            color: 'var(--color-success)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.9rem',
            marginBottom: '1.5rem'
          }}>
            ✅ {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="e.g., student@university.edu"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{forgotMode ? 'New Password' : 'Password'}</span>
              {!forgotMode && (
                <span 
                  onClick={() => setForgotMode(true)} 
                  style={{ color: 'var(--color-accent)', cursor: 'pointer', fontSize: '0.8rem', textTransform: 'none' }}
                >
                  Forgot Password?
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                className="form-control"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
              />
              <span 
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  opacity: 0.6,
                  userSelect: 'none'
                }}
              >
                {showPassword ? '👁️' : '🙈'}
              </span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Processing...' : forgotMode ? 'Update Password' : 'Log In'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {forgotMode ? (
            <span style={{ color: 'var(--color-accent)', cursor: 'pointer' }} onClick={() => setForgotMode(false)}>
              Back to Login
            </span>
          ) : (
            <>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 600 }}>
                Register Free
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
