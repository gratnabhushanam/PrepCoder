import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

export default function ATSChecker() {
  const { API_BASE, user, setUser } = useContext(AppContext);

  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [report, setReport] = useState(user?.resumeData || null);
  const [error, setError] = useState('');

  const loadingSteps = [
    "Reading uploaded PDF binary nodes...",
    "Extracting plain-text paragraph layouts...",
    "Scanning developer terminology database...",
    "Measuring keyword proximity indicators...",
    "Generating ATS suggestion reports..."
  ];

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      if (selected.type !== 'application/pdf') {
        setError('Only PDF resumes are supported.');
        setFile(null);
        return;
      }
      setError('');
      setFile(selected);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setStepIndex(0);
    setError('');

    // Rotate loading text for visual polish
    const stepInterval = setInterval(() => {
      setStepIndex(prev => {
        if (prev < loadingSteps.length - 1) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 900);

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await axios.post(`${API_BASE}/ai/resume-check`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      clearInterval(stepInterval);
      setReport(res.data.analysis);
      
      // Update global context user details
      if (user) {
        setUser(prev => ({
          ...prev,
          resumeData: res.data.analysis,
          readinessScore: res.data.readinessScore
        }));
      }
    } catch (err) {
      clearInterval(stepInterval);
      setError(err.response?.data?.message || 'Error occurred during PDF parsing. Ensure it is a valid searchable PDF.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      
      {/* Printable Area Wrapper */}
      <div className="print-content">
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>ATS Resume Analyzer</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
          Evaluate your resume format and skill keywords against standard recruiter Applicant Tracking Systems.
        </p>

        {/* Upload Zone (Hidden during printing) */}
        {!loading && !report && (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📁</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem' }}>Upload Searchable PDF Resume</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Only PDF format, maximum size: 5MB.</p>
            
            <form onSubmit={handleUpload}>
              <div style={{
                border: '2px dashed var(--border-color)',
                padding: '2rem',
                borderRadius: 'var(--radius-md)',
                background: 'var(--bg-secondary)',
                marginBottom: '1.5rem',
                cursor: 'pointer',
                position: 'relative'
              }}>
                <input
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                  {file ? `Selected file: ${file.name}` : "Click or Drag PDF file here to upload"}
                </span>
              </div>

              {error && <div style={{ color: 'var(--color-danger)', marginBottom: '1rem', fontSize: '0.9rem' }}>⚠️ {error}</div>}

              <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }} disabled={!file}>
                Analyze Resume
              </button>
            </form>
          </div>
        )}

        {/* Loading Visual Step States */}
        {loading && (
          <div className="card" style={{ padding: '4rem', textAlign: 'center' }}>
            <div className="wave-container" style={{ marginBottom: '2rem' }}>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
              <div className="wave-bar"></div>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>Analyzing Resume Profile</h3>
            <p style={{ color: 'var(--color-accent)', fontWeight: 600, fontSize: '0.95rem' }}>
              {loadingSteps[stepIndex]}
            </p>
          </div>
        )}

        {/* ATS Detailed Report Dashboard */}
        {!loading && report && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Summary Score Card */}
            <div className="card" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '2rem', alignItems: 'center' }}>
              {/* Score Gauge */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, var(--bg-tertiary) 40%, transparent 42%), conic-gradient(var(--color-accent) 0%, var(--color-accent) ' + report.atsScore + '%, var(--border-color) ' + report.atsScore + '%, var(--border-color) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: 'var(--glow-shadow)'
                }}>
                  <span style={{ fontSize: '2rem', fontWeight: 800 }}>{report.atsScore}%</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginTop: '0.5rem' }}>ATS Match</div>
              </div>

              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>Resume Profile Assessment</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {report.atsScore >= 75 
                    ? 'Excellent keywords matching! Your resume format is highly search-optimized and ready for campus placement uploads.' 
                    : 'Your match rate is moderate. Add missing tech keywords and expand project achievements to pass automated corporate scanners.'}
                </p>
                <div className="no-print" style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                  <button onClick={() => setReport(null)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    Upload Different Resume
                  </button>
                  <button onClick={handlePrint} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
                    Print Report Page
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Skills Analysis Lists */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
              
              {/* Extracted Skills */}
              <div className="card">
                <h3 className="card-title">Extracted Skills</h3>
                <p className="card-desc">Keywords successfully recognized from your PDF.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {report.skills?.map((sk, idx) => (
                    <span key={idx} className="badge badge-easy" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Missing Keywords */}
              <div className="card">
                <h3 className="card-title">Missing Target Keywords</h3>
                <p className="card-desc">Crucial keywords missing for developer roles.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {report.missingKeywords?.map((kw, idx) => (
                    <span key={idx} className="badge badge-hard" style={{ fontSize: '0.8rem', padding: '0.3rem 0.6rem' }}>
                      ✗ {kw}
                    </span>
                  ))}
                </div>
              </div>

            </div>

            {/* Bullet Point Improvement Suggestions */}
            <div className="card">
              <h3 className="card-title">ATS Layout & Formatting Suggestions</h3>
              <p className="card-desc">Apply these structural changes to enhance scanning readability.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {report.suggestions?.map((s, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>💡</span>
                    <span>{s}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
