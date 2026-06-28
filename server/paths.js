import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolveRuntimePath(value, fallback) {
  return path.resolve(value && value.trim() !== '' ? value : fallback);
}

export const dataDir = resolveRuntimePath(process.env.DATA_DIR, __dirname);
export const uploadDir = resolveRuntimePath(process.env.UPLOAD_DIR, path.join(dataDir, 'uploads'));
export const backupsDir = resolveRuntimePath(process.env.BACKUPS_DIR, path.join(dataDir, 'backups'));
export const dbPath = resolveRuntimePath(process.env.DB_PATH, path.join(dataDir, 'utms.db'));

export function ensureRuntimeDirs() {
  if (process.env.VERCEL) {
    return;
  }
  fs.mkdirSync(dataDir, { recursive: true });
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(backupsDir, { recursive: true });
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
