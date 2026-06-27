import { dbPath, ensureRuntimeDirs } from './paths.js';

ensureRuntimeDirs();

const postgresUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const dbMode = postgresUrl ? 'postgres' : 'sqlite';

let sqliteDbRaw;
let pgPool;

const fieldMap = {
  fullname: 'fullName',
  tcno: 'tcNo',
  isverified: 'isVerified',
  applicantid: 'applicantId',
  idnumber: 'idNumber',
  targetprogram: 'targetProgram',
  targetsemester: 'targetSemester',
  currentgpa: 'currentGpa',
  sourceuniversity: 'sourceUniversity',
  osympoints: 'osymPoints',
  iscurrentlyenrolled: 'isCurrentlyEnrolled',
  doccheckerstatus: 'docCheckerStatus',
  doccheckererrors: 'docCheckerErrors',
  oidbnotes: 'oidbNotes',
  deannotes: 'deanNotes',
  prepschoolstatus: 'prepSchoolStatus',
  forwardedfaculty: 'forwardedFaculty',
  lasteditedbyid: 'lastEditedById',
  lasteditedat: 'lastEditedAt',
  rankingscore: 'rankingScore',
  applicationid: 'applicationId',
  filesize: 'fileSize',
  uploaddate: 'uploadDate',
  filepath: 'filePath',
  estimatedgpa: 'estimatedGpa'
};

async function getSqliteDb() {
  if (!sqliteDbRaw) {
    const sqlite3 = await import('sqlite3');
    sqliteDbRaw = new sqlite3.default.Database(dbPath);
  }
  return sqliteDbRaw;
}

async function getPgPool() {
  if (!pgPool) {
    const pg = await import('pg');
    pgPool = new pg.default.Pool({
      connectionString: postgresUrl,
      ssl: process.env.POSTGRES_SSL === 'false' ? false : { rejectUnauthorized: false }
    });
  }
  return pgPool;
}

function normalizeRow(row) {
  if (!row) return row;
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    normalized[fieldMap[key] || key] = value;
  }
  return normalized;
}

function normalizeRows(rows) {
  return rows.map(normalizeRow);
}

function replacePlaceholders(sql) {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

function toPostgresSql(sql) {
  const trimmed = sql.trim();
  if (/^PRAGMA\s+/i.test(trimmed)) {
    return null;
  }
  if (/^INSERT OR REPLACE INTO system_config/i.test(trimmed)) {
    return 'INSERT INTO system_config (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value';
  }
  if (/^INSERT OR REPLACE INTO intibak_tables/i.test(trimmed)) {
    return 'INSERT INTO intibak_tables (applicationId, estimatedGpa, rankingScore, courses) VALUES ($1, $2, $3, $4) ON CONFLICT (applicationId) DO UPDATE SET estimatedGpa = EXCLUDED.estimatedGpa, rankingScore = EXCLUDED.rankingScore, courses = EXCLUDED.courses';
  }

  let converted = replacePlaceholders(sql);
  converted = converted.replace(/status != "cancelled"/g, "status != 'cancelled'");
  converted = converted.replace(/role = "applicant"/g, "role = 'applicant'");
  converted = converted.replace(/role = "admin"/g, "role = 'admin'");

  if (/^\s*INSERT\s+INTO\s+(users|applications|documents)\b/i.test(converted) && !/\bRETURNING\b/i.test(converted)) {
    converted += ' RETURNING id';
  }

  return converted;
}

async function sqliteRun(sql, params = []) {
  const dbRaw = await getSqliteDb();
  return new Promise((resolve, reject) => {
    dbRaw.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function sqliteGet(sql, params = []) {
  const dbRaw = await getSqliteDb();
  return new Promise((resolve, reject) => {
    dbRaw.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function sqliteAll(sql, params = []) {
  const dbRaw = await getSqliteDb();
  return new Promise((resolve, reject) => {
    dbRaw.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function sqliteExec(sql) {
  const dbRaw = await getSqliteDb();
  return new Promise((resolve, reject) => {
    dbRaw.exec(sql, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function postgresRun(sql, params = []) {
  const converted = toPostgresSql(sql);
  if (!converted) return { lastID: undefined, changes: 0 };
  const pool = await getPgPool();
  const result = await pool.query(converted, params);
  return { lastID: result.rows?.[0]?.id, changes: result.rowCount };
}

async function postgresGet(sql, params = []) {
  const converted = toPostgresSql(sql);
  if (!converted) return undefined;
  const pool = await getPgPool();
  const result = await pool.query(converted, params);
  return normalizeRow(result.rows[0]);
}

async function postgresAll(sql, params = []) {
  const converted = toPostgresSql(sql);
  if (!converted) return [];
  const pool = await getPgPool();
  const result = await pool.query(converted, params);
  return normalizeRows(result.rows);
}

async function postgresExec(sql) {
  const converted = toPostgresSql(sql);
  if (!converted) return;
  const pool = await getPgPool();
  await pool.query(converted);
}

export const db = {
  run: (sql, params = []) => dbMode === 'postgres' ? postgresRun(sql, params) : sqliteRun(sql, params),
  get: (sql, params = []) => dbMode === 'postgres' ? postgresGet(sql, params) : sqliteGet(sql, params),
  all: (sql, params = []) => dbMode === 'postgres' ? postgresAll(sql, params) : sqliteAll(sql, params),
  exec: (sql) => dbMode === 'postgres' ? postgresExec(sql) : sqliteExec(sql)
};

async function initSqliteDb() {
  await db.run('PRAGMA foreign_keys = ON');

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      fullName TEXT NOT NULL,
      phone TEXT,
      tcNo TEXT,
      department TEXT,
      isVerified INTEGER DEFAULT 0
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

async function initPostgresDb() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      fullName TEXT NOT NULL,
      phone TEXT,
      tcNo TEXT,
      department TEXT,
      isVerified INTEGER DEFAULT 0
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id SERIAL PRIMARY KEY,
      applicantId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      fullName TEXT NOT NULL,
      idNumber TEXT NOT NULL,
      targetProgram TEXT NOT NULL,
      targetSemester TEXT NOT NULL,
      currentGpa REAL NOT NULL,
      sourceUniversity TEXT NOT NULL,
      osymPoints REAL NOT NULL,
      isCurrentlyEnrolled INTEGER NOT NULL,
      status TEXT NOT NULL,
      docCheckerStatus TEXT NOT NULL,
      docCheckerErrors TEXT,
      oidbNotes TEXT,
      deanNotes TEXT,
      prepSchoolStatus TEXT,
      forwardedFaculty TEXT,
      lastEditedById INTEGER,
      lastEditedAt TEXT,
      rankingScore REAL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id SERIAL PRIMARY KEY,
      applicationId INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
      slot INTEGER NOT NULL,
      filename TEXT NOT NULL,
      fileSize TEXT NOT NULL,
      uploadDate TEXT NOT NULL,
      filePath TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS intibak_tables (
      applicationId INTEGER PRIMARY KEY REFERENCES applications(id) ON DELETE CASCADE,
      estimatedGpa REAL NOT NULL,
      rankingScore REAL NOT NULL,
      courses TEXT NOT NULL
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

export async function initDb() {
  if (dbMode === 'postgres') {
    await initPostgresDb();
  } else {
    await initSqliteDb();
  }
}

export async function syncSequences() {
  if (dbMode !== 'postgres') return;

  await db.exec(`
    SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true);
    SELECT setval(pg_get_serial_sequence('applications', 'id'), COALESCE((SELECT MAX(id) FROM applications), 1), true);
    SELECT setval(pg_get_serial_sequence('documents', 'id'), COALESCE((SELECT MAX(id) FROM documents), 1), true);
  `);
}
