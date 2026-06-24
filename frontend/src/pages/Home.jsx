import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function Home() {
  const { token, user } = useContext(AppContext);

  return (
    <div className="home-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      {/* Hero Section */}
      <section style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem 1rem',
        background: 'transparent',
        borderRadius: 'var(--radius-xl)',
        marginBottom: '4rem',
        minHeight: '75vh',
        maxWidth: '1200px',
        margin: '0 auto 4rem auto',
        width: '100%'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(168, 85, 247, 0.1)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          color: 'var(--color-accent)',
          padding: '0.5rem 1.2rem',
          borderRadius: 'var(--radius-xl)',
          fontSize: '0.85rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '2rem',
          animation: 'float 3s ease-in-out infinite',
          boxShadow: '0 4px 15px rgba(168, 85, 247, 0.15)'
        }}>
          🚀 Next-Gen Placement Preparation
        </div>

        <h1 className="hero-title" style={{
          fontWeight: 900,
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, var(--text-primary) 30%, var(--text-secondary) 70%, var(--color-accent) 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maxWidth: '850px',
        }}>
          Master Your Placement Prep with <br />
          <span style={{
            background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>AI-Driven Mentorship</span>
        </h1>

        <p className="hero-subtitle" style={{
          color: 'var(--text-secondary)',
          maxWidth: '700px',
          margin: '0 auto 2.5rem auto',
        }}>
          Compile code on-the-fly, scan resumes with ATS metrics, and practice voice/text mock interviews with real-time AI analytics.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {token ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
              Go to Dashboard
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Get Started Free
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>
                Candidate Login
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Feature Matrix Grid */}
      <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '2.5rem' }}>
        What PrepAI Offers
      </h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem', marginBottom: '5rem' }}>

        <div className="card" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
          </div>
          <h3 className="card-title">Compiler coding workspace</h3>
          <p className="card-desc">
            Develop program algorithms in JavaScript, Python, or Java with real child-process execution and test case validations.
          </p>
          <Link to={token ? "/coding" : "/login"} style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Solve Problems →
          </Link>
        </div>

        <div className="card" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
          </div>
          <h3 className="card-title">ATS Resume Checker</h3>
          <p className="card-desc">
            Upload your resume PDF and analyze keyword match rates, extracting skills and generating PDF score cards instantly.
          </p>
          <Link to={token ? "/ats-checker" : "/login"} style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Check ATS Score →
          </Link>
        </div>

        <div className="card" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h3 className="card-title">AI Voice Mock Interview</h3>
          <p className="card-desc">
            Experience real-time interactive HR and technical interview drills with voice options and multidimensional scoring.
          </p>
          <Link to={token ? "/ai-interview" : "/login"} style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Start Interview →
          </Link>
        </div>

        <div className="card" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          </div>
          <h3 className="card-title">MCQ Quiz Platform</h3>
          <p className="card-desc">
            Practice conceptual questions on Java, OOPs, DBMS, SQL, AWS, and Operating Systems with active countdown timers.
          </p>
          <Link to={token ? "/mcq" : "/login"} style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            Practice MCQs →
          </Link>
        </div>

        <div className="card" style={{ flex: '1 1 280px', maxWidth: '400px' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '1rem' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          </div>
          <h3 className="card-title">Personalized AI Mentor</h3>
          <p className="card-desc">
            Track daily placement readiness, identify weak conceptual areas, and build step-by-step career path guides.
          </p>
          <Link to={token ? "/dashboard" : "/login"} style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            View AI Recommendation →
          </Link>
        </div>
      </div>


    </div>
  );
}
