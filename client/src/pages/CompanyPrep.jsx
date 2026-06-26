import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

export default function CompanyPrep() {
  const { name } = useParams();
  const { API_BASE } = useContext(AppContext);
  
  const [companies, setCompanies] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pattern'); // pattern, prev_q, technical, hr, experiences
  
  // Toggle answer states mapping
  const [visibleAnswers, setVisibleAnswers] = useState({});

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await axios.get(`${API_BASE}/practice/companies`);
        setCompanies(res.data);
        if (!name) setLoading(false);
      } catch (err) {
        console.error('Error fetching companies list:', err);
      }
    };
    fetchCompanies();
  }, [API_BASE, name]);

  useEffect(() => {
    if (name) {
      setLoading(true);
      const fetchCompanyDetail = async () => {
        try {
          const res = await axios.get(`${API_BASE}/practice/companies/${name}`);
          setCompany(res.data);
        } catch (err) {
          console.error('Error fetching company details:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchCompanyDetail();
    }
  }, [name, API_BASE]);

  const toggleAnswer = (key) => {
    setVisibleAnswers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading prep details...</div>;

  // View 1: Companies List Portal
  if (!name) {
    return (
      <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Company Preparation Portal</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          Explore recruitment syllabus structures, previous questions, and interview advice for top placement companies.
        </p>

        <div className="grid-3">
          {companies.map(c => (
            <div key={c._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', minHeight: '220px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{c.name}</h3>
                  <span className={`badge ${c.difficulty === 'Hard' ? 'badge-hard' : 'badge-medium'}`}>
                    {c.difficulty}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  Includes exam pattern rounds, sample questions, and HR feedback structures.
                </p>
                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  <span>📋 {c.roundsCount} Rounds</span>
                  <span>❓ {c.questionsCount} Questions</span>
                </div>
              </div>
              <Link to={`/company/${c.name.toLowerCase()}`} className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }}>
                Prepare Now
              </Link>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // View 2: Detailed Company Prep Guide
  if (!company) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>Company Profile not found.</h2>
        <Link to="/companies" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to Companies</Link>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      
      {/* Header and Back navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/companies" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--color-accent)', fontWeight: 600, marginBottom: '1rem', fontSize: '0.9rem' }}>
          ← Back to Company Portal
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>{company.name} Preparation Guide</h1>
          <span className="badge badge-medium" style={{ padding: '0.4rem 0.8rem' }}>{company.examPattern?.difficulty} Difficulty</span>
        </div>
      </div>

      {/* Navigation tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '2rem',
        overflowX: 'auto',
        gap: '1rem'
      }}>
        {[
          { id: 'pattern', label: 'Exam Pattern' },
          { id: 'prev_q', label: 'Previous Questions' },
          { id: 'technical', label: 'Technical Prep' },
          { id: 'hr', label: 'HR Questions' },
          { id: 'experiences', label: 'Interview Experiences' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              padding: '0.75rem 1rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'var(--transition-fast)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="card" style={{ padding: '2rem' }}>
        
        {/* Exam Pattern & Syllabus Panel */}
        {activeTab === 'pattern' && (
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Recruitment Assessment Rounds</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
              {company.examPattern?.rounds?.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '150px 1fr', padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    {r.name}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '0.2rem' }}>⏱️ {r.duration} Mins</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{r.description}</div>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>Syllabus Breakdown</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {company.examPattern?.syllabus?.map((s, i) => (
                <span key={i} style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.9rem', fontWeight: 500 }}>
                  🔹 {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Previous Questions Panel */}
        {activeTab === 'prev_q' && (
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Past Recruitment Questions</h3>
            {company.previousQuestions?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No past questions loaded. Access MCQ practice sections or coding platform challenges!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {company.previousQuestions?.map((q, i) => {
                  const key = `prev_${i}`;
                  return (
                    <div key={i} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Question {i + 1}</span>
                        <span className="badge badge-easy">{q.year} Exam</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{q.question}</p>
                      
                      <button onClick={() => toggleAnswer(key)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                        {visibleAnswers[key] ? 'Hide Solution' : 'View Solution'}
                      </button>
                      
                      {visibleAnswers[key] && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderLeft: '3px solid var(--color-success)', marginTop: '1rem', borderRadius: '4px', fontSize: '0.95rem' }}>
                          <strong style={{ display: 'block', marginBottom: '0.25rem', color: 'var(--color-success)' }}>Explanation:</strong>
                          {q.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Technical Questions Panel */}
        {activeTab === 'technical' && (
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Technical Round (TR) Focus</h3>
            {company.technicalQuestions?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No specific TR questions loaded yet. Review OOPs, DBMS, SQL, and DSA categories.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {company.technicalQuestions?.map((t, i) => {
                  const key = `tech_${i}`;
                  return (
                    <div key={i} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700 }}>Topic: {t.topic}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{t.question}</p>
                      
                      <button onClick={() => toggleAnswer(key)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                        {visibleAnswers[key] ? 'Hide Answer' : 'Reveal Answer'}
                      </button>
                      
                      {visibleAnswers[key] && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderLeft: '3px solid var(--color-primary)', marginTop: '1rem', borderRadius: '4px', fontSize: '0.95rem' }}>
                          {t.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* HR Interview Questions Panel */}
        {activeTab === 'hr' && (
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>HR Round Preparation</h3>
            {company.hrQuestions?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>Try practicing live HR questions in the AI Mock Interview simulator!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {company.hrQuestions?.map((hr, i) => {
                  const key = `hr_${i}`;
                  return (
                    <div key={i} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                      <p style={{ fontWeight: 700, marginBottom: '1rem' }}>{hr.question}</p>
                      
                      <button onClick={() => toggleAnswer(key)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                        {visibleAnswers[key] ? 'Hide Sample Answer' : 'Reveal Sample Answer'}
                      </button>
                      
                      {visibleAnswers[key] && (
                        <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderLeft: '3px solid var(--color-accent)', marginTop: '1rem', borderRadius: '4px', fontSize: '0.95rem' }}>
                          <strong style={{ display: 'block', marginBottom: '0.25rem' }}>Recommended response:</strong>
                          {hr.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Interview Experiences Panel */}
        {activeTab === 'experiences' && (
          <div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Shared Student Experiences</h3>
            {company.interviewExperiences?.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No interviews recorded. Be the first to share your selection feedback!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {company.interviewExperiences?.map((exp, i) => (
                  <div key={i} style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <h4 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{exp.role}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>By {exp.author} • {exp.date}</span>
                      </div>
                      <span className={`badge ${exp.result === 'Selected' ? 'badge-easy' : 'badge-hard'}`}>
                        {exp.result}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{exp.experience}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
