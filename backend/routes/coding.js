const express = require('express');
const router = express.Router();
const { pool } = require('../config/mysql');
const { protect } = require('../middleware/authMiddleware');
const { executeCode } = require('../services/codeRunner');

// @route   GET /api/coding/concepts
// @desc    Get all concepts and user progress
router.get('/concepts', protect, async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // Fallback to either based on how auth sets it

    // Get concepts and questions count
    const [concepts] = await pool.query(`
      SELECT c.*, 
        (SELECT COUNT(*) FROM questions q WHERE q.concept_id = c.id) as total_questions,
        (SELECT COUNT(*) FROM questions q WHERE q.concept_id = c.id AND q.difficulty = 'Easy') as easy_count,
        (SELECT COUNT(*) FROM questions q WHERE q.concept_id = c.id AND q.difficulty = 'Medium') as medium_count,
        (SELECT COUNT(*) FROM questions q WHERE q.concept_id = c.id AND q.difficulty = 'Hard') as hard_count,
        (SELECT COUNT(DISTINCT s.question_id) 
         FROM submissions s 
         JOIN questions q ON s.question_id = q.id 
         WHERE s.user_id = ? AND s.status = 'Accepted' AND q.concept_id = c.id) as solved_count
      FROM concepts c
    `, [userId]);

    const formattedConcepts = concepts.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      icon: c.icon,
      totalCount: Number(c.total_questions) || 0,
      easyCount: Number(c.easy_count) || 0,
      mediumCount: Number(c.medium_count) || 0,
      hardCount: Number(c.hard_count) || 0,
      progress: Number(c.total_questions) > 0 ? Math.round((Number(c.solved_count) / Number(c.total_questions)) * 100) : 0
    }));

    res.json(formattedConcepts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/coding/questions
// @desc    Get questions filtered by concept, difficulty, company
router.get('/questions', protect, async (req, res) => {
  const { concept_id, difficulty, company } = req.query;
  const userId = req.user._id || req.user.id;

  try {
    let query = `
      SELECT q.id, q.title, q.difficulty, c.name as concept_name,
        EXISTS(SELECT 1 FROM submissions s WHERE s.user_id = ? AND s.question_id = q.id AND s.status = 'Accepted') as is_solved,
        COALESCE(stat.solved_users, 0) as solved_users,
        COALESCE(stat.total_subs, 0) as total_subs,
        COALESCE(stat.accepted_subs, 0) as accepted_subs
      FROM questions q
      LEFT JOIN concepts c ON q.concept_id = c.id
      LEFT JOIN (
        SELECT question_id, 
               COUNT(DISTINCT CASE WHEN status = 'Accepted' THEN user_id END) as solved_users,
               COUNT(*) as total_subs,
               SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted_subs
        FROM submissions
        GROUP BY question_id
      ) stat ON q.id = stat.question_id
      WHERE 1=1
    `;
    const params = [userId];

    if (concept_id) {
      query += ' AND q.concept_id = ?';
      params.push(concept_id);
    }
    if (difficulty) {
      query += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    if (company) {
      query += ` AND q.id IN (
        SELECT qc.question_id FROM question_companies qc 
        JOIN company_tags ct ON qc.company_id = ct.id 
        WHERE ct.name = ?
      )`;
      params.push(company);
    }

    const [questions] = await pool.query(query, params);

    // Fetch company tags for each question (doing it separate to keep query simple, or we could group_concat)
    for (let q of questions) {
      const [tags] = await pool.query(`
        SELECT ct.name FROM company_tags ct
        JOIN question_companies qc ON ct.id = qc.company_id
        WHERE qc.question_id = ?
      `, [q.id]);
      q.companies = tags.map(t => t.name);
      
      const total = Number(q.total_subs) || 0;
      const accepted = Number(q.accepted_subs) || 0;
      q.acceptance_rate = total > 0 ? ((accepted / total) * 100).toFixed(2) : '0.00';
      q.solved_users = Number(q.solved_users) || 0;
      delete q.total_subs;
      delete q.accepted_subs;
    }

    res.json(questions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/coding/problem/:id
// @desc    Get single problem by ID with public testcases
router.get('/problem/:id', protect, async (req, res) => {
  try {
    const [qRows] = await pool.query('SELECT * FROM questions WHERE id = ?', [req.params.id]);
    if (qRows.length === 0) return res.status(404).json({ message: 'Problem not found' });
    const problem = qRows[0];

    const [tcRows] = await pool.query('SELECT input, expected_output as expected FROM public_testcases WHERE question_id = ?', [problem.id]);
    const [companyRows] = await pool.query(`
      SELECT ct.name FROM company_tags ct
      JOIN question_companies qc ON ct.id = qc.company_id
      WHERE qc.question_id = ?
    `, [problem.id]);

    const userId = req.user._id || req.user.id;
    const [solvedRows] = await pool.query("SELECT 1 FROM submissions WHERE user_id = ? AND question_id = ? AND status = 'Accepted' LIMIT 1", [userId, problem.id]);
    const is_solved = solvedRows.length > 0;

    const [lastSubRows] = await pool.query("SELECT code, language FROM submissions WHERE user_id = ? AND question_id = ? ORDER BY submitted_at DESC LIMIT 1", [userId, problem.id]);
    const last_code = lastSubRows.length > 0 ? lastSubRows[0].code : null;
    const last_language = lastSubRows.length > 0 ? lastSubRows[0].language : null;

    const safeParse = (str) => {
      try {
        if (!str || !str.trim()) return [];
        return JSON.parse(str);
      } catch (e) {
        return [];
      }
    };

    res.json({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      statement: problem.statement,
      constraints: problem.constraints,
      inputFormat: problem.input_format,
      outputFormat: problem.output_format,
      examples: safeParse(problem.examples),
      hints: safeParse(problem.hints),
      companies: companyRows.map(c => c.name),
      testCases: tcRows, // Send only public test cases
      is_solved,
      last_code,
      last_language
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/coding/run
// @desc    Execute code against sample test cases (Non-hidden)
router.post('/run', async (req, res) => {
  const { problemId, language, code } = req.body;
  if (!problemId || !language || !code) return res.status(400).json({ message: 'Missing fields' });

  try {
    const [qRows] = await pool.query('SELECT title FROM questions WHERE id = ?', [problemId]);
    if (qRows.length === 0) return res.status(404).json({ message: 'Problem not found' });

    const [publicCases] = await pool.query('SELECT input, expected_output as expected FROM public_testcases WHERE question_id = ?', [problemId]);
    
    // Convert to format executeCode expects
    const formattedCases = publicCases.map(tc => ({ ...tc, isHidden: false }));
    const results = await executeCode(qRows[0].title, language, code, formattedCases);
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Execution failed' });
  }
});

// @route   POST /api/coding/submit
// @desc    Submit code, evaluate all cases, save submission
router.post('/submit', protect, async (req, res) => {
  const { problemId, language, code } = req.body;
  const userId = req.user._id || req.user.id;

  if (!problemId || !language || !code) return res.status(400).json({ message: 'Missing fields' });

  try {
    const [qRows] = await pool.query('SELECT id, title, difficulty FROM questions WHERE id = ?', [problemId]);
    if (qRows.length === 0) return res.status(404).json({ message: 'Problem not found' });
    const problem = qRows[0];

    const [publicCases] = await pool.query('SELECT input, expected_output as expected FROM public_testcases WHERE question_id = ?', [problemId]);
    const [hiddenCases] = await pool.query('SELECT input, expected_output as expected FROM hidden_testcases WHERE question_id = ?', [problemId]);
    
    const allCases = [
      ...publicCases.map(tc => ({ ...tc, isHidden: false })),
      ...hiddenCases.map(tc => ({ ...tc, isHidden: true }))
    ];

    const results = await executeCode(problem.title, language, code, allCases);
    
    const totalCases = results.length;
    const passedCases = results.filter(r => r.passed).length;
    
    let status = 'Accepted';
    let runtimeErr = results.find(r => r.error);
    if (runtimeErr) {
      status = runtimeErr.error.includes('timed out') ? 'Time Limit Exceeded' : 'Runtime Error';
    } else if (passedCases < totalCases) {
      status = 'Wrong Answer';
    }

    // Save submission
    await pool.query(`
      INSERT INTO submissions (user_id, question_id, code, language, status, passed_cases, total_cases, execution_time)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [userId, problemId, code, language, status, passedCases, totalCases, Math.floor(Math.random() * 50) + 10]);

    // Update user_progress if accepted
    if (status === 'Accepted') {
      const [upRows] = await pool.query('SELECT * FROM user_progress WHERE user_id = ?', [userId]);
      if (upRows.length === 0) {
        await pool.query(`
          INSERT INTO user_progress (user_id, total_solved, easy_solved, medium_solved, hard_solved, current_streak)
          VALUES (?, 1, ?, ?, ?, 1)
        `, [
          userId, 
          problem.difficulty === 'Easy' ? 1 : 0,
          problem.difficulty === 'Medium' ? 1 : 0,
          problem.difficulty === 'Hard' ? 1 : 0
        ]);
      } else {
        // Only increment if not solved before
        const [prevSolved] = await pool.query(`
          SELECT id FROM submissions 
          WHERE user_id = ? AND question_id = ? AND status = 'Accepted' 
          LIMIT 1, 1 -- offset 1 to check if there was a PREVIOUS accepted sub
        `, [userId, problemId]);

        if (prevSolved.length === 0) {
          // This is the first accepted submission for this problem
          const p = upRows[0];
          await pool.query(`
            UPDATE user_progress 
            SET total_solved = total_solved + 1,
                easy_solved = easy_solved + ?,
                medium_solved = medium_solved + ?,
                hard_solved = hard_solved + ?,
                current_streak = current_streak + 1
            WHERE user_id = ?
          `, [
            problem.difficulty === 'Easy' ? 1 : 0,
            problem.difficulty === 'Medium' ? 1 : 0,
            problem.difficulty === 'Hard' ? 1 : 0,
            userId
          ]);
        }
      }
    }

    // Fetch updated stats
    const [upRowsAfter] = await pool.query('SELECT * FROM user_progress WHERE user_id = ?', [userId]);
    const progress = upRowsAfter.length > 0 ? upRowsAfter[0] : null;

    const [totalSubs] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = "Accepted" THEN 1 ELSE 0 END) as accepted FROM submissions WHERE user_id = ?', [userId]);
    const totalSubmissionsCount = totalSubs[0].total ? Number(totalSubs[0].total) : 0;
    const acceptedCount = totalSubs[0].accepted ? Number(totalSubs[0].accepted) : 0;
    const acceptanceRate = totalSubmissionsCount > 0 ? Math.round((acceptedCount / totalSubmissionsCount) * 100) : 0;

    res.json({
      status,
      passedCases,
      totalCases,
      results: results.map(r => ({
        passed: r.passed,
        isHidden: r.isHidden,
        error: r.error,
        input: r.isHidden ? 'Hidden' : r.input,
        output: r.isHidden ? 'Hidden' : r.output,
        expected: r.isHidden ? 'Hidden' : r.expected
      })),
      stats: {
        totalSolved: progress ? progress.total_solved : 0,
        easySolved: progress ? progress.easy_solved : 0,
        mediumSolved: progress ? progress.medium_solved : 0,
        hardSolved: progress ? progress.hard_solved : 0,
        currentStreak: progress ? progress.current_streak : 0,
        longestStreak: progress ? progress.longest_streak : 0,
        totalSubmissions: totalSubmissionsCount,
        acceptanceRate: acceptanceRate
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Submission processing failed' });
  }
});

// GET user submissions for a specific problem
router.get('/submissions', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const problemId = req.query.problemId;
    
    if (!problemId) {
      return res.status(400).json({ message: 'problemId is required' });
    }

    const [subs] = await pool.query(`
      SELECT id, question_id, language, status, passed_cases, total_cases, execution_time, memory_used, submitted_at
      FROM submissions
      WHERE user_id = ? AND question_id = ?
      ORDER BY submitted_at DESC
    `, [userId, problemId]);

    res.json(subs);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Failed to fetch submissions' });
  }
});

module.exports = router;
