import React, { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';

export default function AIMockInterview() {
  const { API_BASE, user, setUser } = useContext(AppContext);

  const [activeType, setActiveType] = useState(null); // HR, Technical, Coding, System Design
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  // Voice States (Web Speech API)
  const [isListening, setIsListening] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Scores record
  const [feedbackCard, setFeedbackCard] = useState(null);
  
  const bottomRef = useRef(null);

  // Scroll messages to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Speech Recognition Initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsListening(true);
      };

      rec.onresult = (event) => {
        const textResult = event.results[0][0].transcript;
        setInputText(prev => (prev ? `${prev} ${textResult}` : textResult));
      };

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e);
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      setRecognition(rec);
    }
  }, []);

  const handleStartVoice = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      alert('Speech Recognition API is not supported in your browser. Try Google Chrome.');
    }
  };

  const handleSpeak = (text) => {
    if (!ttsEnabled) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('TTS error:', e);
    }
  };

  const handleSelectType = async (type) => {
    setActiveType(type);
    setMessages([]);
    setFeedbackCard(null);
    setInterviewComplete(false);
    setLoading(true);

    try {
      // Trigger initial prompt question
      const res = await axios.post(`${API_BASE}/ai/interview`, {
        interviewType: type,
        history: [],
        latestAnswer: ''
      });

      const opener = res.data.question;
      setMessages([{ role: 'assistant', content: opener }]);
      handleSpeak(opener);
    } catch (err) {
      console.error(err);
      const errTxt = "Could not initialize interview session. Ensure server is online.";
      setMessages([{ role: 'assistant', content: errTxt }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const cleanText = inputText.trim();
    if (!cleanText || loading) return;

    // Add candidate message to history
    const updatedHistory = [...messages, { role: 'user', content: cleanText }];
    setMessages(updatedHistory);
    setInputText('');
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/ai/interview`, {
        interviewType: activeType,
        history: updatedHistory,
        latestAnswer: cleanText
      });

      const nextQuestion = res.data.question;
      
      // Update running scores & feedback
      setFeedbackCard({
        feedback: res.data.feedback,
        score: res.data.score,
        communicationScore: res.data.communicationScore,
        technicalScore: res.data.technicalScore,
        confidenceScore: res.data.confidenceScore
      });

      setMessages(prev => [...prev, { role: 'assistant', content: nextQuestion }]);
      handleSpeak(nextQuestion);

      if (nextQuestion.toLowerCase().includes('complete')) {
        setInterviewComplete(true);
        // Refresh User profile score context
        const userRes = await axios.get(`${API_BASE}/auth/profile`);
        setUser(userRes.data);
      }

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'assistant', content: "An error occurred compiling response." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', animation: 'fadeIn 0.5s ease' }}>
      
      {/* View 1: Select Category */}
      {!activeType && (
        <div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '0.5rem' }}>AI Mock Interview</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
            Refine your coding, technical core, and HR responses with real-time feedback and metrics evaluation.
          </p>

          <div className="grid-2">
            {[
              { type: "HR", name: "HR Interview", icon: "🤝", desc: "Covers behavioral questions, corporate suitability, relocation flexibility, and career goals." },
              { type: "Technical", name: "Technical Core", icon: "💻", desc: "Questions covering Java/Python runtime basics, DBMS Normalization, SQL queries, and networking." },
              { type: "Coding", name: "Coding Logic", icon: "🧠", desc: "Algorithmic thinking challenges, space-time complexity analysis, and programming structures." },
              { type: "System Design", name: "System Architecture", icon: "🌐", desc: "Scalability structures, caching layers, load balancers, rate limiting, and DB sharding configurations." }
            ].map(item => (
              <div key={item.type} className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: '200px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.8rem' }}>{item.icon}</div>
                <h3 className="card-title">{item.name}</h3>
                <p className="card-desc" style={{ marginBottom: '1.5rem' }}>{item.desc}</p>
                <button onClick={() => handleSelectType(item.type)} className="btn btn-primary" style={{ marginTop: 'auto', width: '100%' }}>
                  Start Session
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View 2: Active Chat / Voice Workspace */}
      {activeType && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>
          
          {/* Chat Stream Column */}
          <div className="card" style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', padding: '1.5rem 0' }}>
            
            {/* Header info bar */}
            <div style={{ padding: '0 1.5rem 1rem 1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{activeType} Interview Session</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Interviewer: PrepAI Agent</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button 
                  onClick={() => setTtsEnabled(!ttsEnabled)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    color: ttsEnabled ? 'var(--color-primary)' : 'var(--text-muted)',
                    padding: '0.4rem 0.6rem',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    fontSize: '0.8rem'
                  }}
                >
                  🔊 Audio {ttsEnabled ? 'On' : 'Off'}
                </button>
                <button onClick={() => setActiveType(null)} className="btn btn-danger" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}>
                  End
                </button>
              </div>
            </div>

            {/* Messages Log area */}
            <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((m, idx) => {
                const isUser = m.role === 'user';
                return (
                  <div key={idx} style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '80%',
                    background: isUser ? 'linear-gradient(135deg, var(--color-primary), var(--color-accent))' : 'var(--bg-secondary)',
                    border: `1px solid ${isUser ? 'transparent' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-md)',
                    padding: '0.75rem 1.25rem',
                    color: 'var(--text-primary)',
                    fontSize: '0.95rem',
                    lineHeight: 1.5
                  }}>
                    {m.content}
                  </div>
                );
              })}
              {loading && (
                <div style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Thinking...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input form */}
            {!interviewComplete && (
              <form onSubmit={handleSendMessage} style={{ padding: '1rem 1.5rem 0 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder={isListening ? "Listening... Speak now" : "Type your professional answer..."}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={loading}
                />
                
                {/* Voice button */}
                <button
                  type="button"
                  onClick={handleStartVoice}
                  style={{
                    padding: '0 0.8rem',
                    background: isListening ? 'var(--color-danger)' : 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: isListening ? 'white' : 'var(--text-primary)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Answer using speech recognition"
                >
                  🎤
                </button>

                <button type="submit" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }} disabled={loading || !inputText.trim()}>
                  Send
                </button>
              </form>
            )}

            {/* Completion card */}
            {interviewComplete && (
              <div style={{ padding: '1.5rem', textAlign: 'center', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--color-success)', marginBottom: '0.5rem', fontSize: '1.1rem' }}>Interview Session Completed!</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>Review your total scorecard on the dashboard.</p>
                <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.85rem' }}>Back to Dashboard</Link>
              </div>
            )}
          </div>

          {/* Real-time Scores Column */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <h3 className="card-title" style={{ fontSize: '1rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Feedback metrics</h3>
            
            {feedbackCard ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                
                <div>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Answer Score</h4>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--color-accent)' }}>{feedbackCard.score} / 10</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Technical correctness</span>
                    <span style={{ fontWeight: 'bold' }}>{feedbackCard.technicalScore}/10</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Communication delivery</span>
                    <span style={{ fontWeight: 'bold' }}>{feedbackCard.communicationScore}/10</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Confidence level</span>
                    <span style={{ fontWeight: 'bold' }}>{feedbackCard.confidenceScore}/10</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Suggestions</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                    {feedbackCard.feedback}
                  </p>
                </div>

              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 'auto 0', textAlign: 'center' }}>
                Submit answers to review live feedback scoring analytics here.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
