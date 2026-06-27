const { Queue, Worker } = require('bullmq');
const Redis = require('ioredis');
const { executeCode } = require('../services/codeRunner');
const { db: { Submission, User, Question }, syncUserStats } = require('shared');

// We need a redis connection for BullMQ
// We will attempt to use process.env.REDIS_URL or fallback to localhost
const redisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  maxRetriesPerRequest: null // Required for BullMQ
};

const connection = new Redis(redisOptions);

const submissionQueue = new Queue('compiler-submissions', { connection });

// Initialize the worker separately in a function so we can pass 'io' for WebSockets
const initSubmissionWorker = (io) => {
  const worker = new Worker('compiler-submissions', async (job) => {
    const { submissionId, userId, questionId, code, language, cases } = job.data;
    
    const emitStatus = (statusData) => {
        if (io) {
            io.to(`submission_${submissionId}`).emit('submission_update', statusData);
        }
    };

    try {
      emitStatus({ status: 'Running', message: 'Evaluating your code...' });

      // Run code against test cases
      const results = await executeCode('Submission', language, code, cases);
      
      const totalCases = cases.length;
      const passedCases = results.filter(r => r.passed).length;
      const isAccepted = passedCases === totalCases;
      
      let finalVerdict = 'Accepted';
      if (!isAccepted) {
        const firstFailed = results.find(r => !r.passed);
        if (firstFailed?.error) {
          if (firstFailed.error.includes('Time Limit Exceeded') || firstFailed.error.includes('timed out')) {
            finalVerdict = 'Time Limit Exceeded';
          } else if (firstFailed.error.includes('Compilation Error')) {
            finalVerdict = 'Compilation Error';
          } else if (firstFailed.error.includes('Memory Limit Exceeded')) {
            finalVerdict = 'Memory Limit Exceeded';
          } else if (firstFailed.error.includes('Output Limit Exceeded')) {
            finalVerdict = 'Output Limit Exceeded';
          } else {
            finalVerdict = 'Runtime Error';
          }
        } else {
          finalVerdict = 'Wrong Answer';
        }
      }

      const executionTime = Math.max(...results.map(r => r.time || 0), 0);
      const memory = Math.max(...results.map(r => r.memory || 0), 0);

      // Update the pending submission in the DB
      const submission = await Submission.findById(submissionId);
      if (submission) {
        submission.status = finalVerdict;
        submission.passed_cases = passedCases;
        submission.total_cases = totalCases;
        submission.execution_time = executionTime;
        submission.memory_used = memory;
        await submission.save();
      }

      // If Accepted, update user stats
      if (isAccepted) {
        const user = await User.findById(userId);
        if (user && !user.solvedProblems?.includes(questionId.toString())) {
          if (!user.solvedProblems) user.solvedProblems = [];
          user.solvedProblems.push(questionId.toString());
          
          const today = new Date().toISOString().split('T')[0];
          const lastActive = user.lastActiveDate ? new Date(user.lastActiveDate).toISOString().split('T')[0] : null;
          
          if (lastActive !== today) {
            user.dailyStreak = (user.dailyStreak || 0) + 1;
            user.lastActiveDate = new Date();
          }
          await user.save();
          
          try {
             await syncUserStats(userId);
          } catch(e) {
             console.error("Failed to sync stats", e);
          }
        }
      }

      emitStatus({ 
          status: 'Completed', 
          verdict: finalVerdict,
          passedCases,
          totalCases,
          executionTime,
          memory,
          results
      });

      return { verdict: finalVerdict };

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      
      const submission = await Submission.findById(submissionId);
      if (submission) {
        submission.status = 'Internal Error';
        await submission.save();
      }

      emitStatus({ status: 'Error', message: 'Internal Server Error during execution' });
      throw error;
    }
  }, { connection });

  worker.on('failed', (job, err) => {
    console.error(`Submission Job ${job.id} failed:`, err);
  });

  return worker;
};

module.exports = {
  submissionQueue,
  initSubmissionWorker
};
