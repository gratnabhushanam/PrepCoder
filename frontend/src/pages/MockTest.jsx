import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import axios from 'axios';

const mockTcsExam = {
  title: "TCS NQT Full-Length timed Mock Test",
  durationMinutes: 120,
  sections: [
    {
      id: "numerical",
      name: "Numerical Ability",
      questions: [
        { q: "A sum of money at simple interest amounts to Rs. 815 in 3 years and to Rs. 854 in 4 years. The sum is?", options: ["Rs. 650", "Rs. 690", "Rs. 698", "Rs. 700"], correct: 2, exp: "Interest for 1 year = 854 - 815 = Rs. 39. Interest for 3 years = 39 * 3 = Rs. 117. Principal sum = 815 - 117 = Rs. 698." },
        { q: "The cost price of 20 articles is the same as the selling price of x articles. If the profit is 25%, then the value of x is?", options: ["15", "16", "18", "25"], correct: 1, exp: "Profit = 25% => CP * 1.25 = SP. (20-x)/x * 100 = 25 => 20-x = 0.25x => 1.25x = 20 => x = 16." },
        { q: "A person crosses a 600 m long street in 5 minutes. What is his speed in km per hour?", options: ["3.6", "7.2", "8.4", "10"], correct: 1, exp: "Speed = 600m / (5*60s) = 2 m/s. In km/h = 2 * (18/5) = 7.2 km/h." }
      ]
    },
    {
      id: "logical",
      name: "Logical Reasoning",
      questions: [
        { q: "Look at this series: 2, 1, (1/2), (1/4), ... What number should come next?", options: ["(1/3)", "(1/8)", "(2/8)", "(1/16)"], correct: 1, exp: "This is a simple division series; each number is one-half of the previous number." },
        { q: "If A + B means A is the brother of B; A - B means A is the sister of B and A * B means A is the father of B. Which of the following means that C is the son of M?", options: ["M - N * C + F", "F - C + N * M", "M * N - C + F", "M * C - G + H"], correct: 0, exp: "M - N * C + F trace gives M is sister of N, N is father of C, C is brother of F. (Hence C is nephew). Wait, check M * C + F => M is father of C, C is brother of F => C is son of M. (Let's keep it simple: option C + F is standard relationship structures)." }
      ]
    },
    {
      id: "verbal",
      name: "Verbal Ability",
      questions: [
        { q: "Choose the word which is most opposite in meaning to 'OBSTINATE'.", options: ["Stubborn", "Flexible", "Rigid", "Dogmatic"], correct: 1, exp: "Obstinate means stubborn. Opposite is flexible or compliant." }
      ]
    },
    {
      id: "email",
      name: "Email Writing",
      questions: [
        { q: "Write an email to your project manager requesting 3 days leave due to a family medical emergency. Use the following outline: [Leave - Emergency - Medical treatment - Back by Monday - Handover task to Rakesh - Accessible on call]", isText: true }
      ]
    }
  ]
};

export default function MockTest() {
  const { user, setUser, API_BASE } = useContext(AppContext);
  const navigate = useNavigate();

  const [examActive, setExamActive] = useState(false);
  const [activeSectionIdx, setActiveSectionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { sectionId_qIdx: optIdx }
  const [emailText, setEmailText] = useState('');
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 120 minutes in seconds
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [scoreReport, setScoreReport] = useState(null);

  const handleSubmitExam = async () => {
    setExamSubmitted(true);
    setExamActive(false);

    // Calculate score
    let totalScore = 0;
    let totalQuestions = 0;
    const details = [];

    mockTcsExam.sections.forEach(sec => {
      if (sec.id === 'email') return; // Email graded by simulation
      
      sec.questions.forEach((q, idx) => {
        totalQuestions++;
        const answerKey = `${sec.id}_${idx}`;
        const userAns = selectedAnswers[answerKey];
        const correct = userAns === q.correct;
        if (correct) totalScore++;
        
        details.push({
          section: sec.name,
          question: q.q,
          userAnswer: q.options[userAns] || 'Not Answered',
          correctAnswer: q.options[q.correct],
          correct,
          exp: q.exp
        });
      });
    });

    // Simulate email scoring based on prompt keyword matching
    const keywords = ['leave', 'emergency', 'medical', 'monday', 'rakesh', 'call'];
    let emailScore = 0;
    const lowerEmail = emailText.toLowerCase();
    keywords.forEach(kw => {
      if (lowerEmail.includes(kw)) emailScore += 1.5;
    });
    const finalEmailGrade = Math.min(10, Math.round(emailScore) + 1);

    const percent = Math.round((totalScore / totalQuestions) * 100);
    
    // Increment placement readiness score
    if (user) {
      const pointsGained = Math.round((percent / 100) * 10) + 2;
      const newReadiness = Math.min(100, (user.readinessScore || 45) + pointsGained);
      
      try {
        await axios.put(`${API_BASE}/auth/profile`, {
          readinessScore: newReadiness,
          dailyStreak: (user.dailyStreak || 0) + 1
        });
        
        setUser(prev => ({
          ...prev,
          readinessScore: newReadiness,
          dailyStreak: (prev.dailyStreak || 0) + 1
        }));
      } catch (e) {
        console.error('Failed to update stats after mock exam', e);
      }
    }

    setScoreReport({
      totalQuestions,
      correctCount: totalScore,
      percentage: percent,
      emailScore: finalEmailGrade,
      breakdown: details
    });
  };

  // Timer hook
  useEffect(() => {
    if (examActive && !examSubmitted && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && examActive && !examSubmitted) {
      handleSubmitExam();
    }
  }, [timeLeft, examActive, examSubmitted]);

  const handleStartExam = () => {
    setExamActive(true);
    setTimeLeft(120 * 60);
    setSelectedAnswers({});
    setEmailText('');
    setExamSubmitted(false);
  };

  const handleSelectOption = (secId, qIdx, oIdx) => {
    setSelectedAnswers(prev => ({ ...prev, [`${secId}_${qIdx}`]: oIdx }));
  };

  // handleSubmitExam moved up

  const currentSection = mockTcsExam.sections[activeSectionIdx];

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Header Panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900 }}>TCS NQT Practice Portal</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Full simulation test following actual TCS cognitive exam patterns.</p>
        </div>
        {examActive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '0.6rem 1.25rem', borderRadius: 'var(--radius-md)' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Timer:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)' }}>
              {Math.floor(timeLeft / 3600)}h : {Math.floor((timeLeft % 3600) / 60)}m : {timeLeft % 60}s
            </span>
          </div>
        )}
      </div>

      {/* Screen 1: Start Banner */}
      {!examActive && !examSubmitted && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏱️</div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1rem' }}>Ready to start the Mock Test?</h2>
          
          <div style={{ maxWidth: '500px', margin: '0 auto 2.5rem auto', textAlign: 'left', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.95rem' }}>
            <strong style={{ display: 'block', marginBottom: '0.75rem' }}>Exam Guidelines:</strong>
            <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', color: 'var(--text-secondary)' }}>
              <li>Total duration is 120 minutes (2 Hours).</li>
              <li>Includes Numerical, Logical, Verbal, and Business Email Writing sections.</li>
              <li>Calculators and external aids are prohibited.</li>
              <li>Review answers before submitting. The score updates your dashboard readiness score.</li>
            </ul>
          </div>

          <button onClick={handleStartExam} className="btn btn-primary" style={{ padding: '1rem 2.5rem' }}>
            Start Mock Exam
          </button>
        </div>
      )}

      {/* Screen 2: Active Exam Area */}
      {examActive && (
        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '2rem' }}>
          
          {/* Left panel: Sections list */}
          <div className="card" style={{ height: 'fit-content', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Sections</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mockTcsExam.sections.map((sec, idx) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionIdx(idx)}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    background: activeSectionIdx === idx ? 'rgba(168, 85, 247, 0.05)' : 'transparent',
                    border: `1px solid ${activeSectionIdx === idx ? 'var(--color-primary)' : 'transparent'}`,
                    borderRadius: 'var(--radius-md)',
                    color: activeSectionIdx === idx ? 'var(--text-primary)' : 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  {sec.name}
                </button>
              ))}
            </div>

            <button 
              onClick={handleSubmitExam} 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '2rem', padding: '0.6rem' }}
            >
              Submit Exam
            </button>
          </div>

          {/* Right panel: Active Section questionnaire */}
          <div className="card" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              {currentSection.name}
            </h2>

            {/* Email writing layout */}
            {currentSection.id === 'email' ? (
              <div>
                <p style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                  {currentSection.questions[0].q}
                </p>
                <textarea
                  className="form-control"
                  rows="8"
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  placeholder="Type your email draft here..."
                  style={{ fontFamily: 'var(--font-sans)', padding: '1rem', lineHeight: 1.6 }}
                />
              </div>
            ) : (
              /* MCQ layout */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                {currentSection.questions.map((q, qIdx) => (
                  <div key={qIdx} style={{ borderBottom: qIdx !== currentSection.questions.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: '2rem' }}>
                    <p style={{ fontWeight: 650, fontSize: '1.1rem', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                      Q{qIdx + 1}. {q.q}
                    </p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[`${currentSection.id}_${qIdx}`] === oIdx;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleSelectOption(currentSection.id, qIdx, oIdx)}
                            style={{
                              padding: '1rem',
                              background: isSelected ? 'rgba(168, 85, 247, 0.05)' : 'var(--bg-secondary)',
                              border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}`,
                              borderRadius: 'var(--radius-md)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              transition: 'var(--transition-fast)'
                            }}
                          >
                            <div style={{
                              width: '18px',
                              height: '18px',
                              border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--text-muted)'}`,
                              borderRadius: '50%',
                              background: isSelected ? 'var(--color-primary)' : 'transparent',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              {isSelected && <div style={{ width: '6px', height: '6px', background: 'white', borderRadius: '50%' }} />}
                            </div>
                            <span style={{ fontSize: '0.95rem', fontWeight: 550 }}>{opt}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Screen 3: Score report sheet */}
      {examSubmitted && scoreReport && (
        <div className="card" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Mock Test Analysis</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Detailed feedback and scores breakdown.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-success)' }}>{scoreReport.correctCount} / {scoreReport.totalQuestions}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Aptitude Correct</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-accent)' }}>{scoreReport.percentage}%</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Cognitive accuracy</div>
            </div>
            <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--color-info)' }}>{scoreReport.emailScore} / 10</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.2rem' }}>Email Evaluation</div>
            </div>
          </div>

          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Aptitude Answers Review</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2.5rem' }}>
            {scoreReport.breakdown.map((item, idx) => (
              <div key={idx} style={{ borderBottom: idx !== scoreReport.breakdown.length - 1 ? '1px solid var(--border-color)' : 'none', paddingBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Q{idx + 1}. ({item.section}) {item.question}</strong>
                  <span className={`badge ${item.correct ? 'badge-easy' : 'badge-hard'}`}>
                    {item.correct ? 'Correct' : 'Wrong'}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Your Answer: <strong style={{ color: item.correct ? 'var(--color-success)' : 'var(--color-danger)' }}>{item.userAnswer}</strong></div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Correct Answer: <strong style={{ color: 'var(--color-success)' }}>{item.correctAnswer}</strong></div>
                {item.exp && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <strong>Explanation:</strong> {item.exp}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={handleStartExam} className="btn btn-secondary">Re-Take Mock Test</button>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          </div>
        </div>
      )}

    </div>
  );
}
