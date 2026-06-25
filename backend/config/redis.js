const Redis = require('ioredis');

// Default connection
const redisClient = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy: () => null
});

let hasLoggedRedisError = false;

redisClient.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    if (!hasLoggedRedisError) {
      console.warn('⚠️ Redis not detected. Proceeding with MongoDB fallback for Leaderboard.');
      hasLoggedRedisError = true;
    }
  } else {
    console.error('❌ Redis Error:', err.message);
  }
});

redisClient.on('connect', () => {
  console.log('⚡ Connected to Redis successfully.');
});

module.exports = redisClient;
