require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const cors = require('cors');
const { db } = require('shared');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('Interview Service: DB Connected'));

// Mount routes
app.use('/', require('./routes/ai')); // Mounted at /api/ai via gateway

app.listen(PORT, () => {
  console.log(`Interview Service running on port ${PORT}`);
});
