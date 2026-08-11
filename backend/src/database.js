const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'forshe.db');
const db = new DatabaseSync(DB_PATH);

// Performance pragmas
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA synchronous = NORMAL');

// ─── Schema ───────────────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    username   TEXT    NOT NULL UNIQUE,
    password   TEXT    NOT NULL,
    created_at TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id  INTEGER NOT NULL,
    content    TEXT,
    type       TEXT    NOT NULL DEFAULT 'text',
    image_url  TEXT    DEFAULT NULL,
    created_at TEXT    DEFAULT (datetime('now')),
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );
`);

// ─── Seed the two permanent accounts ─────────────────────────────────────────
const ALLOWED_USERS = [
  { username: 'vinoth',   password: process.env.VINOTH_PASSWORD   || 'Vinoth@123'   },
  { username: 'ishwarya', password: process.env.ISHWARYA_PASSWORD || 'Ishwarya@123' },
];

async function seedUsers() {
  const checkStmt  = db.prepare('SELECT id FROM users WHERE username = ?');
  const insertStmt = db.prepare('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)');

  for (const user of ALLOWED_USERS) {
    const existing = checkStmt.get(user.username);
    if (!existing) {
      const hash = await bcrypt.hash(user.password, 12);
      insertStmt.run(user.username, hash);
      console.log(`✅  Created user: ${user.username}`);
    }
  }
}

seedUsers().catch(console.error);

// ─── Prepared statements ──────────────────────────────────────────────────────
const queries = {
  getUserByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),

  getUserById: db.prepare(
    'SELECT id, username, created_at FROM users WHERE id = ?'
  ),

  getMessages: db.prepare(`
    SELECT
      m.id,
      m.content,
      m.type,
      m.image_url,
      m.created_at,
      u.id       AS sender_id,
      u.username AS sender_username
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    ORDER BY m.created_at ASC
    LIMIT ?
  `),

  insertMessage: db.prepare(`
    INSERT INTO messages (sender_id, content, type, image_url)
    VALUES (?, ?, ?, ?)
  `),

  getMessageById: db.prepare(`
    SELECT
      m.id,
      m.content,
      m.type,
      m.image_url,
      m.created_at,
      u.id       AS sender_id,
      u.username AS sender_username
    FROM messages m
    JOIN users u ON u.id = m.sender_id
    WHERE m.id = ?
  `),
};

module.exports = { db, queries };
