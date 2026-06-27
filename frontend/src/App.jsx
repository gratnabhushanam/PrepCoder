import React, { useContext, useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, NavLink, Link } from 'react-router-dom';
import { AppContext } from './context/AppContext';
import { User, Settings, Layers, LogOut, ChevronDown, Award, Bookmark, Menu, X, Monitor, Bell } from 'lucide-react';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ConceptsDashboard from './pages/ConceptsDashboard';
import CodingWorkspace from './pages/CodingWorkspace';
import OnlineCompiler from './pages/OnlineCompiler';
import Contests from './pages/Contests';
import Profile from './pages/Profile';
import AdminPanel from './pages/AdminPanel';
import Leaderboard from './pages/Leaderboard';
import SettingsPage from './pages/Settings';
import Submissions from './pages/Submissions';
import Achievements from './pages/Achievements';
import Bookmarks from './pages/Bookmarks';
import MCQPlatform from './pages/MCQPlatform';
import DifficultySelection from './pages/DifficultySelection';
import QuestionsList from './pages/QuestionsList';

export default function App() {
  const { token, user, theme, toggleTheme, logout } = useContext(AppContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [window.location.pathname]);

  return (
    <Router>
      <div className="app-container">
        
        {/* Navigation Bar */}
        <nav className="navbar no-print">
          <div className="navbar-inner">
            
            {/* Left: Logo & Mobile Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button 
                className="mobile-menu-toggle" 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', display: 'none' }}
              >
                {mobileMenuOpen ? <X size={24}/> : <Menu size={24}/>}
              </button>
              
              <Link to="/" className="nav-logo">
                <div style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', borderRadius: '8px', padding: '0.4rem', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Monitor size={18} />
                </div>
                CodeDebut
              </Link>
            </div>

            {/* Center: Links (Desktop) */}
            <div className={`nav-links ${mobileMenuOpen ? 'mobile-open' : ''}`}>
              {!token ? (
                <>
                  <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Home</NavLink>
                  <a href="#features" className="nav-item">Features</a>
                  <a href="#testimonials" className="nav-item">Testimonials</a>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
                  <NavLink to="/coding" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Coding Challenges</NavLink>
                  <NavLink to="/mcq" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>MCQ Tests</NavLink>
                  <NavLink to="/compiler" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Online Compiler</NavLink>
                  <NavLink to="/contests" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Contests</NavLink>
                  <NavLink to="/leaderboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Leaderboard</NavLink>
                  {user?.role === 'admin' && (
                    <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>Admin</NavLink>
                  )}
                </>
              )}
            </div>

            {/* Right: Theme Toggle & Avatar/Auth */}
            <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              
              {token ? (
                <>
                  <button className="btn-icon no-print desktop-only" style={{ background: 'rgba(128,128,128,0.1)' }} title="Notifications">
                    <Bell size={18} />
                  </button>
                  <button onClick={toggleTheme} className="btn-icon" style={{ background: 'rgba(128,128,128,0.1)' }} title="Toggle Theme">
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                  <div className="avatar-dropdown-container" ref={dropdownRef}>
                    <button className="avatar-btn" onClick={() => setDropdownOpen(!dropdownOpen)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer' }}>
                      <div className="avatar-circle" style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }} className="no-print desktop-only">
                        {user?.name?.split(' ')[0] || 'User'}
                      </span>
                      <ChevronDown size={14} color="var(--text-secondary)" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} className="desktop-only" />
                    </button>

                    {dropdownOpen && (
                      <div className="avatar-dropdown-menu">
                        <Link to="/profile" className="avatar-dropdown-header" onClick={() => setDropdownOpen(false)} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
                          <div className="avatar-circle" style={{ width: '40px', height: '40px', fontSize: '1rem', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="header-info">
                            <span className="header-name">{user?.name || 'User'}</span>
                            <span className="header-email">{user?.email || 'user@example.com'}</span>
                          </div>
                        </Link>
                        
                        <div className="avatar-dropdown-divider"></div>

                        <Link to="/profile" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <User size={16} /> My Profile
                        </Link>
                        <Link to="/dashboard" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <Monitor size={16} /> Dashboard
                        </Link>
                        <Link to="/submissions" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <Layers size={16} /> My Submissions
                        </Link>
                        <Link to="/achievements" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <Award size={16} /> Achievements
                        </Link>
                        <Link to="/bookmarks" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <Bookmark size={16} /> Bookmarks
                        </Link>
                        
                        <div className="avatar-dropdown-divider"></div>
                        
                        <Link to="/settings" className="avatar-dropdown-item" onClick={() => setDropdownOpen(false)}>
                          <Settings size={16} /> Settings
                        </Link>
                        <button onClick={toggleTheme} className="avatar-dropdown-item" style={{ width: '100%' }}>
                          {theme === 'dark' ? <><span style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>☀️ Light Theme</span></> : <><span style={{display:'flex', gap:'0.75rem', alignItems:'center'}}>🌙 Dark Theme</span></>}
                        </button>

                        <div className="avatar-dropdown-divider"></div>

                        <button onClick={() => { logout(); setDropdownOpen(false); }} className="avatar-dropdown-item danger">
                          <LogOut size={16} /> Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <button onClick={toggleTheme} className="btn-icon" style={{ background: 'rgba(128,128,128,0.1)' }} title="Toggle Theme">
                    {theme === 'dark' ? '☀️' : '🌙'}
                  </button>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <Link to="/login" className="btn btn-outline" style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-xl)', fontSize: '0.9rem' }}>Login</Link>
                    <Link to="/register" className="btn btn-primary desktop-only" style={{ padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-xl)', fontSize: '0.9rem' }}>Sign Up</Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          <Routes>
            <Route path="/" element={token ? <Navigate to="/dashboard" /> : <Home />} />
            <Route path="/login" element={!token ? <Login /> : <Navigate to="/dashboard" />} />
            <Route path="/register" element={!token ? <Register /> : <Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={token ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/coding" element={token ? <ConceptsDashboard /> : <Navigate to="/login" />} />
            <Route path="/coding/concept/:conceptId" element={token ? <DifficultySelection /> : <Navigate to="/login" />} />
            <Route path="/coding/concept/:conceptId/difficulty/:difficulty" element={token ? <QuestionsList /> : <Navigate to="/login" />} />
            <Route path="/coding/problem/:id" element={token ? <CodingWorkspace /> : <Navigate to="/login" />} />
            <Route path="/mcq" element={token ? <MCQPlatform /> : <Navigate to="/login" />} />
            <Route path="/mcq/:topic" element={token ? <MCQPlatform /> : <Navigate to="/login" />} />
            <Route path="/compiler" element={token ? <OnlineCompiler /> : <Navigate to="/login" />} />
            <Route path="/contests" element={token ? <Contests /> : <Navigate to="/login" />} />
            <Route path="/leaderboard" element={token ? <Leaderboard /> : <Navigate to="/login" />} />
            <Route path="/profile" element={token ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/settings" element={token ? <SettingsPage /> : <Navigate to="/login" />} />
            <Route path="/submissions" element={token ? <Submissions /> : <Navigate to="/login" />} />
            <Route path="/achievements" element={token ? <Achievements /> : <Navigate to="/login" />} />
            <Route path="/bookmarks" element={token ? <Bookmarks /> : <Navigate to="/login" />} />
            <Route path="/admin" element={token && user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/" />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>

        <footer className="footer no-print">
          <p>© {new Date().getFullYear()} CodeDebut Coding Platform. All rights reserved.</p>
        </footer>
      </div>
      
      {/* Mobile Styles injected here for simplicity in this artifact */}
      <style>{`
        @media (max-width: 900px) {
          .desktop-only { display: none !important; }
          .mobile-menu-toggle { display: block !important; }
          .nav-links {
            position: absolute;
            top: 72px;
            left: 0;
            right: 0;
            background: var(--bg-secondary);
            flex-direction: column;
            align-items: flex-start;
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            gap: 1rem;
            display: none;
            box-shadow: var(--glass-shadow);
          }
          .nav-links.mobile-open {
            display: flex;
            animation: slideUp 0.2s ease-out;
          }
          .nav-item {
            width: 100%;
          }
          .nav-item.active::after {
            bottom: -5px;
          }
        }
      `}</style>
    </Router>
  );
}
