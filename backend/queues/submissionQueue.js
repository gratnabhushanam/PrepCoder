const { Queue, Worker } = require('bullmq');
const redisClient = require('../config/redis');
const { executeCode } = require('../services/codeRunner');
const { Submission, User, Question } = require('../config/db');
const { syncUserStats } = require('../utils/statsUpdater');

// Create the submission queue
const submissionQueue = new Queue('code-submissions', { connection: redisClient });

// Worker that processes the submissions asynchronously
const submissionWorker = new Worker('code-submissions', async (job) => {
  const { userId, questionId, code, language, cases } = job.data;
  
  try {
    // 1. Run the code
    const results = await executeCode('Submission', language, code, cases);
    
    // 2. Determine verdict
    const totalCases = cases.length;
    const passedCases = results.filter(r => r.status === 'Accepted').length;
    const isAccepted = passedCases === totalCases;
    const finalVerdict = isAccepted ? 'Accepted' : (results.find(r => r.status !== 'Accepted')?.status || 'Wrong Answer');

    // 3. Save Submission
    const submission = new Submission({
      user_id: userId,
      question_id: questionId,
      code,
      language,
      status: finalVerdict,
      passed_cases: passedCases,
      total_cases: totalCases,
      execution_time: Math.max(...results.map(r => r.time || 0)),
      memory_used: Math.max(...results.map(r => r.memory || 0))
    });
    
    await submission.save();

    // 4. If Accepted, update user array and recalculate stats
    if (isAccepted) {
      const user = await User.findById(userId);
      if (user && !user.solvedProblems.includes(questionId.toString())) {
        user.solvedProblems.push(questionId.toString());
        
        // Update streak logic
        const today = new Date().toISOString().split('T')[0];
        const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;
        
        if (lastActive !== today) {
          user.dailyStreak = (user.dailyStreak || 0) + 1;
          user.lastActiveDate = new Date();
        }
        
        await user.save();
        
        // Trigger Stats and Leaderboard sync
        await syncUserStats(userId);
      }
    }

    return {
      submissionId: submission._id,
      verdict: finalVerdict,
      passedCases,
      totalCases
    };
  } catch (error) {
    console.error(`Job ${job.id} failed:`, error);
    throw error;
  }
}, { connection: redisClient });

module.exports = { submissionQueue };
