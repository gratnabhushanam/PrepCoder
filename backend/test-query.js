const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
    const userId = 1;
    const [totalSubs] = await pool.query('SELECT COUNT(*) as total, SUM(CASE WHEN status = "Accepted" THEN 1 ELSE 0 END) as accepted FROM submissions WHERE user_id = ?', [userId]);
    const totalSubmissionsCount = totalSubs[0].total ? Number(totalSubs[0].total) : 0;
    const acceptedCount = totalSubs[0].accepted ? Number(totalSubs[0].accepted) : 0;
    console.log({ totalSubmissionsCount, acceptedCount });
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
}
run();
