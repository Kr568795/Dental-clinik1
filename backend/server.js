'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const fsp = require('fs').promises;
const { sequelize, Setting } = require('./models');
const { UPLOAD_DIR } = require('./config/paths');
const { seedIfEmpty, counts } = require('./scripts/seed-core');

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');

app.disable('x-powered-by');

// Behind Vercel's proxy: trust the first proxy so req.ip / X-Forwarded-For are
// read correctly (fixes express-rate-limit's ValidationError on serverless).
app.set('trust proxy', 1);

// ── Security headers (Helmet + Content-Security-Policy) ──
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'", 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://unpkg.com', 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
        'font-src': ["'self'", 'data:', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com'],
        'img-src': ["'self'", 'data:', 'https:'],
        'frame-src': ['https://www.google.com', 'https://maps.google.com'],
        'connect-src': ["'self'"],
        'object-src': ["'none'"],
        'base-uri': ["'self'"],
        'form-action': ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── General API rate limit (defence in depth) ───────────
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Твърде много заявки. Опитайте по-късно.' },
}));

// ── Server-side admin gate ──────────────────────────────
// The dashboard HTML is NEVER served without a valid JWT session, so it cannot
// be revealed via dev-tools / direct URL. Unauthenticated visitors get the
// lightweight login page instead.
function isAdminAuthed(req) {
  const token = req.cookies && req.cookies.token;
  if (!token) return false;
  try { jwt.verify(token, process.env.JWT_SECRET); return true; }
  catch { return false; }
}
app.get(['/admin/login', '/admin-login.html'], (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(FRONTEND_DIR, 'admin-login.html'));
});
app.get(['/admin', '/admin.html'], (req, res) => {
  if (!isAdminAuthed(req)) return res.redirect('/admin/login');
  res.set('Cache-Control', 'no-store');
  res.sendFile(path.join(FRONTEND_DIR, 'admin.html'));
});

// ── Lazy DB init (works for both long-running and serverless) ──
// On Vercel each cold start must connect (and on a fresh DB, seed) before the
// first API request. The promise is cached so it runs at most once per instance.
let _dbInit = null;
function ensureDb() {
  if (!_dbInit) {
    _dbInit = (async () => {
      await sequelize.authenticate();
      const seeded = await seedIfEmpty();
      if (seeded) console.log(`🌱  Празна база — заредени ${counts.services} услуги, настройки и начален admin.`);
    })().catch((err) => { _dbInit = null; throw err; });
  }
  return _dbInit;
}
app.use('/api', async (req, res, next) => {
  try { await ensureDb(); next(); } catch (e) { next(e); }
});

// ── API routes ──────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/services', require('./routes/services'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/stats', require('./routes/stats'));
app.use('/api/uploads', require('./routes/uploads'));

const collections = require('./routes/collections');
app.use('/api/team', collections.team);
app.use('/api/gallery', collections.gallery);
app.use('/api/faq', collections.faq);
app.use('/api/why', collections.why);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Server-side settings injection (no flash of old content) ────
// We bake the saved images/text into the HTML before sending it, so the FIRST
// paint already shows the correct content — no waiting for the client to fetch
// /api/settings (which is slow on a serverless cold start).
const _htmlCache = {};
async function readPage(fileName) {
  if (!_htmlCache[fileName]) {
    _htmlCache[fileName] = await fsp.readFile(path.join(FRONTEND_DIR, fileName), 'utf8');
  }
  return _htmlCache[fileName];
}

const settingsCache = require('./utils/settingsCache');
async function getSettingsCached() {
  const cached = settingsCache.get();
  if (cached) return cached;
  const rows = await Setting.findAll();
  const obj = {};
  rows.forEach((r) => { obj[r.key] = r.value; });
  settingsCache.set(obj);
  return obj;
}

function absUrl(u, baseUrl) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u; // already absolute (e.g. Blob URL)
  return baseUrl + (u.startsWith('/') ? u : '/' + u);
}

function injectSettings(html, settings, baseUrl) {
  // Rewrite <img data-img="KEY" src="..."> so the saved image is there at load.
  html = html.replace(/<img\b[^>]*>/g, (tag) => {
    const m = tag.match(/data-img="([^"]+)"/);
    if (!m || !settings[m[1]]) return tag;
    const val = settings[m[1]];
    return /\bsrc="[^"]*"/.test(tag)
      ? tag.replace(/\bsrc="[^"]*"/, `src="${val}"`)
      : tag.replace(/<img\b/, `<img src="${val}"`);
  });
  // Social share image (og:image / twitter:image): use the admin-set image when
  // present, and ALWAYS make it an absolute URL so previews load everywhere.
  const ogReplacer = (full, pre, cur, post) =>
    pre + absUrl(settings.og_image || cur, baseUrl) + post;
  html = html.replace(/(<meta\s+property="og:image"\s+content=")([^"]*)(")/i, ogReplacer);
  html = html.replace(/(<meta\s+name="twitter:image"\s+content=")([^"]*)(")/i, ogReplacer);
  // Inline the settings so the client applies text/content instantly too.
  const json = JSON.stringify(settings).replace(/</g, '\\u003c');
  const scriptTag = `<script>window.__MNL_SETTINGS__=${json};</script>`;
  return html.includes('</head>') ? html.replace('</head>', scriptTag + '</head>') : scriptTag + html;
}

async function servePage(req, res, fileName) {
  try {
    const [html, settings] = await Promise.all([readPage(fileName), getSettingsCached()]);
    const proto = (req.headers['x-forwarded-proto'] || req.protocol || 'https').split(',')[0];
    const baseUrl = `${proto}://${req.headers.host}`;
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.set('Cache-Control', 'no-cache');
    return res.send(injectSettings(html, settings, baseUrl));
  } catch (e) {
    console.error('Page render error:', e);
    return res.sendFile(path.join(FRONTEND_DIR, fileName));
  }
}

// ── Static frontend ─────────────────────────────────────
// Clean URLs for the public pages (with settings injected).
const PAGES = {
  '/services': 'services.html',
  '/about': 'about.html',
  '/team': 'team.html',
  '/gallery': 'gallery.html',
  '/contact': 'contact.html',
};
Object.entries(PAGES).forEach(([route, file]) => {
  app.get(route, (req, res) => servePage(req, res, file));
});

// Uploaded images live on the persistent Volume (outside the repo in
// production), so serve them explicitly BEFORE the general static handler.
app.use('/images/uploads', express.static(UPLOAD_DIR));

// admin.html is intentionally NOT auto-served here — it is gated above.
app.use(express.static(FRONTEND_DIR, { index: false }));
app.get('/', (req, res) => servePage(req, res, 'index.html'));

// ── Error handler ───────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Възникна вътрешна грешка.' });
});

// ── Boot ────────────────────────────────────────────────
// When run directly (local / a normal server) we connect, seed if needed, then
// listen. On Vercel this file is imported by api/index.js as a serverless
// handler, so it only EXPORTS the app — there is no app.listen() there, and the
// DB is initialised lazily on the first /api request (see ensureDb above).
if (require.main === module) {
  ensureDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`\n🦷  Дентални клиники MNL стартира на порт ${PORT}`);
        console.log(`    Admin панел: /admin`);
        console.log(`    DB dialect: ${process.env.DB_DIALECT || 'sqlite'}\n`);
      });
    })
    .catch((err) => {
      console.error('Неуспешно стартиране:', err);
      process.exit(1);
    });
}

module.exports = app;
