import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Code, Terminal, Trophy, Users, Zap, Layout, MonitorPlay, CheckCircle } from 'lucide-react';
import './Home.css';

export default function Home() {
  const [trendingProblems, setTrendingProblems] = useState([]);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const res = await axios.get(`${API_BASE}/coding/public/trending`);
        if (Array.isArray(res.data)) {
          setTrendingProblems(res.data);
        } else {
          console.error('Invalid response format', res.data);
        }
      } catch (err) {
        console.error('Failed to fetch trending problems', err);
      }
    };
    fetchTrending();
  }, []);

  // Fallback data if backend is empty or errors
  const displayProblems = trendingProblems.length > 0 ? trendingProblems : [
    { title: '1. Two Sum', acc: '49.8%', diff: 'Easy' },
    { title: '2. Add Two Numbers', acc: '40.2%', diff: 'Medium' },
    { title: '3. Longest Substring Without Repeating Characters', acc: '33.8%', diff: 'Medium' },
    { title: '4. Median of Two Sorted Arrays', acc: '36.5%', diff: 'Hard' },
    { title: '5. Longest Palindromic Substring', acc: '32.6%', diff: 'Medium' }
  ];

  return (
    <div className="home-container animation-fade-in">
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">✨ CodeDebut v2.0 is now live</div>
          <h1 className="hero-title">
            The Ultimate <span className="text-gradient">AI-Powered</span> <br /> Coding Platform
          </h1>
          <p className="hero-subtitle">
            Master Data Structures, Algorithms, and System Design with an intelligent development environment. Write, compile, and execute code in seconds.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Start Coding for Free</Link>
            <Link to="/coding" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Explore Problems</Link>
          </div>
          
          {/* Mock IDE Window */}
          <div className="hero-ide-mock">
            <div className="ide-header">
              <div className="ide-dots"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
              <div className="ide-title">main.cpp</div>
            </div>
            <pre className="ide-code">
              <code>{`#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, CodeDebut!" << endl;\n    // Start your coding journey here\n    return 0;\n}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="features-section">
        <h2 className="section-title">Everything you need to land your dream job</h2>
        <div className="features-grid">
          <div className="feature-card card">
            <div className="feature-icon primary"><Terminal size={24}/></div>
            <h3>Online Compiler</h3>
            <p>Execute code in 15+ languages instantly. No setup required, just pure coding directly in your browser.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon accent"><Code size={24}/></div>
            <h3>Curated Challenges</h3>
            <p>From easy arrays to complex dynamic programming, solve the exact problems asked by FAANG companies.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon success"><Trophy size={24}/></div>
            <h3>Weekly Contests</h3>
            <p>Compete globally with thousands of developers. Boost your rating and earn exclusive badges.</p>
          </div>
          <div className="feature-card card">
            <div className="feature-icon warning"><Zap size={24}/></div>
            <h3>AI-Assisted Learning</h3>
            <p>Get instant hints, editorial solutions, and code reviews powered by intelligent AI models.</p>
          </div>
        </div>
      </section>

      {/* Trending Problems */}
      <section className="trending-section">
        <div className="trending-header">
          <h2 className="section-title">Trending Problems</h2>
          <Link to="/coding" className="btn btn-outline">View All</Link>
        </div>
        <div className="card trending-table-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="trending-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Title</th>
                <th>Acceptance</th>
                <th>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {displayProblems.map((prob, i) => (
                <tr key={i}>
                  <td><CheckCircle size={18} color="var(--text-muted)" /></td>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Link to={prob._id ? `/coding/problem/${prob._id}` : "/coding"}>{prob.title}</Link>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>{prob.acc}</td>
                  <td><span className={`diff-badge diff-${prob.diff.toLowerCase()}`}>{prob.diff}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section" style={{ padding: '4rem 0' }}>
        <h2 className="section-title">What Our Users Say</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', padding: '0 2rem' }}>
          {[
            { name: 'Sarah J.', role: 'Software Engineer @ Google', text: 'CodeDebut was instrumental in my interview preparation. The curated problem lists and instant AI feedback are unmatched.', avatar: 'S' },
            { name: 'David M.', role: 'Computer Science Student', text: 'The online compiler is lightning fast, and I love the weekly contests. It keeps me motivated to practice every single day.', avatar: 'D' },
            { name: 'Priya K.', role: 'Frontend Developer', text: 'I transitioned from frontend to full-stack using their data structures tracks. The explanations are crystal clear.', avatar: 'P' }
          ].map((testimony, idx) => (
            <div key={idx} className="card glass" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: `4px solid var(--color-${idx===0 ? 'primary' : idx===1 ? 'accent' : 'success'})` }}>
              <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>"{testimony.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'auto', paddingTop: '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {testimony.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{testimony.name}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{testimony.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
}
