require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const authRouter = require('./routes/auth');
const messagesRouter = require('./routes/messages');
const { registerSocketHandlers, getOnlineUsers } = require('./socket/handlers');

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 4000;
// Allow multiple origins: local dev + GitHub Pages
const ALLOWED_ORIGINS = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow images from /uploads
  })
);

// ─── CORS ─────────────────────────────────────────────────────────────────────
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/messages', messagesRouter);

// Online users endpoint
app.get('/api/online', (_req, res) => {
  res.json({ onlineUsers: getOnlineUsers() });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

registerSocketHandlers(io);

// ─── Start server ─────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🚀  ForShe backend running on http://localhost:${PORT}`);
  console.log(`📡  Socket.IO ready`);
  console.log(`🔒  CORS allowed for: ${ALLOWED_ORIGINS.join(', ')}\n`);
});