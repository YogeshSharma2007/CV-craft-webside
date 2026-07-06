import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
// import crypto from 'crypto'; // removed unused import

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'cvcraft.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    two_fa_enabled INTEGER NOT NULL DEFAULT 0,
    two_fa_secret TEXT,
    two_fa_expires_at TEXT,
    last_login_at TEXT,
    last_login_ip TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cv_data (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT NOT NULL,
    bio TEXT NOT NULL,
    photo_url TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    skills TEXT, -- JSON array of skills
    projects TEXT, -- JSON array of projects
    experience TEXT, -- JSON array of experience
    education TEXT, -- JSON array of education
    share_token TEXT UNIQUE,
    share_enabled INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS share_views (
    id TEXT PRIMARY KEY,
    cv_id TEXT NOT NULL,
    viewed_at TEXT NOT NULL DEFAULT (datetime('now')),
    ip_address TEXT NOT NULL,
    FOREIGN KEY(cv_id) REFERENCES cv_data(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS login_alerts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    alerted_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_new_device INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

// Seed Admin Credentials if table is empty
const seedAdmin = () => {
  const adminCheck = db.prepare('SELECT COUNT(*) as count FROM admins').get();
  if (adminCheck.count === 0) {
    const adminId = 'admin-' + Math.random().toString(36).substr(2, 9);
    const adminUsername = process.env.ADMIN_USERNAME || 'Vijay_@_2007';
    const adminPasswordRaw = process.env.ADMIN_PASSWORD || 'Vijay_@_pal';
    const hashedPassword = bcrypt.hashSync(adminPasswordRaw, 12);
    
    db.prepare('INSERT INTO admins (id, username, password) VALUES (?, ?, ?)').run(
      adminId,
      adminUsername,
      hashedPassword
    );
    console.log(`[Database] Pre-seeded admin user: ${adminUsername}`);
  }
};

seedAdmin();

export default db;
