require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const cors = require('cors');
const { db } = require('shared');

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('ATS Service: DB Connected'));

// Mount routes
app.use('/', require('./routes/ats')); // Mounted at /api/ats via gateway

app.listen(PORT, () => {
  console.log(`ATS Service running on port ${PORT}`);
});
