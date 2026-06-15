'use strict';

// ─────────────────────────────────────────────────────────────
// Centralised persistent paths.
//
// In production (Railway) set DATA_DIR to the mounted Volume, e.g. "/data".
// Then BOTH the SQLite database and the uploaded images live on that Volume,
// so they survive restarts and redeploys.
//
// Locally (DATA_DIR unset) we keep the original layout so existing dev data
// and images keep working without changes.
// ─────────────────────────────────────────────────────────────

const path = require('path');
const fs = require('fs');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data');

const UPLOAD_DIR = process.env.DATA_DIR
  ? path.join(DATA_DIR, 'uploads')
  : path.join(__dirname, '..', '..', 'frontend', 'images', 'uploads');

function ensure(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensure(DATA_DIR);
ensure(UPLOAD_DIR);

module.exports = { DATA_DIR, UPLOAD_DIR };
