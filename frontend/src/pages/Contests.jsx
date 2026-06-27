import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AppContext } from '../context/AppContext';

export default function Contests() {
  const { API_BASE, token } = useContext(AppContext);
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await axios.get(`${API_BASE}/coding/contests`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setContests(res.data);
      } catch (err) {
        console.error('Failed to fetch contests', err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchContests();
  }, [API_BASE, token]);

  const calculateTimeLeft = (startTime) => {
    const difference = new Date(startTime) - new Date();
    let timeLeft = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60)
      };
    }
    return timeLeft;
  };

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Platform Contests</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginBottom: '3rem' }}>
        Compete with developers worldwide. Upcoming and active contests will appear here.
      </p>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading contests...</div>
      ) : contests.length === 0 ? (
        <div className="card" style={{ padding: '3rem 2rem', color: 'var(--text-muted)' }}>
          No upcoming contests currently scheduled. Check back later!
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {contests.map((contest) => (
            <ContestCard key={contest._id} contest={contest} calculateTimeLeft={calculateTimeLeft} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContestCard({ contest, calculateTimeLeft }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft(contest.startTime));

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft(contest.startTime));
    }, 1000);
    return () => clearTimeout(timer);
  });

  const isStarted = Object.keys(timeLeft).length === 0;

  return (
    <div className="card" style={{ padding: '2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{contest.title}</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', flex: 1 }}>{contest.description || 'Join this contest and compete with others!'}</p>
      
      {isStarted && new Date(contest.endTime) > new Date() ? (
        <div style={{ marginBottom: '2rem', color: 'var(--color-primary)', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Contest is Active!
        </div>
      ) : isStarted && new Date(contest.endTime) < new Date() ? (
        <div style={{ marginBottom: '2rem', color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '1.2rem' }}>
          Contest Ended
        </div>
      ) : (
        <>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Starts In:</div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-tertiary)', padding: '0.8rem', borderRadius: '8px', minWidth: '60px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{timeLeft.days || '0'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>DAYS</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '0.8rem', borderRadius: '8px', minWidth: '60px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{timeLeft.hours || '0'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>HOURS</div>
            </div>
            <div style={{ background: 'var(--bg-tertiary)', padding: '0.8rem', borderRadius: '8px', minWidth: '60px' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)' }}>{timeLeft.minutes || '0'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>MINS</div>
            </div>
          </div>
        </>
      )}
      
      <button className="btn btn-primary" disabled={isStarted && new Date(contest.endTime) < new Date()}>
        {isStarted && new Date(contest.endTime) > new Date() ? 'Enter Contest' : 'Register Now'}
      </button>
    </div>
  );
}
