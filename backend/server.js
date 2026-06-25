require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const db = require('./config/db');
const { seedDatabase } = require('./config/seedData');

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));

// Enable CORS securely
app.use(cors({
  origin: true, // Dynamically allow the origin of the request
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Connect to Database and Seed data safely
db.connectDB().then(() => {
  console.log('MongoDB connection initialized.');
  seedDatabase(db).catch(err => console.error('Seeding failed:', err));
}).catch(err => {
  console.error('Failed to connect to MongoDB. Server running in degraded mode:', err);
});

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'running' });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/practice', require('./routes/practice'));
app.use('/api/coding', require('./routes/coding'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/coding', require('./routes/adminCoding'));
// require('./config/redis');
// require('./queues/submissionQueue');
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Base route for server status
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Placement Preparation Platform API is running.',
    mode: 'mongodb'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.message);
  res.status(500).json({
    message: err.message || 'Something went wrong inside the server backend.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Express server running on port http://localhost:${PORT}`);
});
