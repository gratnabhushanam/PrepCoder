import React from 'react';

export default function Leaderboard() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-primary)' }}>Global Leaderboard</h1>
      <p style={{ color: 'var(--text-secondary)' }}>Leaderboard data is currently being synced. Please check back later.</p>
    </div>
  );
}
