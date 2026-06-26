const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(morgan('dev'));

// Define the proxy targets mapping
const services = {
  auth: 'http://localhost:5001',
  compiler: 'http://localhost:5002',
  mcq: 'http://localhost:5003',
  interview: 'http://localhost:5004',
  ats: 'http://localhost:5005',
  contest: 'http://localhost:5006',
  admin: 'http://localhost:5007',
};

// Route proxies
app.use('/api/auth', createProxyMiddleware({ target: services.auth, changeOrigin: true }));

app.use('/api/compiler', createProxyMiddleware({ target: services.compiler, changeOrigin: true }));
app.use('/api/coding', createProxyMiddleware({ target: services.compiler, changeOrigin: true }));

app.use('/api/practice', createProxyMiddleware({ target: services.mcq, changeOrigin: true }));
app.use('/api/mcq', createProxyMiddleware({ target: services.mcq, changeOrigin: true }));
app.use('/api/dashboard', createProxyMiddleware({ target: services.mcq, changeOrigin: true }));

app.use('/api/ai', createProxyMiddleware({ target: services.interview, changeOrigin: true }));

app.use('/api/ats', createProxyMiddleware({ target: services.ats, changeOrigin: true }));

app.use('/api/contest', createProxyMiddleware({ target: services.contest, changeOrigin: true }));
app.use('/api/leaderboard', createProxyMiddleware({ target: services.contest, changeOrigin: true }));

app.use('/api/admin', createProxyMiddleware({ target: services.admin, changeOrigin: true }));

app.get('/', (req, res) => {
  res.json({ status: 'online', service: 'API Gateway', message: 'All systems operational' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'running' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port http://localhost:${PORT}`);
});
