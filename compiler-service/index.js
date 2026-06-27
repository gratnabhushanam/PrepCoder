require('dotenv').config({ path: '../backend/.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { db } = require('shared');
const { initSubmissionWorker } = require('./queues/submissionQueue');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Attach io to app to access it in routes
app.set('io', io);

const PORT = process.env.PORT || 5002;

app.use(cors());
app.use(express.json());

// Connect to Database
db.connectDB().then(() => console.log('Compiler Service: DB Connected'));

// Mount routes
app.use('/compiler', require('./routes/compiler')); // Mounted at /api/compiler via gateway
app.use('/compiler/admin', require('./routes/adminCompiler')); // Mounted at /api/compiler/admin via gateway
app.use('/coding', require('./routes/coding')); // Mounted at /api/coding via gateway

io.on('connection', (socket) => {
  console.log(`New WebSocket connection: ${socket.id}`);
  
  // Clients will join a room based on submissionId to listen for updates
  socket.on('join_submission', (submissionId) => {
    socket.join(`submission_${submissionId}`);
    console.log(`Socket ${socket.id} joined submission room: ${submissionId}`);
  });

  socket.on('disconnect', () => {
    console.log(`WebSocket disconnected: ${socket.id}`);
  });
});

// Initialize the background worker with access to io
initSubmissionWorker(io);

server.listen(PORT, () => {
  console.log(`Compiler Service (with WebSockets) running on port ${PORT}`);
});
