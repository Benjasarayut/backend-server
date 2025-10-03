// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

// --- SQLite ping (ไม่ปิดโปรเซส) ---
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = process.env.SQLITE_DB_PATH || '../database/sqlite/wallboard.db';
const resolved = path.resolve(__dirname, DB_PATH);
console.log('📂 Using SQLite DB at:', resolved);
const db = new sqlite3.Database(resolved, (err) => {
  if (err) {
    console.error('❌ SQLite error:', err);
  } else {
    console.log('✅ SQLite connected!');
  }
});

// health route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Route not found' }));

// start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
