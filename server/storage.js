import multer from 'multer';
import path from 'path';
import { uploadDir } from './paths.js';

const useBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_READ_WRITE_TOKEN);

function safeName(name) {
  const ext = path.extname(name || '').toLowerCase();
  const base = path.basename(name || 'document', ext)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80) || 'document';
  return `${base}${ext || '.pdf'}`;
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${safeName(file.originalname)}`);
  }
});

export const upload = multer({
  storage: useBlobStorage ? multer.memoryStorage() : diskStorage,
  limits: {
    fileSize: Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024)
  }
});

export async function persistUploadedFile(file) {
  if (!useBlobStorage) {
    return `uploads/${file.filename}`;
  }

  const { put } = await import('@vercel/blob');
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName(file.originalname)}`;
  const blob = await put(`documents/${filename}`, file.buffer, {
    access: 'public',
    contentType: file.mimetype || 'application/pdf'
  });
  return blob.url;
}
