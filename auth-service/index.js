require('dotenv').config({ path: '../backend/.env' }); // For local testing, use the shared .env
const express = require('express');
const cors = require('cors');
const { db } = require('shared');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('Auth Service: DB Connected'));

// Mount auth routes
app.use('/', require('./routes/auth')); // Mounted at /api/auth via gateway

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});
