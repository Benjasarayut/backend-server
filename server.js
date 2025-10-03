const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

/* ---------- SQLite ---------- */
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const DB_PATH = process.env.SQLITE_DB_PATH || '../database/sqlite/wallboard.db';
const resolved = path.resolve(__dirname, DB_PATH);
console.log('📂 Using SQLite DB at:', resolved);

const db = new sqlite3.Database(resolved, (err) => {
  if (err) console.error('❌ SQLite error:', err);
  else console.log('✅ SQLite connected!');
});

// (สร้างตาราง agents ไว้ทดสอบ)
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
});

/* ---------- Health & Root ---------- */
app.get('/', (req, res) => {
  res.json({ success: true, message: 'Backend server is running 🚀' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

/* ---------- Routers ---------- */
const agentsRouter = require('./routes/agents')(db);   // factory function ใช้ SQLite
app.use('/agents', agentsRouter);

const messageRoutes = require('./routes/messages');   // router ธรรมดา ใช้ MongoDB
app.use('/messages', messageRoutes);

/* ---------- 404 & Error Handler ---------- */
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

/* ---------- Start server ---------- */
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
