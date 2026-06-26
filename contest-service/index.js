require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const cors = require('cors');
const { db } = require('shared');

const app = express();
const PORT = process.env.PORT || 5006;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('Contest Service: DB Connected'));

// Mount routes
app.use('/leaderboard', require('./routes/leaderboard')); // Mounted at /api/leaderboard via gateway
// app.use('/contest', require('./routes/contest'));

app.listen(PORT, () => {
  console.log(`Contest Service running on port ${PORT}`);
});
