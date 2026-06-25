const Redis = require('ioredis');

// Default connection
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Connection Error:', err.message);
  console.warn('⚠️ Leaderboard and caching features require Redis to be running.');
});

redisClient.on('connect', () => {
  console.log('⚡ Connected to Redis successfully.');
});

module.exports = redisClient;
