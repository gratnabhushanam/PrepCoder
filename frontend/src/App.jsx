import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Link } from 'react-router-dom';
import { AppContext } from './context/AppContext';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import MCQPlatform from './pages/MCQPlatform';
import ConceptsDashboard from './pages/ConceptsDashboard';
import DifficultySelection from './pages/DifficultySelection';
import QuestionsList from './pages/QuestionsList';
import CodingWorkspace from './pages/CodingWorkspace';
import ATSChecker from './pages/ATSChecker';
import AIMockInterview from './pages/AIMockInterview';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }) => {
  const { token, loading } = useContext(AppContext);
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading session...</div>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Wrapper Component
const AdminRoute = ({ children }) => {
  const { token, user, loading } = useContext(AppContext);
  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading session...</div>;
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin') {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <h1 style={{ color: 'var(--color-danger)', fontSize: '3rem', marginBottom: '1rem' }}>403 Access Denied</h1>
        <p style={{ color: 'var(--text-secondary)' }}>You do not have permission to access this page.</p>
        <Link to="/dashboard" className="btn btn-primary" style={{ marginTop: '2rem', display: 'inline-block' }}>Return to Dashboard</Link>
      </div>
    );
  }
  return children;
};

export default function App() {
  const { token, user, theme, toggleTheme, logout } = useContext(AppContext);

  return (
    <Router>
      <div className="app-container">
        
        {/* Navigation Header */}
        <nav className="navbar no-print">
          <div className="navbar-inner">
            <div className="nav-left">
              <Link to="/" className="nav-logo">
                <span>✨</span> PrepAI
              </Link>
            </div>
            
            <div className="nav-center">
              <div className="nav-links">
                <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Home</NavLink>
                
                {token && (
                  <>
                    <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                    <NavLink to="/mcq" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>MCQ Tests</NavLink>
                    <NavLink to="/coding" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Coding Editor</NavLink>
                    <NavLink to="/ats-checker" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>ATS Scan</NavLink>
                    <NavLink to="/ai-interview" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Mock Chat</NavLink>
                  </>
                )}
              </div>
            </div>

            <div className="nav-right">
              {/* Theme Toggle Button */}
              <button onClick={toggleTheme} className="btn-theme-toggle" title="Toggle Light/Dark Theme">
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {token ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      color: 'white',
                      fontSize: '0.85rem'
                    }}>
                      {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }} className="no-print">
                      Profile
                    </span>
                  </Link>
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>Admin</Link>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <Link to="/login" className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Login</Link>
                  <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>Register</Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Core Layout Content */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/mcq" element={<ProtectedRoute><MCQPlatform /></ProtectedRoute>} />
            <Route path="/mcq/:topic" element={<ProtectedRoute><MCQPlatform /></ProtectedRoute>} />
            <Route path="/coding" element={<ProtectedRoute><ConceptsDashboard /></ProtectedRoute>} />
            <Route path="/coding/concept/:conceptId" element={<ProtectedRoute><DifficultySelection /></ProtectedRoute>} />
            <Route path="/coding/concept/:conceptId/difficulty/:difficulty" element={<ProtectedRoute><QuestionsList /></ProtectedRoute>} />
            <Route path="/coding/problem/:id" element={<ProtectedRoute><CodingWorkspace /></ProtectedRoute>} />
            <Route path="/ats-checker" element={<ProtectedRoute><ATSChecker /></ProtectedRoute>} />
            <Route path="/ai-interview" element={<ProtectedRoute><AIMockInterview /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />

            {/* Fallback routing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="footer no-print">
          &copy; 2026 PrepAI. All Rights Reserved.
        </footer>

      </div>
    </Router>
  );
}
