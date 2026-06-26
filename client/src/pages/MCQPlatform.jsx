import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import useSWR from 'swr';
import { AppContext } from '../context/AppContext';

const fetcher = url => axios.get(url).then(res => res.data);

export default function MCQPlatform() {
  const { topic } = useParams();
  const navigate = useNavigate();
  const { API_BASE, user, setUser } = useContext(AppContext);

  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Real-time Leaderboard polling with SWR (updates every 5 seconds without page refresh)
  const { data: leaderboardData, error: leaderboardError } = useSWR(`${API_BASE}/leaderboard`, fetcher, { refreshInterval: 5000 });
  const leaderboard = leaderboardData || [];

  // Active quiz states
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds per question
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Fetch topics on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const topicsRes = await axios.get(`${API_BASE}/practice/topics`);
        setTopics(topicsRes.data);
      } catch (err) {
        console.error('Failed to load MCQs homepage:', err);
      } finally {
        setLoading(false);
      }
    };
    if (!topic) fetchData();
  }, [topic, API_BASE]);

  // Load questions for topic
  useEffect(() => {
    if (topic) {
      setLoading(true);
      const fetchQuestions = async () => {
        try {
          const res = await axios.get(`${API_BASE}/practice/mcqs/random?topic=${topic}&limit=10`);
          setQuestions(res.data);
          setCurrentIdx(0);
          setSelectedAnswers({});
          setTimeLeft(60);
          setQuizFinished(false);
        } catch (err) {
          console.error('Failed to fetch MCQ questions:', err);
        } finally {
          setLoading(false);
        }
      };
      fetchQuestions();
    }
  }, [topic, API_BASE]);

  const handleNextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
      setTimeLeft(60);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setQuizFinished(true);
    setSubmitting(true);

    // Calculate score
    let calculatedScore = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        calculatedScore++;
      }
    });
    setScore(calculatedScore);

    try {
      const res = await axios.post(`${API_BASE}/practice/mcqs/submit`, {
        score: calculatedScore,
        total: questions.length,
        topic: topic
      });
      
      // Update local context readiness score
      if (user) {
        setUser(prev => ({
          ...prev,
          readinessScore: res.data.readinessScore,
          mcqStats: res.data.mcqStats,
          dailyStreak: (prev.dailyStreak || 0) + 1
        }));
      }
    } catch (err) {
      console.error('Failed to record quiz results:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Question Timer Countdown
  useEffect(() => {
    if (topic && questions.length > 0 && !quizFinished && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !quizFinished) {
      handleNextQuestion();
    }
  }, [timeLeft, quizFinished, topic, questions]);

  const handleSelectOption = (optIdx) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIdx]: optIdx }));
  };

  // handleNextQuestion and finishQuiz moved up

  if (loading) return <div style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Practice tests...</div>;

  // View 1: Topics Dashboard & Leaderboard
  if (!topic) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem', animation: 'fadeIn 0.5s ease-out' }}>
        
        {/* Left Side: Topic Cards */}
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>MCQ Practice Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            Choose a subject to test your cognitive and engineering skills. Every correct test score boosts your Placement Readiness rating.
          </p>

          <div className="grid-3">
            {topics.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }}>📝</span>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No tests available</h3>
                <p style={{ color: 'var(--text-muted)' }}>No MCQ tests have been added yet.</p>
              </div>
            ) : topics.map((t, idx) => (
              <div key={idx} className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '190px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>📘</span> {t.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  {t.count} questions available covering core interview syllabus.
                </p>
                <Link to={`/mcq/${t.name}`} className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>
                  Start Practice Test
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Leaderboard Panel */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <span>🏆</span> Global Leaderboard
          </h3>
          <p className="card-desc" style={{ marginBottom: '1.5rem', fontSize: '0.85rem' }}>Top students based on Total Points & Readiness.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaderboardError ? (
               <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-danger)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>Failed to load leaderboard</div>
            ) : !leaderboardData ? (
               <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>Loading leaderboard...</div>
            ) : leaderboard.length === 0 ? (
               <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>No leaderboard data available yet</div>
            ) : leaderboard.map((item, idx) => {
              const isCurrentUser = user && user.id === item.userId;
              
              return (
                <div key={item.userId} style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  padding: '0.75rem', 
                  background: isCurrentUser ? 'rgba(56, 189, 248, 0.1)' : idx === 0 ? 'rgba(251, 191, 36, 0.08)' : 'var(--bg-secondary)', 
                  border: `1px solid ${isCurrentUser ? 'rgba(56, 189, 248, 0.4)' : idx === 0 ? 'rgba(251, 191, 36, 0.2)' : 'var(--border-color)'}`, 
                  borderRadius: 'var(--radius-md)',
                  boxShadow: isCurrentUser ? '0 0 10px rgba(56, 189, 248, 0.2)' : 'none',
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 800, color: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : 'var(--text-muted)', width: '24px' }}>#{item.rank}</span>
                      <img src={item.profileImage} alt={item.username} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-primary)' }} />
                      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: isCurrentUser ? 'var(--color-primary)' : 'var(--text-primary)' }}>{item.username}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: '3rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>⭐ Points: <strong style={{ color: 'var(--text-primary)' }}>{(item.totalPoints || 0).toLocaleString()}</strong></span>
                    <span>📈 Readiness: <strong style={{ color: 'var(--color-accent)' }}>{item.readinessScore || 0}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {leaderboard.length > 0 && (
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem', fontSize: '0.85rem' }}>
              View Full Leaderboard
            </button>
          )}
        </div>

      </div>
    );
  }

  // View 2: Timed Quiz Arena
  if (questions.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '4rem' }}>
        <h2>No questions available for topic: {topic}.</h2>
        <Link to="/mcq" className="btn btn-secondary" style={{ marginTop: '1rem' }}>Back to MCQ dashboard</Link>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div style={{ maxWidth: '750px', margin: '0 auto', animation: 'fadeIn 0.4s ease' }}>
      
      {/* Quiz Progress header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{topic} Practice Arena</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Question {currentIdx + 1} of {questions.length}</span>
        </div>
        {!quizFinished && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: timeLeft < 15 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-secondary)', border: `1px solid ${timeLeft < 15 ? 'var(--color-danger)' : 'var(--border-color)'}`, padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.85rem', color: timeLeft < 15 ? 'var(--color-danger)' : 'var(--text-secondary)' }}>Time Left:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: timeLeft < 15 ? 'var(--color-danger)' : 'var(--text-primary)' }}>
              0:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
            </span>
          </div>
        )}
      </div>

      {/* Quiz Core Layout */}
      {!quizFinished ? (
        <div className="card" style={{ padding: '2rem' }}>
          
          {/* Question Description */}
          <p style={{ fontSize: '1.15rem', fontWeight: 650, marginBottom: '2rem', lineHeight: 1.5 }}>
            {currentQuestion.question}
          </p>

          {/* Options Matrix */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
            {['A', 'B', 'C', 'D'].map((optKey) => {
              const optText = currentQuestion[`option${optKey}`];
              if (!optText) return null;
              const isSelected = selectedAnswers[currentIdx] === optKey;
              return (
                <div
                  key={optKey}
                  onClick={() => handleSelectOption(optKey)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1.25rem',
                    background: isSelected ? 'rgba(168, 85, 247, 0.05)' : 'var(--bg-secondary)',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <div style={{
                    width: '22px',
                    height: '22px',
                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--text-muted)'}`,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isSelected ? 'var(--color-primary)' : 'transparent'
                  }}>
                    {isSelected && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} />}
                  </div>
                  <span style={{ fontSize: '1rem', fontWeight: 550 }}>
                    <strong style={{ marginRight: '0.5rem', color: 'var(--text-muted)' }}>{optKey}.</strong> {optText}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleNextQuestion}
              className="btn btn-primary"
              disabled={selectedAnswers[currentIdx] === undefined}
            >
              {currentIdx === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

        </div>
      ) : (
        
        /* Quiz Summary Scorecard */
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🏆</div>
          <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Practice Set Completed</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Here is your scorecard breakdown for {topic}</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', maxWidth: '400px', margin: '0 auto 2.5rem auto' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-success)' }}>{score} / {questions.length}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Correct Answers</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>{Math.round((score / questions.length) * 100)}%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Percentage Score</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/mcq" className="btn btn-secondary">MCQ Dashboard</Link>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>

          {/* Explanation / Answers Review */}
          <div style={{ marginTop: '3.5rem', textAlign: 'left' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem' }}>Answers Review</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {questions.map((q, idx) => {
                const wasCorrect = selectedAnswers[idx] === q.correctAnswer;
                return (
                  <div key={idx} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700 }}>Q{idx + 1}. {q.question}</span>
                      <span className={`badge ${wasCorrect ? 'badge-easy' : 'badge-hard'}`}>
                        {wasCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      Your Answer: <strong style={{ color: wasCorrect ? 'var(--color-success)' : 'var(--color-danger)' }}>{q[`option${selectedAnswers[idx]}`] || 'None'}</strong>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                      Correct Answer: <strong style={{ color: 'var(--color-success)' }}>{q[`option${q.correctAnswer}`]}</strong>
                    </div>
                    {q.description && (
                      <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <strong>Explanation:</strong> {q.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
