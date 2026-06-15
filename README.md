# Дентални клиники MNL — Full-Stack Website

Production-ready website for a dental clinic in Младост 4, София: a Bulgarian marketing site,
an Express REST API, a database, a JWT-protected admin panel, interactive front-end tools, and
booking with email notifications.

Built with **Node.js + Express + Sequelize** and **vanilla HTML/CSS/JS**. Ships with **SQLite** for
zero-install local development and switches to **PostgreSQL** for production via one env var.

---

## ✨ Features

- **Marketing site** — hero, animated trust counters, dynamic services grid, why-us, team, gallery
  lightbox, reviews carousel, FAQ, footer; AOS animations, scroll progress, cookie banner, SEO +
  Schema.org JSON-LD.
- **Interactive tools** — FDI tooth chart (hover/click → treatment + booking), Smile Score calculator,
  live price calculator.
- **3-step booking form** → `POST /api/appointments` → saves to DB + emails clinic & patient.
- **Admin panel** (`/admin`) — JWT login, appointments (filter/confirm/cancel/CSV export), services
  CRUD, reviews add/toggle, site settings, dashboard stats with a CSS bar chart.
- **Security** — bcrypt password hashing, JWT in an HTTP-only cookie, Helmet, CORS, rate limiting,
  express-validator input validation, `/admin` disallowed in `robots.txt`.

---

## 🚀 Quick start (local)

```bash
# 1. Install dependencies
npm install

# 2. Create the database, tables and seed data (services, reviews, settings, admin)
npm run seed

# 3. Start the server
npm start
```

Then open:

- **Site:**  http://localhost:3100
- **Admin:** http://localhost:3100/admin

> The default port is **3100** (set in `backend/.env`). Change `PORT` there if needed.

**Default admin login** (from `backend/.env`): `admin` / `admin123` — change `ADMIN_PASSWORD`
before deploying and re-run `npm run seed`.

### Email in development
No SMTP credentials are required. Booking emails are sent through a **dev Ethereal inbox** — the
server console prints a **preview URL** for each message. Configure `SMTP_*` in `.env` to send real
email.

### Regenerating placeholder images
The 6 clinic photos are placeholder SVGs in `frontend/images/`. Replace them with real photos
(keep the filenames, or update the `src` paths in `index.html`). To regenerate the placeholders:

```bash
node backend/scripts/gen-placeholders.js
```

---

## ⚙️ Environment variables (`backend/.env`)

| Key | Purpose |
| --- | --- |
| `PORT` | Server port (default 3100) |
| `JWT_SECRET` | Secret for signing admin session tokens |
| `DB_DIALECT` | `sqlite` (default) or `postgres` |
| `DATABASE_URL` | Postgres connection string (when `DB_DIALECT=postgres`) |
| `SMTP_HOST/PORT/USER/PASS` | Real SMTP; leave empty for dev Ethereal |
| `ADMIN_EMAIL` | Where new-booking notifications are sent |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seeded admin account |

Copy `backend/.env.example` to `backend/.env` and fill it in.

---

## 🗄️ API

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/appointments` | public (validated, rate-limited) |
| `GET/PATCH/DELETE` | `/api/appointments[/:id]` | admin |
| `GET` | `/api/services` · `POST/PUT/DELETE` | public / admin |
| `GET` | `/api/reviews` · `GET /all` `POST` `PATCH /:id/toggle` | public / admin |
| `GET` | `/api/settings` · `PUT` | public / admin |
| `GET` | `/api/stats` | admin |
| `POST` | `/api/auth/login` · `/logout` · `GET /me` | — |

---

## 🐘 Switching to PostgreSQL (production)

1. Provision a Postgres database and set in `.env`:
   ```
   DB_DIALECT=postgres
   DATABASE_URL=postgresql://user:pass@host:5432/mnl_dental
   NODE_ENV=production
   ```
2. `npm run seed` then `npm start`. Sequelize creates the same schema on Postgres — no code changes.

### Deploy notes
- Run Node behind **Nginx** as a reverse proxy; manage the process with **PM2**.
- Issue TLS with **Certbot** (`certbot --nginx -d mnl-dental.bg -d www.mnl-dental.bg`).
- Set a strong `JWT_SECRET` and real `SMTP_*`; `NODE_ENV=production` makes the auth cookie `Secure`.
- Optionally containerize (Node app + Postgres) with Docker Compose.

---

## 📁 Structure

```
backend/   Express API, Sequelize models, routes/controllers/middleware, mailer, seed
frontend/  index.html, admin.html, css/, js/ (main, tooth-chart, smile-score, price-calc, booking, admin), images/
```

---

© Дентални клиники MNL · Младост 4, София · 089 728 8776
