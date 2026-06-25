const express = require('express');
const router = express.Router();
const { UserStats, User } = require('../config/db');

// @route   GET /api/leaderboard
// @desc    Get global leaderboard from DB directly (Redis disabled temporarily)
router.get('/', async (req, res) => {
  try {
    const allStats = await UserStats.find({}).sort({ totalPoints: -1 }).limit(50);
    
    // 3. Populate user details
    const populated = await Promise.all(allStats.map(async (entry, index) => {
      let user = await User.findById(entry.userId).select('name');
      
      return {
        rank: index + 1,
        userId: entry.userId,
        name: user ? user.name : 'Unknown User',
        points: entry.totalPoints
      };
    }));

    res.json(populated);

  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Sync leaderboard explicitly endpoint (Internal use)
router.post('/sync', async (req, res) => {
  try {
    const allStats = await UserStats.find({}).select('userId totalPoints');
    const pipeline = redisClient.pipeline();
    allStats.forEach(stat => {
      pipeline.zadd('leaderboard:global', stat.totalPoints, stat.userId.toString());
    });
    await pipeline.exec();
    res.json({ message: 'Leaderboard synced successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Sync failed' });
  }
});

module.exports = router;
