'use strict';

const express = require('express');
const path = require('path');
const multer = require('multer');
const requireAuth = require('../middleware/auth');
const { UPLOAD_DIR } = require('../config/paths');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safe = Date.now() + '_' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, safe);
  },
});

const ALLOWED = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif'];
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
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Няма файл.' });
    return res.json({ url: '/images/uploads/' + req.file.filename });
  });
});

module.exports = router;
