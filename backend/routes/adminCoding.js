const express = require('express');
const router = express.Router();
const { pool } = require('../config/mysql');
// const { protect } = require('../middleware/authMiddleware');

// Temporarily bypass protect for easy development, add back protect later if needed.
// Actually, I should use protect.
const { protect, adminOnly } = require('../middleware/authMiddleware');

// Add Concept
router.post('/concepts', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return res.status(400).json({ message: 'Concept name required' });

    const [result] = await pool.query(
      'INSERT INTO concepts (name, description, icon) VALUES (?, ?, ?)',
      [name, description, icon]
    );

    res.status(201).json({ message: 'Concept created', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to add concept' });
  }
});

// Get Concepts
router.get('/concepts', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM concepts');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch concepts' });
  }
});

// Upload Question
router.post('/questions', protect, adminOnly, async (req, res) => {
  try {
    const {
      concept_id, title, difficulty, statement, constraints,
      input_format, output_format, examples, hints, editorial, video_solution,
      companies, public_testcases, hidden_testcases
    } = req.body;

    if (!title || !statement || !difficulty) {
      return res.status(400).json({ message: 'Missing required question fields' });
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Insert Question
      const [qResult] = await connection.query(
        `INSERT INTO questions (
          concept_id, title, difficulty, statement, constraints, input_format,
          output_format, examples, hints, editorial, video_solution
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          concept_id || null, title, difficulty, statement, constraints, input_format,
          output_format, JSON.stringify(examples || []), JSON.stringify(hints || []),
          editorial, video_solution
        ]
      );
      const questionId = qResult.insertId;

      // 2. Insert Public Test Cases
      if (public_testcases && public_testcases.length > 0) {
        const ptcValues = public_testcases.map(tc => [questionId, tc.input, tc.expected_output]);
        await connection.query('INSERT INTO public_testcases (question_id, input, expected_output) VALUES ?', [ptcValues]);
      }

      // 3. Insert Hidden Test Cases
      if (hidden_testcases && hidden_testcases.length > 0) {
        const htcValues = hidden_testcases.map(tc => [questionId, tc.input, tc.expected_output]);
        await connection.query('INSERT INTO hidden_testcases (question_id, input, expected_output) VALUES ?', [htcValues]);
      }

      // 4. Handle Company Tags
      if (companies && companies.length > 0) {
        for (const comp of companies) {
          // Find or create company tag
          let compId;
          const [compRows] = await connection.query('SELECT id FROM company_tags WHERE name = ?', [comp]);
          if (compRows.length > 0) {
            compId = compRows[0].id;
          } else {
            const [cResult] = await connection.query('INSERT INTO company_tags (name) VALUES (?)', [comp]);
            compId = cResult.insertId;
          }
          // Link
          await connection.query('INSERT IGNORE INTO question_companies (question_id, company_id) VALUES (?, ?)', [questionId, compId]);
        }
      }

      await connection.commit();
      res.status(201).json({ message: 'Question uploaded successfully', id: questionId });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to upload question' });
  }
});

// Get all questions (Admin view)
router.get('/questions', protect, adminOnly, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT q.*, c.name as concept_name
      FROM questions q
      LEFT JOIN concepts c ON q.concept_id = c.id
      ORDER BY q.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch questions' });
  }
});

// Get question by ID (Full Details)
router.get('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    const questionId = req.params.id;
    const [qRows] = await pool.query('SELECT * FROM questions WHERE id = ?', [questionId]);
    if (qRows.length === 0) return res.status(404).json({ message: 'Question not found' });
    
    const question = qRows[0];
    
    const [publicTc] = await pool.query('SELECT input, expected_output FROM public_testcases WHERE question_id = ?', [questionId]);
    const [hiddenTc] = await pool.query('SELECT input, expected_output FROM hidden_testcases WHERE question_id = ?', [questionId]);
    
    const [companies] = await pool.query(`
      SELECT c.name FROM company_tags c
      JOIN question_companies qc ON c.id = qc.company_id
      WHERE qc.question_id = ?
    `, [questionId]);

    res.json({
      ...question,
      public_testcases: publicTc,
      hidden_testcases: hiddenTc,
      companies: companies.map(c => c.name)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch question details' });
  }
});

// Update Question
router.put('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    const questionId = req.params.id;
    const {
      concept_id, title, difficulty, statement, constraints,
      input_format, output_format, examples, hints, editorial, video_solution,
      companies, public_testcases, hidden_testcases, status
    } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Update main question record
      await connection.query(
        `UPDATE questions SET 
          concept_id = ?, title = ?, difficulty = ?, statement = ?, constraints = ?, 
          input_format = ?, output_format = ?, examples = ?, hints = ?, 
          editorial = ?, video_solution = ?, status = ?
         WHERE id = ?`,
        [
          concept_id || null, title, difficulty, statement, constraints, 
          input_format, output_format, JSON.stringify(examples || []), JSON.stringify(hints || []),
          editorial, video_solution, status || 'Active', questionId
        ]
      );

      // 2. Replace Public Test Cases
      await connection.query('DELETE FROM public_testcases WHERE question_id = ?', [questionId]);
      if (public_testcases && public_testcases.length > 0) {
        const ptcValues = public_testcases.map(tc => [questionId, tc.input, tc.expected_output]);
        await connection.query('INSERT INTO public_testcases (question_id, input, expected_output) VALUES ?', [ptcValues]);
      }

      // 3. Replace Hidden Test Cases
      await connection.query('DELETE FROM hidden_testcases WHERE question_id = ?', [questionId]);
      if (hidden_testcases && hidden_testcases.length > 0) {
        const htcValues = hidden_testcases.map(tc => [questionId, tc.input, tc.expected_output]);
        await connection.query('INSERT INTO hidden_testcases (question_id, input, expected_output) VALUES ?', [htcValues]);
      }

      // 4. Update Company Tags
      await connection.query('DELETE FROM question_companies WHERE question_id = ?', [questionId]);
      if (companies && companies.length > 0) {
        for (const comp of companies) {
          let compId;
          const [compRows] = await connection.query('SELECT id FROM company_tags WHERE name = ?', [comp]);
          if (compRows.length > 0) {
            compId = compRows[0].id;
          } else {
            const [cResult] = await connection.query('INSERT INTO company_tags (name) VALUES (?)', [comp]);
            compId = cResult.insertId;
          }
          await connection.query('INSERT IGNORE INTO question_companies (question_id, company_id) VALUES (?, ?)', [questionId, compId]);
        }
      }

      await connection.commit();
      res.json({ message: 'Question updated successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update question' });
  }
});

// Delete Question
router.delete('/questions/:id', protect, adminOnly, async (req, res) => {
  try {
    // ON DELETE CASCADE takes care of related records
    await pool.query('DELETE FROM questions WHERE id = ?', [req.params.id]);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete question' });
  }
});

module.exports = router;
