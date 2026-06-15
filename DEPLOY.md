# 🚀 Деплой на Vercel (с постоянно съхранение)

Vercel няма постоянен диск, затова — за да се пази **всичко** след рестарт —
ползваме две външни услуги (и двете с безплатен план):

| Какво | Услуга | Защо |
|---|---|---|
| **База данни** | **Neon / Vercel Postgres** | SQLite файл не оцелява на Vercel |
| **Качени снимки** | **Vercel Blob** | Дискът на Vercel е „read-only" |

> Кодът вече е подготвен: разпознава Postgres автоматично (щом има connection
> string) и качва снимки в Blob, щом е наличен `BLOB_READ_WRITE_TOKEN`. При
> първо стартиране на празна база началните данни се зареждат сами.

---

## 0. Какво ти трябва
- GitHub акаунт (вече имаш repo `Dental-clinik1`)
- Безплатен **Vercel** акаунт (vercel.com — вход с GitHub)

---

## 1. Импортирай проекта във Vercel
1. Влез във **vercel.com** → **Add New… → Project**.
2. Избери GitHub repo **Dental-clinik1** → **Import**.
3. Framework Preset: остави **Other**. Root directory: остави празно (коренът).
4. **НЕ** деплойвай още — първо добави базата и Blob (стъпки 2–3). Може и да
   деплойнеш, ще гръмне без база — после ще редеплойнеш.

---

## 2. Добави Postgres база (Storage)
1. В проекта → таб **Storage** → **Create Database** → **Postgres** (Neon).
2. Избери регион (напр. Frankfurt) → **Create**.
3. Свържи я с проекта (**Connect Project**) — Vercel сам добавя променливите
   `POSTGRES_URL`, `DATABASE_URL` и т.н. в Environment Variables.

> Кодът чете автоматично `DATABASE_URL` / `POSTGRES_URL` — не пипаш нищо.

---

## 3. Добави Blob хранилище за снимките
1. Таб **Storage** → **Create** → **Blob** → дай име → **Create**.
2. **Connect Project** — Vercel добавя `BLOB_READ_WRITE_TOKEN` автоматично.

> Щом този токен е наличен, качените от админ снимки отиват в Blob и се пазят.

---

## 4. Добави останалите Environment Variables
Проект → **Settings → Environment Variables** → добави (за **Production**):

```
JWT_SECRET=<дълъг_случаен_низ>
JWT_EXPIRES_IN=7d
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<силна_парола>

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=твой@gmail.com
SMTP_PASS=app-парола-от-gmail
ADMIN_EMAIL=където@да-идват-заявките.bg
MAIL_FROM=Дентални клиники MNL <no-reply@твой-домейн.bg>
```

⚠️ Бележки:
- `JWT_SECRET` генерирай с:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Смени `ADMIN_PASSWORD` (да не е `admin123`).
- `PORT`, `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `NODE_ENV` — **не** ги пипай,
  Vercel ги управлява сам.
- За Gmail SMTP трябва **App Password** (Google акаунт → Security → 2-Step
  Verification → App passwords).

---

## 5. Деплой
1. Таб **Deployments** → **Redeploy** (или направи `git push` — деплойва се само).
2. Изчакай build-а. Получаваш адрес тип `dental-clinik1.vercel.app` с HTTPS.
3. Отвори адреса — при първото зареждане базата се напълва автоматично.
4. Админ панел: `https://адресът/admin` (вход с `ADMIN_USERNAME` / `ADMIN_PASSWORD`).

---

## 6. Проверка, че всичко се пази
1. Влез в админ → смени текст / качи снимка → запазва се веднага (в Postgres + Blob).
2. Vercel → **Redeploy** (или само изчакай ново зареждане на функцията).
3. Отвори сайта пак — промените и снимките са на място. ✅

---

## 7. (По избор) Собствен домейн
Project → **Settings → Domains** → добави домейна си → настрой DNS записите,
които Vercel показва. SSL е автоматичен.

---

## Полезно да знаеш
- **Ежедневните промени** (текст, снимки, цени, заявки) се правят от админ —
  на живо, без деплой.
- **Промени по кода** → `git push` → Vercel редеплойва автоматично. Базата и
  снимките (Postgres + Blob) не се пипат.
- **`npm run seed` НЕ го пускай** срещу production базата — трие всичко.
  Първоначалните данни се зареждат сами при празна база.
- **Бекъп:** Neon/Vercel Postgres има вграден бекъп; Blob файловете остават
  трайни.

---

## Локална разработка (без промяна)
Локално нищо не се променя — без `DATABASE_URL` кодът ползва SQLite файл, а
снимките се пишат на диска:

```powershell
npm install
npm run seed   # само първия път локално
npm start      # http://localhost:3100
```
