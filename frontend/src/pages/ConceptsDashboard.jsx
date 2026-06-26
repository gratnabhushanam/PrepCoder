import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

export default function ConceptsDashboard() {
  const { API_BASE, token } = useContext(AppContext);
  const navigate = useNavigate();
  const [concepts, setConcepts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcepts = async () => {
      try {
        const res = await axios.get(`${API_BASE}/coding/concepts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) {
          setConcepts(res.data);
        } else {
          setConcepts([]);
          console.error('Expected array of concepts, received:', res.data);
        }
      } catch (e) {
        console.error('Failed to load concepts:', e);
        setConcepts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchConcepts();
  }, [API_BASE, token]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Practice Platform...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Coding Practice</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Master data structures and algorithms, track your progress, and prepare for interviews.</p>

      {concepts.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '4rem' }}>
          No Concepts Uploaded Yet.
        </div>
      ) : (
        <div className="grid-3">
          {concepts.map(concept => (
            <div key={concept.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '2rem' }}>{concept.icon || '💡'}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{concept.name}</h3>
              </div>

              {concept.description && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{concept.description}</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Total: {concept.totalCount}</span>
                <span>Easy: <span style={{ color: 'var(--color-success)' }}>{concept.easyCount}</span></span>
                <span>Med: <span style={{ color: 'var(--color-warning)' }}>{concept.mediumCount}</span></span>
                <span>Hard: <span style={{ color: 'var(--color-danger)' }}>{concept.hardCount}</span></span>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span>Progress</span>
                  <span>{concept.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${concept.progress}%`, height: '100%', background: 'linear-gradient(90deg, var(--color-primary), var(--color-accent))', borderRadius: '3px' }}></div>
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ marginTop: 'auto' }}
                onClick={() => navigate(`/coding/concept/${concept.id}`)}
              >
                Start Practice
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
