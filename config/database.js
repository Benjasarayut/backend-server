const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const path = require('path');

const SQLITE_DB_PATH = process.env.SQLITE_DB_PATH || '../database/sqlite/wallboard.db';

function initSQLite() {
  return new Promise((resolve, reject) => {
    const dbPath = path.resolve(__dirname, SQLITE_DB_PATH);
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ SQLite connection error:', err.message);
        reject(err);
      } else {
        console.log('✅ Connected to SQLite');
        console.log('📁 SQLite path:', dbPath);
        resolve();
      }
      db.close();
    });
  });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallboard';

async function connectMongoDB() {
  const maxRetries = 5;
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log('✅ Connected to MongoDB');
      return;
    } catch (e) {
      attempt++;
      console.error(`❌ MongoDB connect failed (${attempt}/${maxRetries}):`, e.message);
      if (attempt >= maxRetries) throw e;
      await new Promise(r => setTimeout(r, Math.min(1000 * 2 ** attempt, 10000)));
    }
  }
}

mongoose.connection.on('connected', () => console.log('📊 Mongoose connected'));
mongoose.connection.on('error', (err) => console.error('❌ Mongoose error:', err.message));
mongoose.connection.on('disconnected', () => console.log('⚠️  Mongoose disconnected'));

process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed');
  process.exit(0);
});

module.exports = { initSQLite, connectMongoDB };
