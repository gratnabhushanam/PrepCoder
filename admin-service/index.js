require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const cors = require('cors');
const { db } = require('shared');

const app = express();
const PORT = process.env.PORT || 5007;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('Admin Service: DB Connected'));

// Mount routes
app.use('/', require('./routes/admin')); // Mounted at /api/admin via gateway
app.use('/coding', require('./routes/adminCoding')); // Optionally mounted at /api/admin/coding via gateway if needed

app.listen(PORT, () => {
  console.log(`Admin Service running on port ${PORT}`);
});
