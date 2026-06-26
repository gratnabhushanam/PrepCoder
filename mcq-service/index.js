require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const cors = require('cors');
const { db } = require('shared');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('MCQ Service: DB Connected'));

// Mount routes
app.use('/practice', require('./routes/practice')); // Mounted at /api/practice via gateway
app.use('/dashboard', require('./routes/dashboard')); // Mounted at /api/dashboard via gateway
// Note: if there is an explicit mcq route we can mount it here
// app.use('/mcq', require('./routes/mcq'));

app.listen(PORT, () => {
  console.log(`MCQ Service running on port ${PORT}`);
});
