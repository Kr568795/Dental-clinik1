# 🚀 Деплой на Railway (с постоянно съхранение)

Това ръководство качва сайта на **Railway** с **Volume** (постоянен диск), така че
**базата данни и качените снимки се пазят** след всеки рестарт и редеплой.

> Кодът вече е подготвен: базата и качените снимки автоматично отиват в папката
> `DATA_DIR`. При първо стартиране на празна база се зареждат началните данни
> автоматично (без да трият нищо).

---

## 0. Какво ти трябва
- Безплатен **GitHub** акаунт
- Безплатен **Railway** акаунт (railway.app — вход с GitHub)

---

## 1. Качи проекта в GitHub

В папката на проекта (PowerShell):

```powershell
git add -A
git commit -m "Подготовка за деплой"
```

Създай нов **private** repo в GitHub (github.com → New repository), после:

```powershell
git remote add origin https://github.com/ПОТРЕБИТЕЛ/ИМЕ-НА-REPO.git
git branch -M main
git push -u origin main
```

> `.env`, `node_modules/`, базата и `uploads/` НЕ се качват (защитени са в `.gitignore`).

---

## 2. Създай проекта в Railway
1. Влез в **railway.app** → **New Project** → **Deploy from GitHub repo**.
2. Избери repo-то. Railway сам разпознава Node и пуска `npm start`.
3. Изчакай първия build (~1–2 мин). Ще гръмне/рестартира, докато добавим Volume и
   променливите — нормално е, продължи към стъпка 3.

---

## 3. Добави Volume (постоянния диск) ⬅️ най-важното
1. В проекта → услугата → таб **Variables**? Не — отиди на **Settings** или десен
   клик върху услугата → **Add Volume**.
2. **Mount path:** въведи точно:
   ```
   /data
   ```
3. Запази. Това е дискът, който пази всичко завинаги.

---

## 4. Добави Environment Variables
Услугата → таб **Variables** → добави следните (Raw Editor е най-бързо):

```
DATA_DIR=/data
NODE_ENV=production
JWT_SECRET=СЛОЖИ_ТУК_ДЪЛЪГ_СЛУЧАЕН_НИЗ
JWT_EXPIRES_IN=7d
DB_DIALECT=sqlite

ADMIN_USERNAME=admin
ADMIN_PASSWORD=СЛОЖИ_СИЛНА_ПАРОЛА

# Имейли за записани часове (истински SMTP — задължително за реална работа):
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=твой@gmail.com
SMTP_PASS=app-парола-от-gmail
ADMIN_EMAIL=където@да-идват-заявките.bg
MAIL_FROM=Дентални клиники MNL <no-reply@твой-домейн.bg>
```

⚠️ **Важно:**
- `DATA_DIR=/data` ТРЯБВА да съвпада с Mount path-а от стъпка 3.
- `PORT` **НЕ** го слагай — Railway го подава автоматично.
- `JWT_SECRET` — дълъг случаен низ (напр. 32+ знака). Може да го генерираш с:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Смени `ADMIN_PASSWORD` — да не е `admin123`.

### За Gmail SMTP (ако ползваш Gmail):
Трябва **App Password** (не обикновената парола): Google акаунт → Security →
2-Step Verification (включи я) → App passwords → генерирай за „Mail". Сложи го в `SMTP_PASS`.

---

## 5. Деплой + публичен адрес
1. След като добавиш Volume + Variables, Railway редеплойва автоматично (или натисни
   **Deploy**).
2. В **Settings → Networking → Generate Domain** — получаваш адрес тип
   `име.up.railway.app` с безплатен HTTPS.
3. Отвори адреса — сайтът е жив. При първото стартиране базата се напълва автоматично.
4. Влез в админ панела на `https://адресът/admin` с `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

---

## 6. Проверка, че всичко се пази
1. Влез в админ → промени текст или качи снимка → запазва се веднага.
2. В Railway → **Deployments** → **Restart** (или направи малка промяна и `git push`).
3. Отвори сайта пак — промените и снимките са на място. ✅

---

## 7. (По избор) Собствен домейн
Settings → Networking → **Custom Domain** → въведи домейна си → добави CNAME записа,
който Railway показва, при регистратора на домейна. SSL се издава автоматично.

---

## Полезно да знаеш
- **Ежедневните промени** (текст, снимки, цени, заявки) се правят от админ панела —
  на живо, без деплой.
- **Промени по кода** → `git push` → Railway редеплойва за ~1–2 мин. Volume-ът (база +
  снимки) не се пипа.
- **`npm run seed` НЕ го пускай** в production — той трие всичко. Първоначалните данни
  се зареждат сами при празна база.
- **Бекъп:** в Railway → услугата → Volume можеш да сваляш съдържанието. Добре е
  периодично да пазиш копие на `/data/mnl.sqlite` и папка `/data/uploads`.

---

## Преминаване към PostgreSQL (ако някога потрябва при голям трафик)
1. Railway → **New** → **Database → PostgreSQL** (в същия проект).
2. В Variables на сайта смени:
   ```
   DB_DIALECT=postgres
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   ```
3. Редеплой. Кодът (Sequelize) минава на Postgres без други промени; базата ще се
   засее наново автоматично.
