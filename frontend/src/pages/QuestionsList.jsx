import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

export default function QuestionsList() {
  const { conceptId, difficulty } = useParams();
  const navigate = useNavigate();
  const { API_BASE, token } = useContext(AppContext);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get(`${API_BASE}/coding/questions?concept_id=${conceptId}&difficulty=${difficulty}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (Array.isArray(res.data)) {
          setQuestions(res.data);
        } else {
          console.error('Expected array, received:', res.data);
          setQuestions([]);
        }
      } catch (e) {
        console.error('Failed to load questions:', e);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [API_BASE, token, conceptId, difficulty]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Questions...</div>;

  const getDifficultyColor = (diff) => {
    switch(diff) {
      case 'Easy': return 'var(--color-success)';
      case 'Medium': return 'var(--color-warning)';
      case 'Hard': return 'var(--color-danger)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease' }}>
      <button onClick={() => navigate(`/coding/concept/${conceptId}`)} className="btn btn-secondary" style={{ marginBottom: '1.5rem', padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
        &larr; Back to Difficulty Selection
      </button>

      <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
        {difficulty} Problems
      </h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Select a problem to enter the coding workspace.</p>

      {questions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          No Questions Uploaded Yet
        </div>
      ) : (
        <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255, 255, 255, 0.05)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>STATUS</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>PROBLEM TITLE</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACCEPTANCE</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>DIFFICULTY</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>SOLVED USERS</th>
                <th style={{ padding: '1rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((q, idx) => (
                <tr key={q.id} style={{ borderBottom: idx !== questions.length - 1 ? '1px solid var(--border-color)' : 'none', transition: 'var(--transition-fast)' }} className="table-row-hover">
                  <td style={{ padding: '1rem' }}>
                    {q.is_solved ? (
                      <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                        <span style={{ background: 'rgba(34, 197, 94, 0.2)', padding: '2px', borderRadius: '4px' }}>✅</span> Solved
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ background: 'rgba(255, 255, 255, 0.1)', width: '20px', height: '20px', borderRadius: '4px', display: 'inline-block' }}></span> Unsolved
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{q.title}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{q.acceptance_rate}%</td>
                  <td style={{ padding: '1rem', fontWeight: 600, color: getDifficultyColor(q.difficulty) }}>
                    <span style={{ background: `rgba(255,255,255,0.05)`, padding: '0.3rem 0.6rem', borderRadius: '4px' }}>{q.difficulty}</span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{q.solved_users} Users</td>
                  <td style={{ padding: '1rem' }}>
                    <button onClick={() => navigate(`/coding/problem/${q.id}`)} className="btn btn-secondary" style={{ padding: '0.4rem 1rem' }}>
                      Solve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
