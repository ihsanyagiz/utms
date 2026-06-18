import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'utms.db');
const dbRaw = new sqlite3.Database(dbPath);

// Wrap SQLite methods in Promises
export const db = {
  run: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbRaw.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },
  get: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbRaw.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all: (sql, params = []) => {
    return new Promise((resolve, reject) => {
      dbRaw.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },
  exec: (sql) => {
    return new Promise((resolve, reject) => {
      dbRaw.exec(sql, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
};

// Initialize DB schema
export async function initDb() {
  // Enable foreign keys
  await db.run('PRAGMA foreign_keys = ON');

  // Users Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      fullName TEXT NOT NULL,
      phone TEXT,
      tcNo TEXT,
      department TEXT
    )
  `);

  // Applications Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicantId INTEGER NOT NULL,
      fullName TEXT NOT NULL,
      idNumber TEXT NOT NULL,
      targetProgram TEXT NOT NULL,
      targetSemester TEXT NOT NULL,
      currentGpa REAL NOT NULL,
      sourceUniversity TEXT NOT NULL,
      osymPoints REAL NOT NULL,
      isCurrentlyEnrolled INTEGER NOT NULL, -- 0 for false, 1 for true
      status TEXT NOT NULL,
      docCheckerStatus TEXT NOT NULL,
      docCheckerErrors TEXT, -- JSON string
      oidbNotes TEXT,
      deanNotes TEXT,
      prepSchoolStatus TEXT,
      forwardedFaculty TEXT,
      lastEditedById INTEGER,
      lastEditedAt TEXT,
      rankingScore REAL,
      FOREIGN KEY (applicantId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Documents Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      applicationId INTEGER NOT NULL,
      slot INTEGER NOT NULL,
      filename TEXT NOT NULL,
      fileSize TEXT NOT NULL,
      uploadDate TEXT NOT NULL,
      filePath TEXT NOT NULL,
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
    )
  `);

  // Intibak Tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS intibak_tables (
      applicationId INTEGER PRIMARY KEY,
      estimatedGpa REAL NOT NULL,
      rankingScore REAL NOT NULL,
      courses TEXT NOT NULL, -- JSON string
      FOREIGN KEY (applicationId) REFERENCES applications(id) ON DELETE CASCADE
    )
  `);

  // System Config Table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}
