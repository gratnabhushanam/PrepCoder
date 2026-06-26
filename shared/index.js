const db = require('./config/db');
const { protect, adminOnly } = require('./middleware/authMiddleware');
const { syncUserStats } = require('./utils/statsUpdater');
const gemini = require('./services/gemini');
const redisClient = require('./config/redis');

module.exports = {
  db,
  protect,
  adminOnly,
  syncUserStats,
  gemini,
  redisClient
};
