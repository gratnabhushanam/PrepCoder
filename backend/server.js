require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const db = require('./config/db');
const { seedDatabase } = require('./config/seedData');

const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
app.set('io', io);

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
app.use('/api/admin', require('./routes/admin'));
app.use('/api/admin/cms', require('./routes/adminCms'));
app.use('/api/admin/coding', require('./routes/adminCoding'));
app.use('/api/compiler', require('./routes/compiler'));
// require('./config/redis');
const { submissionWorker } = require('./queues/submissionQueue');
if (typeof submissionWorker === 'function') {
  submissionWorker(io);
}
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

io.on('connection', (socket) => {
  socket.on('join_submission', (submissionId) => {
    socket.join(`submission_${submissionId}`);
  });
});

// Start Server
server.listen(PORT, () => {
  console.log(`🚀 Express server running on port http://localhost:${PORT}`);
});
