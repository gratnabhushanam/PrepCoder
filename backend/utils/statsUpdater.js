const { User, UserStats } = require('../config/db');

/**
 * Recalculates and updates the UserStats collection for a specific user.
 * This should be called asynchronously after any major activity.
 * 
 * @param {String} userId - The user's MongoDB ObjectId string
 */
async function syncUserStats(userId) {
  try {
    const user = await User.findById(userId).populate('solvedProblems');
    if (!user) return;

    let stats = await UserStats.findOne({ userId });
    if (!stats) {
      stats = new UserStats({ userId });
    }

    stats.solvedProblems = user.solvedProblems || [];
    stats.mcqsPracticed = user.mcqStats?.totalAttempted || 0;
    stats.atsScore = user.resumeData?.atsScore || 0;
    stats.currentStreak = user.dailyStreak || 0;
    
    // Update Longest Streak
    if (stats.currentStreak > stats.longestStreak) {
      stats.longestStreak = stats.currentStreak;
    }

    // Formula: Coding (40%), MCQ (20%), ATS (20%), Streak (10%), Profile (10%)
    const codingScore = Math.min((stats.solvedProblems.length / 100) * 40, 40);
    const mcqScore = Math.min((stats.mcqsPracticed / 50) * 20, 20);
    const atsScoreComponent = (stats.atsScore / 100) * 20;
    const streakScore = Math.min((stats.currentStreak / 14) * 10, 10);
    const profileScore = 10; 

    stats.readinessScore = Math.round(codingScore + mcqScore + atsScoreComponent + streakScore + profileScore);
    
    // Total Points = (problems * 10) + (mcqs * 2) + ATS bonus
    stats.totalPoints = (stats.solvedProblems.length * 10) + (stats.mcqsPracticed * 2) + (stats.atsScore > 75 ? 50 : 0);

    stats.updatedAt = Date.now();
    await stats.save();

    // Update Redis Leaderboard (Disabled for now)
    // await redisClient.zadd('leaderboard:global', stats.totalPoints, userId.toString());

  } catch (error) {
    console.error('Error syncing UserStats:', error);
  }
}

module.exports = { syncUserStats };
