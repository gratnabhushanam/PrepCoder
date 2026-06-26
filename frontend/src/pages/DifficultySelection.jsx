import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

export default function DifficultySelection() {
  const { conceptId } = useParams();
  const navigate = useNavigate();
  const { API_BASE, token } = useContext(AppContext);
  const [concept, setConcept] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConcept = async () => {
      try {
        const res = await axios.get(`${API_BASE}/coding/concepts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) {
          const found = res.data.find(c => c.id.toString() === conceptId);
          setConcept(found);
        } else {
          console.error('Expected array, received:', res.data);
          setConcept(null);
        }
      } catch (e) {
        console.error('Failed to load concept:', e);
        setConcept(null);
      } finally {
        setLoading(false);
      }
    };
    fetchConcept();
  }, [API_BASE, token, conceptId]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Concept...</div>;
  if (!concept) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Concept not found.</div>;

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <button onClick={() => navigate('/coding')} className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
        &larr; Back to Concepts
      </button>

      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {concept.icon} {concept.name} Problems
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select a difficulty level to begin practicing.</p>

      <div className="grid-3">
        {/* Easy Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--color-success)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-success)' }}>Easy</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Total Questions: {concept.easyCount}</span>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: 'auto', border: '1px solid var(--color-success)', color: 'var(--color-success)' }}
            onClick={() => navigate(`/coding/concept/${conceptId}/difficulty/Easy`)}
            disabled={concept.easyCount === 0}
          >
            Start Easy
          </button>
        </div>

        {/* Medium Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--color-warning)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-warning)' }}>Medium</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Total Questions: {concept.mediumCount}</span>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: 'auto', border: '1px solid var(--color-warning)', color: 'var(--color-warning)' }}
            onClick={() => navigate(`/coding/concept/${conceptId}/difficulty/Medium`)}
            disabled={concept.mediumCount === 0}
          >
            Start Medium
          </button>
        </div>

        {/* Hard Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid var(--color-danger)' }}>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-danger)' }}>Hard</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span>Total Questions: {concept.hardCount}</span>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ marginTop: 'auto', border: '1px solid var(--color-danger)', color: 'var(--color-danger)' }}
            onClick={() => navigate(`/coding/concept/${conceptId}/difficulty/Hard`)}
            disabled={concept.hardCount === 0}
          >
            Start Hard
          </button>
        </div>
      </div>
    </div>
  );
}
