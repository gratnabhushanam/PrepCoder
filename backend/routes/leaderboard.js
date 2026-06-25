const express = require('express');
const router = express.Router();
const { UserStats } = require('../config/db');
const redisClient = require('../config/redis');

// @route   GET /api/leaderboard
// @desc    Get real-time global leaderboard
router.get('/', async (req, res) => {
  try {
    let topRedisIds = [];
    try {
      // 1. Fetch top 100 from Redis
      topRedisIds = await redisClient.zrevrange('leaderboard:global', 0, 99);
    } catch (redisErr) {
      console.warn('Redis unavailable, falling back to MongoDB for leaderboard.');
    }
    
    let statsList = [];
    
    if (topRedisIds && topRedisIds.length > 0) {
      // 2a. If Redis has data, fetch those specific users from MongoDB
      statsList = await UserStats.find({ userId: { $in: topRedisIds } }).lean();
    } else {
      // 2b. If Redis is empty (cache miss or uninitialized), fetch top from Mongo directly
      statsList = await UserStats.find().populate('userId', 'name').sort({ totalPoints: -1 }).limit(100).lean();
      
      // Async rebuild Redis in background
      if (statsList.length > 0) {
        const pipeline = redisClient.pipeline();
        statsList.forEach(s => {
          pipeline.zadd('leaderboard:global', s.totalPoints, s.userId.toString());
        });
        pipeline.exec();
      }
    }

    // 3. Sort strictly in JS for tie-breakers
    statsList.sort((a, b) => {
      // Total Points DESC
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      // Readiness Score DESC
      if (b.readinessScore !== a.readinessScore) return b.readinessScore - a.readinessScore;
      // Problems Solved DESC
      const aSolved = a.solvedProblems ? a.solvedProblems.length : 0;
      const bSolved = b.solvedProblems ? b.solvedProblems.length : 0;
      if (bSolved !== aSolved) return bSolved - aSolved;
      // MCQ Score DESC
      const aMcq = a.mcqScore || 0;
      const bMcq = b.mcqScore || 0;
      return bMcq - aMcq;
    });

    // 4. Format Top 10 response
    const top10 = statsList.slice(0, 10).map((s, index) => {
      const actualName = s.username || (s.userId && s.userId.name) || 'Anonymous';
      return {
        rank: index + 1,
        userId: s.userId._id ? s.userId._id.toString() : s.userId.toString(),
        username: actualName,
        profileImage: s.profileImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(actualName)}`,
        readinessScore: s.readinessScore || 0,
        totalPoints: s.totalPoints || 0
      };
    });

    res.json(top10);
  } catch (error) {
    console.error('Leaderboard Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
