const { User, UserStats, Question } = require('../config/db');
const redisClient = require('../config/redis');

/**
 * Recalculates and updates the UserStats collection for a specific user.
 * This should be called asynchronously after any major activity.
 * 
 * @param {String} userId - The user's MongoDB ObjectId string
 */
async function syncUserStats(userId) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = new UserStats({ userId });
    }

    stats.username = user.name;
    stats.profileImage = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`;

    stats.solvedProblems = user.solvedProblems || [];
    stats.mcqsPracticed = user.mcqStats?.totalAttempted || 0;
    stats.atsScore = user.resumeData?.atsScore || 0;
    stats.currentStreak = user.dailyStreak || 0;
    
    // Update Longest Streak
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }

    // MCQ Score
    const correctMCQs = user.mcqStats?.correctAnswers || 0;
    stats.mcqScore = correctMCQs * 2;

    // Coding Points Calculation
    let codingPoints = 0;
    if (stats.solvedProblems.length > 0) {
      const solvedQs = await Question.find({ _id: { $in: stats.solvedProblems } }).select('difficulty');
      solvedQs.forEach(q => {
        if (q.difficulty === 'Easy') codingPoints += 10;
        else if (q.difficulty === 'Medium') codingPoints += 20;
        else if (q.difficulty === 'Hard') codingPoints += 40;
      });
    }

    // Streak Bonus
    let streakBonus = 0;
    if (stats.currentStreak >= 30) streakBonus = 100;
    else if (stats.currentStreak >= 7) streakBonus = 20;

    // ATS Bonus
    const atsBonus = Math.floor(stats.atsScore / 10);

    // Total Points calculation for leaderboard
    stats.totalPoints = codingPoints + stats.mcqScore + streakBonus + atsBonus;

    // Readiness Formula (capped)
    const readinessCoding = Math.min((stats.solvedProblems.length / 100) * 40, 40);
    const readinessMcq = Math.min((stats.mcqsPracticed / 50) * 20, 20);
    const readinessAts = (stats.atsScore / 100) * 20;
    const readinessStreak = Math.min((stats.currentStreak / 14) * 10, 10);
    const profileScore = 10; 
    stats.readinessScore = Math.round(readinessCoding + readinessMcq + readinessAts + readinessStreak + profileScore);

    stats.updatedAt = Date.now();
    await stats.save();

    // Update Redis Leaderboard
    await redisClient.zadd('leaderboard:global', stats.totalPoints, userId.toString());

  } catch (error) {
    console.error('Error syncing UserStats:', error);
  }
}

module.exports = { syncUserStats };
