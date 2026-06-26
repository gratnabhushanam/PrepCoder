require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const cors = require('cors');
const { db } = require('shared');

const app = express();
const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('Compiler Service: DB Connected'));

// Mount routes
app.use('/compiler', require('./routes/compiler')); // Mounted at /api/compiler via gateway
app.use('/coding', require('./routes/coding')); // Mounted at /api/coding via gateway

app.listen(PORT, () => {
  console.log(`Compiler Service running on port ${PORT}`);
});
