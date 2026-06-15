'use strict';

// ─────────────────────────────────────────────────────────────
// Shared seed data + helpers.
//   • seedFresh()   — drops everything and reseeds (manual `npm run seed`).
//   • seedIfEmpty() — seeds ONLY when the DB has no data yet (safe on every
//                     boot in production; never destroys existing data).
// ─────────────────────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const {
  sequelize, Service, Review, Setting, Admin,
  TeamMember, GalleryImage, FaqItem, WhyReason,
} = require('../models');

const C_PROPHY = 'Профилактика и диагностика';
const C_TREAT = 'Лечение и възстановяване';
const C_AESTHETIC = 'Естетика и ортодонтия';
const C_SURGERY = 'Хирургия и импланти';

const SERVICES = [
  { name: 'Профилактичен преглед', category: C_PROPHY, icon: 'fa-tooth', price_min: 0, price_max: 40, description: 'Цялостен преглед на устната кухина и план за лечение.' },
  { name: 'Рентгенова диагностика', category: C_PROPHY, icon: 'fa-x-ray', price_min: 20, price_max: 60, description: 'Дигитален рентген с минимална доза облъчване.' },
  { name: 'Лечение на кариес', category: C_TREAT, icon: 'fa-teeth', price_min: 60, price_max: 150, description: 'Безболезнено отстраняване на кариес и естетична пломба.' },
  { name: 'Пародонтология', category: C_TREAT, icon: 'fa-disease', price_min: 80, price_max: 350, description: 'Лечение на венци и пародонтит.' },
  { name: 'Коронки и мостове', category: C_TREAT, icon: 'fa-crown', price_min: 300, price_max: 800, description: 'Естетични и здрави възстановявания.' },
  { name: 'Детска стоматология', category: C_TREAT, icon: 'fa-child', price_min: 30, price_max: 120, description: 'Грижа за най-малките в приятелска среда.' },
  { name: 'Избелване', category: C_AESTHETIC, icon: 'fa-star', price_min: 200, price_max: 400, description: 'Професионално избелване за видимо по-бяла усмивка.' },
  { name: 'Естетична стоматология', category: C_AESTHETIC, icon: 'fa-wand-magic-sparkles', price_min: 150, price_max: 700, description: 'Фасети и възстановявания за перфектна усмивка.' },
  { name: 'Ортодонтия', category: C_AESTHETIC, icon: 'fa-teeth-open', price_min: 1500, price_max: 4000, description: 'Брекети и алайнери за правилна захапка.' },
  { name: 'Вадене на зъби', category: C_SURGERY, icon: 'fa-tooth', price_min: 50, price_max: 200, description: 'Щадящо изваждане, включително мъдреци.' },
  { name: 'Зъбни импланти', category: C_SURGERY, icon: 'fa-screwdriver-wrench', price_min: 900, price_max: 2200, description: 'Висококачествени импланти за траен резултат.' },
  { name: 'Хирургия', category: C_SURGERY, icon: 'fa-user-doctor', price_min: 100, price_max: 600, description: 'Орална хирургия от д-р Билял.' },
];

const REVIEWS = [
  {
    author_name: 'Благо',
    rating: 5,
    date_text: 'преди 1 година',
    content:
      'Ако сте страхливи и несигурни като мен — това е мястото за вас. Доктор Билял е много спокоен, културен и приятен човек. Чувствах се в добри ръце през цялото време.',
  },
  {
    author_name: 'Petar Petrov',
    rating: 5,
    date_text: 'преди 6 месеца',
    content:
      'Прекрасно отношение, разбиране и съобразяване с графика ми. Препоръчвам, ако търсите внимание, качествено и искрено мнение.',
  },
  {
    author_name: 'Bobby S. Stoyanov',
    rating: 5,
    date_text: 'преди 11 месеца',
    content:
      'Имах час при доктор Билял за вадене на мъдрец. Изключителен професионалист. Обясни всички стъпки и беше много внимателен!',
  },
];

const SETTINGS = {
  phone: '089 728 8776',
  phone_link: '+359897288776',
  address: 'бл. 418, Младост 4, вх. 1 – партер, 1715 София',
  working_hours: 'Пон–Пет: 09:00–18:00 | Събота: 09:00–13:00',
  accepting_patients: 'true',
  rating_value: '4.5',
  review_count: '33',
  years_experience: '5',
  specialists_count: '6',
  meta_title: 'Дентални клиники MNL | Зъболекар Младост 4, София',
  meta_description:
    'Дентална клиника в Младост 4. Д-р Билял и екипът ни — безболезнено лечение, модерно оборудване. ⭐ 4.5/5 в Google. Тел: 089 728 8776',
  whatsapp_number: '+359897288776',
  google_maps_url:
    'https://www.google.com/maps?q=Младост+4+блок+418+София&output=embed',
  patients_count: '33',

  // ── Booking calendar config ─────────────────────────────
  closed_weekdays: '0', // 0=Неделя … 6=Събота (запетая за няколко)
  closed_dates: '', // конкретни почивни дни: YYYY-MM-DD, запетая
  slot_start: '09:00',
  slot_end_weekday: '17:30',
  slot_end_saturday: '12:30',
  slot_minutes: '30',

  // ── Editable text content (per section) ─────────────────
  hero_title: 'Вашата усмивка заслужава',
  hero_title_accent: 'най-доброто',
  hero_subtitle:
    'Модерна дентална клиника в сърцето на Младост 4. Д-р Билял и екипът ни ви посрещат с топлина, експертиза и най-новите технологии.',
  hero_badge_suffix: 'доволни пациента',
  hero_btn1: 'Запази час безплатно',
  hero_btn2: 'Разгледай услугите',
  hero_trust1: 'Без болка',
  hero_trust2: 'Модерно оборудване',
  hero_trust3: 'Гъвкаво работно време',

  services_title: 'Пълна грижа за вашата усмивка',
  services_intro:
    'От профилактика до сложни хирургични процедури — предлагаме всичко на едно място, с грижа и внимание към всеки пациент.',

  why_title: 'Причини да ни се доверите',
  why_intro: 'Професионализъм, модерни технологии и истинско внимание към всеки пациент.',
  why_doctor_name: 'Д-р Билял',
  why_doctor_role: 'Орална хирургия · 5+ години опит',

  team_title: 'Хора, на които можете да разчитате',
  team_intro: 'Сплотен екип от специалисти, отдадени на вашето дентално здраве.',

  gallery_title: 'Нашата клиника отвътре',
  gallery_intro: 'Модерни, чисти и уютни кабинети, създадени за вашия комфорт.',

  results_title: 'Преди и след',
  results_intro: 'Истинска трансформация на усмивката. Плъзнете, за да видите разликата след нашето лечение.',

  reviews_title: 'Какво казват нашите пациенти',
  tools_title: 'Опознайте усмивката си',
  tools_intro: 'Безплатни онлайн инструменти, които ви помагат да разберете нуждите си — преди да дойдете при нас.',
  booking_title: 'Резервирайте за 1 минута',
  booking_intro: 'Попълнете формата и ще се свържем с вас за потвърждение.',

  faq_title: 'Имате въпрос? Имаме отговор',

  footer_desc: 'Вашата усмивка заслужава най-доброто. Модерна дентална грижа в сърцето на Младост 4, София.',

  // ── Editable images (paths) ─────────────────────────────
  img_logo: '/images/logo.svg',
  img_hero: '/images/doctor.jpg',
  img_why: '/images/doctor.jpg',
  img_team_main: '/images/team.jpg',
  img_before: '/images/before.jpg',
  img_after: '/images/after.jpg',
};

const TEAM = [
  { name: 'Д-р Билял', role: 'Главен лекар · Орална хирургия', image: '/images/doctor.jpg', bio: 'Орален хирург с дългогодишен опит и стотици доволни пациенти. Специализира в импланти, вадене на мъдреци и комплексно лечение, винаги с подход без болка.' },
  { name: 'Д-р Елена', role: 'Естетична стоматология', image: '/images/doctor2.jpg', bio: 'Отдадена на красивите усмивки — фасети, избелване и естетични възстановявания. Внимателна към всеки детайл и спокойна с притеснени пациенти.' },
  { name: 'Д-р Мария', role: 'Детска стоматология', image: '/images/patient.jpg', bio: 'Млад и грижовен специалист, който лекува с усмивка. Създава приятелска среда, в която и най-малките се чувстват спокойни.' },
];

const GALLERY = [
  { image: '/images/cabinet1.jpg', caption: 'Кабинет 1' },
  { image: '/images/treatment.jpg', caption: 'Дентална процедура' },
  { image: '/images/cabinet2.jpg', caption: 'Модерно оборудване' },
  { image: '/images/patient.jpg', caption: 'Грижа за пациенти' },
  { image: '/images/doctor.jpg', caption: 'Д-р Билял' },
  { image: '/images/smile.jpg', caption: 'Усмихнат специалист' },
];

const WHY = [
  { title: 'Д-р Билял — изключителен специалист', text: 'Орална хирургия и комплексно лечение с доказан опит и стотици доволни пациенти.' },
  { title: 'Подход без тревожност', text: '„Ако сте страхливи и несигурни като мен — това е мястото за вас." — Благо.' },
  { title: 'Модерно оборудване', text: 'Дигитален рентген с минимална доза облъчване и прецизна диагностика.' },
  { title: 'Гъвкаво работно време и удобна локация', text: 'В сърцето на Младост 4, съобразяваме се с вашия график.' },
  { title: 'Ясна комуникация', text: 'Обясняваме всяка стъпка разбираемо, без сложен медицински жаргон.' },
];

const FAQ = [
  { question: 'Боли ли лечението при вас?', answer: 'Работим максимално щадящо и с модерна анестезия. Нашите пациенти описват лечението като безболезнено и спокойно — дори тези с дентална тревожност.' },
  { question: 'Колко струват услугите?', answer: 'Цените зависят от конкретната процедура. Можете да използвате нашия ценови калкулатор за ориентир, а точната цена определяме след безплатен преглед.' },
  { question: 'Колко време отнема едно посещение?', answer: 'Профилактичният преглед отнема около 30 минути. По-сложните процедури планираме предварително, за да ви спестим време.' },
  { question: 'Приемате ли деца?', answer: 'Да! Имаме специалист по детска стоматология и приятелска среда, за да се чувстват най-малките спокойни.' },
  { question: 'Страх ме е от зъболекар — какво да правя?', answer: 'Не сте сами. Специализираме в работа с тревожни пациенти — спокоен темп, ясна комуникация и никакъв натиск.' },
  { question: 'Вадите ли мъдреци?', answer: 'Да, д-р Билял е орален хирург с опит във ваденето на мъдреци, включително сложни случаи.' },
  { question: 'Какво да правя при спешен случай?', answer: 'Обадете се на 089 728 8776. Ще направим всичко възможно да ви приемем възможно най-бързо.' },
];

// Insert all seed rows. Assumes tables already exist and are empty.
async function populate() {
  await Service.bulkCreate(SERVICES.map((s, i) => ({ ...s, sort_order: i, visible: true })));
  await Review.bulkCreate(REVIEWS.map((r) => ({ ...r, visible: true })));
  await Setting.bulkCreate(Object.entries(SETTINGS).map(([key, value]) => ({ key, value })));
  await TeamMember.bulkCreate(TEAM.map((m, i) => ({ ...m, sort_order: i, visible: true })));
  await GalleryImage.bulkCreate(GALLERY.map((g, i) => ({ ...g, sort_order: i, visible: true })));
  await WhyReason.bulkCreate(WHY.map((w, i) => ({ ...w, sort_order: i, visible: true })));
  await FaqItem.bulkCreate(FAQ.map((f, i) => ({ ...f, sort_order: i, visible: true })));

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const password_hash = await bcrypt.hash(password, 10);
  await Admin.create({ username, password_hash });
  return { username, password };
}

// Destructive: drop & recreate everything, then seed. Used by `npm run seed`.
async function seedFresh() {
  await sequelize.sync({ force: true });
  return populate();
}

// Safe: create tables if missing, seed ONLY when the DB is still empty.
// Returns true if it seeded, false if data already existed.
async function seedIfEmpty() {
  await sequelize.sync();
  const [services, settings] = await Promise.all([Service.count(), Setting.count()]);
  if (services > 0 || settings > 0) return false;
  await populate();
  return true;
}

module.exports = {
  seedFresh,
  seedIfEmpty,
  populate,
  counts: {
    services: SERVICES.length,
    reviews: REVIEWS.length,
    settings: Object.keys(SETTINGS).length,
    team: TEAM.length,
    gallery: GALLERY.length,
    why: WHY.length,
    faq: FAQ.length,
  },
};
