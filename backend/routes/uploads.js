'use strict';

const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const requireAuth = require('../middleware/auth');
const { UPLOAD_DIR } = require('../config/paths');

const router = express.Router();

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];

// Clean the token: strip surrounding quotes, whitespace and an accidental
// "BLOB_READ_WRITE_TOKEN=" prefix (common copy-paste mistakes).
function cleanToken(raw) {
  return String(raw || '')
    .trim()
    .replace(/^BLOB_READ_WRITE_TOKEN\s*=\s*/i, '')
    .replace(/^["']|["']$/g, '')
    .trim();
}
const BLOB_TOKEN = cleanToken(process.env.BLOB_READ_WRITE_TOKEN);

// When a Blob store is connected we keep the file in memory and push it to Blob
// storage — the disk is read-only there. Otherwise (local / server with a disk)
// we write to UPLOAD_DIR as before.
const USE_BLOB = !!BLOB_TOKEN;

const storage = USE_BLOB
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext);
      },
    });

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 }, // 6 MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.includes(ext)) return cb(new Error('Неподдържан тип файл.'));
    cb(null, true);
  },
});

// Admin: upload one image, return its public URL.
router.post('/', requireAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Няма файл.' });

    try {
      if (USE_BLOB) {
        // Safe diagnostic (no secret leaked): confirms the token's shape.
        console.log(
          `Blob upload: tokenLen=${BLOB_TOKEN.length} startsOk=${BLOB_TOKEN.startsWith('vercel_blob_rw_')} fileKB=${Math.round((req.file.size || 0) / 1024)}`
        );
        // Lazy-require so local installs without the package still work.
        const { put } = require('@vercel/blob');
        const ext = path.extname(req.file.originalname).toLowerCase() || '.jpg';
        const name = 'uploads/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext;
        const blob = await put(name, req.file.buffer, {
          access: 'public',
          contentType: req.file.mimetype,
          token: BLOB_TOKEN,
        });
        return res.json({ url: blob.url });
      }
      // Disk mode: ensure dir exists, file already written by multer.
      if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      return res.json({ url: '/images/uploads/' + req.file.filename });
    } catch (e) {
      console.error('Upload error:', e);
      return res.status(500).json({ error: 'Качването се провали: ' + (e && e.message ? e.message : 'неизвестна грешка') });
    }
  });
});

module.exports = router;
