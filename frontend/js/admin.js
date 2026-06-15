/* ============================================================
   admin.js — admin panel: auth, appointments, services,
   reviews, settings, stats
   ============================================================ */

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

async function api(path, opts = {}) {
  const res = await fetch('/api' + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (res.status === 401) { showLogin(); throw new Error('unauthorized'); }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Грешка');
  return data;
}

function esc(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Prices are stored in BGN; show EUR (primary) + BGN.
const EUR_RATE = 1.95583;
const eur = (bgn) => Math.round(Number(bgn) / EUR_RATE);
function priceCell(min, max) {
  if (min == null || max == null) return '—';
  return `${eur(min)}–${eur(max)} € <span style="color:var(--muted);font-size:.85em">(${min}–${max} лв.)</span>`;
}

/* ---------- Toasts ---------- */
function toast(msg, type = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'error' ? ' error' : '');
  el.innerHTML = `${type === 'error' ? '⚠️' : '✅'} ${esc(msg)}`;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 3200);
}

/* ---------- Modal ---------- */
const modalOverlay = $('#modalOverlay');
function openModal(html) { $('#modalContent').innerHTML = html; modalOverlay.classList.add('open'); }
function closeModal() { modalOverlay.classList.remove('open'); }
modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) closeModal(); });

/* ---------- Auth ---------- */
// The dashboard is gated server-side; any lost session sends the user back to
// the dedicated, isolated login page (no dashboard markup is exposed).
function showLogin() { window.location.href = '/admin/login'; }
function showApp() { const v = $('#appView'); if (v) v.classList.remove('hidden'); }

$('#logoutBtn').addEventListener('click', async () => {
  await api('/auth/logout', { method: 'POST' }).catch(() => {});
  window.location.href = '/admin/login';
});

/* ---------- Navigation ---------- */
const TITLES = {
  dashboard: 'Статистики', appointments: 'Заявки за часове', calendar: 'Календар',
  'p-home': 'Страница „Начало"', 'p-services': 'Страница „Услуги"', 'p-about': 'Страница „За нас"',
  'p-team': 'Страница „Екип"', 'p-gallery': 'Страница „Галерия"', 'p-contact': 'Страница „Контакт"',
  'p-settings': 'Общи настройки',
};
const CRUMBS = {
  dashboard: 'Преглед на дейността',
  appointments: 'Управление на записаните часове',
  calendar: 'Записани часове по дни',
  'p-home': 'Текстове, снимки и числа на началната страница',
  'p-services': 'Заглавия + услугите с цени',
  'p-about': 'Текстове, снимки, причини и отзиви',
  'p-team': 'Заглавия + членовете на екипа',
  'p-gallery': 'Заглавия + снимките',
  'p-contact': 'Контакти, работно време и въпроси',
  'p-settings': 'Лого, футър, рейтинг и SEO',
};
$$('.nav-item[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    $$('.nav-item').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    const v = btn.dataset.view;
    $$('.view').forEach((x) => x.classList.remove('active'));
    $('#view-' + v).classList.add('active');
    $('#viewTitle').textContent = TITLES[v];
    $('#viewCrumb').textContent = CRUMBS[v];
    $('#sidebar').classList.remove('open');
  });
});

function setUser(name) {
  $('#adminUser').textContent = name;
  const av = $('#userAv');
  if (av) av.textContent = (name || 'A').charAt(0).toUpperCase();
}
$('#burgerAdmin').addEventListener('click', () => $('#sidebar').classList.toggle('open'));

/* ============================================================
   Appointments
   ============================================================ */
let allAppointments = [];

async function loadAppointments() {
  const params = new URLSearchParams();
  if ($('#filterStatus').value) params.set('status', $('#filterStatus').value);
  if ($('#filterDate').value) params.set('date', $('#filterDate').value);
  allAppointments = await api('/appointments?' + params.toString());
  renderAppointments();
}

function renderAppointments() {
  const body = $('#apptBody');
  if (!allAppointments.length) { body.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:30px">Няма заявки.</td></tr>'; return; }
  const statusLabel = { new: 'Нова', confirmed: 'Потвърдена', cancelled: 'Отказана' };
  body.innerHTML = allAppointments.map((a) => `
    <tr>
      <td>${new Date(a.created_at).toLocaleDateString('bg-BG')}</td>
      <td>${esc(a.full_name)}</td>
      <td><a href="tel:${esc(a.phone)}" style="color:var(--primary-light)">${esc(a.phone)}</a></td>
      <td>${esc(a.service)}</td>
      <td>${esc(a.preferred_date)} ${esc(a.preferred_time)}</td>
      <td><span class="badge ${a.status}">${statusLabel[a.status]}</span></td>
      <td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-view-appt="${a.id}"><i class="fa-solid fa-eye"></i></button>
        ${a.status !== 'confirmed' ? `<button class="btn btn-sm btn-primary" data-confirm="${a.id}">Потвърди</button>` : ''}
        ${a.status !== 'cancelled' ? `<button class="btn btn-sm btn-ghost" data-cancel="${a.id}">Откажи</button>` : ''}
        <button class="btn btn-sm btn-danger" data-del-appt="${a.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');

  $$('[data-confirm]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.confirm, 'confirmed')));
  $$('[data-cancel]').forEach((b) => b.addEventListener('click', () => setStatus(b.dataset.cancel, 'cancelled')));
  $$('[data-del-appt]').forEach((b) => b.addEventListener('click', () => delAppt(b.dataset.delAppt)));
  $$('[data-view-appt]').forEach((b) => b.addEventListener('click', () => viewAppt(b.dataset.viewAppt)));
  renderRecent();
}

// Dashboard: latest 5 appointments (read-only snapshot).
function renderRecent() {
  const body = $('#recentBody');
  if (!body) return;
  const statusLabel = { new: 'Нова', confirmed: 'Потвърдена', cancelled: 'Отказана' };
  const recent = allAppointments.slice(0, 5);
  body.innerHTML = recent.length
    ? recent.map((a) => `<tr>
        <td>${new Date(a.created_at).toLocaleDateString('bg-BG')}</td>
        <td>${esc(a.full_name)}</td>
        <td><a href="tel:${esc(a.phone)}" style="color:var(--primary-light)">${esc(a.phone)}</a></td>
        <td>${esc(a.service)}</td>
        <td><span class="badge ${a.status}">${statusLabel[a.status]}</span></td>
      </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:24px">Все още няма заявки. Когато пациент попълни формата на сайта, тя ще се появи тук.</td></tr>';
}

function viewAppt(id) {
  const a = allAppointments.find((x) => String(x.id) === String(id));
  if (!a) return;
  openModal(`
    <h3>Заявка #${a.id}</h3>
    <div class="admin-form">
      <div><label>Пациент</label><div>${esc(a.full_name)}</div></div>
      <div class="grid2">
        <div><label>Телефон</label><div><a href="tel:${esc(a.phone)}" style="color:var(--primary-light)">${esc(a.phone)}</a></div></div>
        <div><label>Имейл</label><div>${esc(a.email || '—')}</div></div>
      </div>
      <div><label>Услуга</label><div>${esc(a.service)}</div></div>
      <div class="grid2">
        <div><label>Дата</label><div>${esc(a.preferred_date)}</div></div>
        <div><label>Час</label><div>${esc(a.preferred_time)}</div></div>
      </div>
      <div><label>Бележка</label><div>${esc(a.note || '—')}</div></div>
    </div>
    <div class="modal-actions">
      <a href="tel:${esc(a.phone)}" class="btn btn-gold"><i class="fa-solid fa-phone"></i> Обади се</a>
      <button class="btn btn-primary" onclick="window._confirmFromModal(${a.id})">Потвърди</button>
      <button class="btn btn-ghost" onclick="window._closeModal()">Затвори</button>
    </div>`);
}
window._closeModal = closeModal;
window._confirmFromModal = (id) => { setStatus(id, 'confirmed'); closeModal(); };

async function setStatus(id, status) {
  try { await api('/appointments/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }); toast('Статусът е обновен.'); loadAppointments(); loadStats(); }
  catch (e) { toast(e.message, 'error'); }
}
async function delAppt(id) {
  if (!confirm('Изтриване на заявката?')) return;
  try { await api('/appointments/' + id, { method: 'DELETE' }); toast('Заявката е изтрита.'); loadAppointments(); loadStats(); }
  catch (e) { toast(e.message, 'error'); }
}

$('#filterStatus').addEventListener('change', loadAppointments);
$('#filterDate').addEventListener('change', loadAppointments);
$('#clearFilters').addEventListener('click', () => { $('#filterStatus').value = ''; $('#filterDate').value = ''; loadAppointments(); });

$('#exportCsv').addEventListener('click', () => {
  if (!allAppointments.length) return toast('Няма данни за export.', 'error');
  const headers = ['ID', 'Създадена', 'Име', 'Телефон', 'Имейл', 'Услуга', 'Дата', 'Час', 'Статус', 'Бележка'];
  const rows = allAppointments.map((a) => [a.id, a.created_at, a.full_name, a.phone, a.email || '', a.service, a.preferred_date, a.preferred_time, a.status, (a.note || '').replace(/\n/g, ' ')]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = 'zayavki_' + new Date().toISOString().slice(0, 10) + '.csv';
  link.click(); URL.revokeObjectURL(url);
  toast('CSV експортиран.');
});

/* ============================================================
   Services
   ============================================================ */
let allServices = [];
async function loadServices() {
  allServices = await api('/services/all');
  const body = $('#servicesBody');
  body.innerHTML = allServices.map((s) => `
    <tr>
      <td>${s.sort_order}</td>
      <td>${esc(s.name)}</td>
      <td><span style="color:var(--muted);font-size:.85rem">${esc(s.category || '—')}</span></td>
      <td>${priceCell(s.price_min, s.price_max)}</td>
      <td>${s.visible ? '✅' : '🚫'}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-edit-srv="${s.id}"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" data-del-srv="${s.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
  $$('[data-edit-srv]').forEach((b) => b.addEventListener('click', () => serviceModal(b.dataset.editSrv)));
  $$('[data-del-srv]').forEach((b) => b.addEventListener('click', () => delService(b.dataset.delSrv)));
}

function serviceModal(id) {
  const s = id ? allServices.find((x) => String(x.id) === String(id)) : {};
  openModal(`
    <h3>${id ? 'Редакция' : 'Нова'} услуга</h3>
    <form class="admin-form" id="srvForm">
      <div><label>Име *</label><input name="name" value="${esc(s.name || '')}" required /></div>
      <div><label>Категория <span style="color:var(--muted);font-weight:400">(групира услугите в падащо меню)</span></label>
        <input name="category" list="srvCats" value="${esc(s.category || '')}" placeholder="напр. Естетика и ортодонтия" />
        <datalist id="srvCats">${[...new Set((allServices || []).map((x) => x.category).filter(Boolean))].map((c) => `<option value="${esc(c)}">`).join('')}</datalist>
      </div>
      <div><label>Описание</label><textarea name="description" rows="2">${esc(s.description || '')}</textarea></div>
      <div class="grid2">
        <div><label>Цена от (лв.)</label><input name="price_min" type="number" value="${s.price_min ?? ''}" /></div>
        <div><label>Цена до (лв.)</label><input name="price_max" type="number" value="${s.price_max ?? ''}" /></div>
      </div>
      <p style="color:var(--muted);font-size:.78rem;margin-top:-6px"><i class="fa-solid fa-circle-info"></i> Въвеждайте в лева — сумите в евро (€) се изчисляват автоматично по курс 1.95583.</p>
      <div class="grid2">
        <div><label>Икона (Font Awesome)</label><input name="icon" value="${esc(s.icon || 'fa-tooth')}" /></div>
        <div><label>Подредба</label><input name="sort_order" type="number" value="${s.sort_order ?? 0}" /></div>
      </div>
      <label class="toggle"><input type="checkbox" name="visible" ${s.visible !== false ? 'checked' : ''} /> Видима на сайта</label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="window._closeModal()">Отказ</button>
        <button type="submit" class="btn btn-primary">Запази</button>
      </div>
    </form>`);
  $('#srvForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      name: fd.get('name'),
      category: fd.get('category'),
      description: fd.get('description'),
      price_min: fd.get('price_min') === '' ? null : Number(fd.get('price_min')),
      price_max: fd.get('price_max') === '' ? null : Number(fd.get('price_max')),
      icon: fd.get('icon'),
      sort_order: Number(fd.get('sort_order')) || 0,
      visible: fd.get('visible') === 'on',
    };
    try {
      if (id) await api('/services/' + id, { method: 'PUT', body: JSON.stringify(payload) });
      else await api('/services', { method: 'POST', body: JSON.stringify(payload) });
      toast('Услугата е запазена.'); closeModal(); loadServices();
    } catch (ex) { toast(ex.message, 'error'); }
  });
}
async function delService(id) {
  if (!confirm('Изтриване на услугата?')) return;
  try { await api('/services/' + id, { method: 'DELETE' }); toast('Услугата е изтрита.'); loadServices(); }
  catch (e) { toast(e.message, 'error'); }
}
$('#addService').addEventListener('click', () => serviceModal(null));

/* ============================================================
   Reviews
   ============================================================ */
let allReviews = [];
async function loadReviews() {
  allReviews = await api('/reviews/all');
  const body = $('#reviewsBody');
  body.innerHTML = allReviews.map((r) => `
    <tr>
      <td>${esc(r.author_name)}</td>
      <td>${'★'.repeat(r.rating)}</td>
      <td style="max-width:340px">${esc(r.content.slice(0, 90))}${r.content.length > 90 ? '…' : ''}</td>
      <td>${r.visible ? '✅' : '🚫'}</td>
      <td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-toggle-rev="${r.id}">${r.visible ? 'Скрий' : 'Покажи'}</button>
        <button class="btn btn-sm btn-danger" data-del-rev="${r.id}"><i class="fa-solid fa-trash"></i></button>
      </td>
    </tr>`).join('');
  $$('[data-toggle-rev]').forEach((b) => b.addEventListener('click', () => toggleReview(b.dataset.toggleRev)));
  $$('[data-del-rev]').forEach((b) => b.addEventListener('click', () => delReview(b.dataset.delRev)));
}
function reviewModal() {
  openModal(`
    <h3>Нов отзив</h3>
    <form class="admin-form" id="revForm">
      <div><label>Автор *</label><input name="author_name" required /></div>
      <div class="grid2">
        <div><label>Оценка *</label><select name="rating"><option value="5">5 ★</option><option value="4">4 ★</option><option value="3">3 ★</option><option value="2">2 ★</option><option value="1">1 ★</option></select></div>
        <div><label>Дата (текст)</label><input name="date_text" placeholder="преди 2 месеца" /></div>
      </div>
      <div><label>Съдържание *</label><textarea name="content" rows="4" required></textarea></div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="window._closeModal()">Отказ</button>
        <button type="submit" class="btn btn-primary">Добави</button>
      </div>
    </form>`);
  $('#revForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api('/reviews', { method: 'POST', body: JSON.stringify({ author_name: fd.get('author_name'), rating: Number(fd.get('rating')), content: fd.get('content'), date_text: fd.get('date_text') }) });
      toast('Отзивът е добавен.'); closeModal(); loadReviews();
    } catch (ex) { toast(ex.message, 'error'); }
  });
}
async function toggleReview(id) {
  try { await api('/reviews/' + id + '/toggle', { method: 'PATCH' }); toast('Видимостта е променена.'); loadReviews(); }
  catch (e) { toast(e.message, 'error'); }
}
async function delReview(id) {
  if (!confirm('Изтриване на отзива?')) return;
  try { await api('/reviews/' + id, { method: 'DELETE' }); toast('Отзивът е изтрит.'); loadReviews(); }
  catch (e) { toast(e.message, 'error'); }
}
$('#addReview').addEventListener('click', reviewModal);

/* ============================================================
   Accepting-patients toggle (dashboard)
   ============================================================ */
document.addEventListener('change', async (e) => {
  if (e.target && e.target.id === 'acceptToggle') {
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify({ accepting_patients: String(e.target.checked) }) });
      toast(e.target.checked ? 'Приемате нови пациенти онлайн.' : 'Онлайн заявките са изключени.');
    } catch (ex) { toast(ex.message, 'error'); }
  }
});

/* ============================================================
   Content (texts + images) — per-page editor with auto-save
   ============================================================ */
// Editable content (texts + images) grouped per nav page → #content-<page>.
const PAGE_CONTENT = {
  home: [
    { title: 'Hero (заглавна секция)', icon: 'fa-star', fields: [
      { key: 'hero_title', label: 'Главно заглавие' },
      { key: 'hero_title_accent', label: 'Подчертана дума (зелено)' },
      { key: 'hero_subtitle', label: 'Подзаглавие', textarea: true },
      { key: 'img_hero', label: 'Снимка', type: 'image' },
      { key: 'hero_badge_suffix', label: 'Текст до рейтинга' },
      { key: 'hero_btn1', label: 'Бутон 1' }, { key: 'hero_btn2', label: 'Бутон 2' },
      { key: 'hero_trust1', label: 'Предимство 1' }, { key: 'hero_trust2', label: 'Предимство 2' }, { key: 'hero_trust3', label: 'Предимство 3' },
    ]},
    { title: 'Лента с числа', icon: 'fa-chart-simple', fields: [
      { key: 'patients_count', label: 'Доволни пациенти' }, { key: 'years_experience', label: 'Години опит' }, { key: 'specialists_count', label: 'Специалисти' },
    ]},
    { title: 'Секция „Услуги" (заглавие)', icon: 'fa-tooth', fields: [
      { key: 'services_title', label: 'Заглавие' }, { key: 'services_intro', label: 'Подзаглавие', textarea: true },
    ]},
    { title: 'Секция „Защо нас" (снимка)', icon: 'fa-award', fields: [
      { key: 'img_why', label: 'Снимка на лекаря', type: 'image' }, { key: 'why_doctor_name', label: 'Име на лекаря (бадж)' },
    ]},
  ],
  services: [
    { title: 'Заглавия', icon: 'fa-heading', fields: [
      { key: 'services_title', label: 'Услуги — заглавие' }, { key: 'services_intro', label: 'Услуги — подзаглавие', textarea: true },
      { key: 'tools_title', label: 'Инструменти — заглавие' }, { key: 'tools_intro', label: 'Инструменти — подзаглавие', textarea: true },
    ]},
  ],
  about: [
    { title: '„Защо да изберете нас"', icon: 'fa-award', fields: [
      { key: 'why_title', label: 'Заглавие' }, { key: 'why_intro', label: 'Подзаглавие', textarea: true },
      { key: 'why_doctor_name', label: 'Име на лекаря (бадж)' }, { key: 'why_doctor_role', label: 'Роля на лекаря (бадж)' },
      { key: 'img_why', label: 'Снимка на лекаря', type: 'image' },
    ]},
    { title: 'Преди / След', icon: 'fa-wand-magic-sparkles', fields: [
      { key: 'results_title', label: 'Заглавие' }, { key: 'results_intro', label: 'Подзаглавие', textarea: true },
      { key: 'img_before', label: 'Снимка „Преди"', type: 'image' }, { key: 'img_after', label: 'Снимка „След"', type: 'image' },
    ]},
    { title: 'Отзиви (заглавие)', icon: 'fa-comment-dots', fields: [{ key: 'reviews_title', label: 'Заглавие на секцията' }] },
  ],
  team: [
    { title: 'Заглавия', icon: 'fa-heading', fields: [
      { key: 'team_title', label: 'Заглавие' }, { key: 'team_intro', label: 'Подзаглавие', textarea: true },
    ]},
  ],
  gallery: [
    { title: 'Заглавия', icon: 'fa-heading', fields: [
      { key: 'gallery_title', label: 'Заглавие' }, { key: 'gallery_intro', label: 'Подзаглавие', textarea: true },
    ]},
  ],
  contact: [
    { title: '„Запази час" (заглавия)', icon: 'fa-calendar-check', fields: [
      { key: 'booking_title', label: 'Заглавие' }, { key: 'booking_intro', label: 'Подзаглавие', textarea: true },
    ]},
    { title: 'Контактна информация', icon: 'fa-address-card', fields: [
      { key: 'phone', label: 'Телефон (показан)' }, { key: 'phone_link', label: 'Телефон за набиране (+359…)' },
      { key: 'address', label: 'Адрес', textarea: true }, { key: 'working_hours', label: 'Работно време (текст)' },
      { key: 'google_maps_url', label: 'Google Maps (embed URL)' },
    ]},
    { title: 'Календар за записване', icon: 'fa-calendar-days', fields: [
      { key: 'closed_weekdays', label: 'Почивни дни (0=Нд…6=Сб)', hint: 'Няколко с запетая, напр. „0,6"' },
      { key: 'closed_dates', label: 'Конкретни почивни дни (YYYY-MM-DD)', textarea: true },
      { key: 'slot_start', label: 'Начален час' }, { key: 'slot_end_weekday', label: 'Краен час (делник)' },
      { key: 'slot_end_saturday', label: 'Краен час (събота)' }, { key: 'slot_minutes', label: 'Интервал (минути)' },
    ]},
    { title: 'FAQ (заглавие)', icon: 'fa-circle-question', fields: [{ key: 'faq_title', label: 'Заглавие на секцията' }] },
  ],
  settings: [
    { title: 'Лого и футър', icon: 'fa-image', fields: [
      { key: 'img_logo', label: 'Лого', type: 'image' }, { key: 'footer_desc', label: 'Описание във футъра', textarea: true },
    ]},
    { title: 'Рейтинг (Google)', icon: 'fa-star', fields: [
      { key: 'rating_value', label: 'Оценка (напр. 4.5)' }, { key: 'review_count', label: 'Брой отзиви' },
    ]},
    { title: 'SEO и социални', icon: 'fa-magnifying-glass', fields: [
      { key: 'meta_title', label: 'SEO заглавие' }, { key: 'meta_description', label: 'SEO описание', textarea: true },
      { key: 'whatsapp_number', label: 'WhatsApp номер' },
    ]},
  ],
};

function renderContentGroups(groups, settings) {
  return groups.map((sec) => `
    <div class="panel-box">
      <h3><i class="fa-solid ${sec.icon}" style="color:var(--secondary);margin-right:8px"></i>${sec.title}</h3>
      <div class="settings-grid">
        ${sec.fields.map((f) => {
          const val = settings[f.key] || '';
          const hint = f.hint ? `<span class="hint">${f.hint}</span>` : '';
          if (f.type === 'image') {
            return `<div class="setting-row"><label>${f.label}${hint}</label>
              <div class="img-inline img-card">
                <div class="img-thumb"><img src="${esc(val)}" onerror="this.style.opacity=.2" /></div>
                <label class="btn btn-ghost btn-sm"><i class="fa-solid fa-upload"></i> Качи / провлачи снимка
                  <input type="file" accept="image/*" data-imgkey="${f.key}" hidden /></label>
              </div></div>`;
          }
          const input = f.textarea
            ? `<textarea data-autosave data-key="${f.key}" rows="2">${esc(val)}</textarea>`
            : `<input data-autosave data-key="${f.key}" value="${esc(val)}" />`;
          return `<div class="setting-row"><label>${f.label}${hint}</label>${input}</div>`;
        }).join('')}
      </div>
    </div>`).join('');
}

async function loadContent() {
  const s = await api('/settings');
  Object.entries(PAGE_CONTENT).forEach(([page, groups]) => {
    const mount = $('#content-' + page);
    if (mount) mount.innerHTML = renderContentGroups(groups, s);
  });
  // Dashboard accepting-patients toggle
  const accept = $('#acceptToggle');
  if (accept) accept.checked = s.accepting_patients !== 'false';
}

/* ============================================================
   Image upload — click OR drag-and-drop, for content + modal fields
   ============================================================ */
async function uploadFile(file) {
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch('/api/uploads', { method: 'POST', credentials: 'include', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Грешка при качване');
  return data.url;
}

// Inline content image (saves the URL straight to settings).
async function setInlineImage(card, file) {
  if (!file || !file.type.startsWith('image/')) { toast('Моля, пуснете изображение.', 'error'); return; }
  const input = card.querySelector('input[data-imgkey]');
  const img = card.querySelector('.img-thumb img');
  const key = input.dataset.imgkey;
  card.classList.add('uploading');
  try {
    const url = await uploadFile(file);
    await api('/settings', { method: 'PUT', body: JSON.stringify({ [key]: url }) });
    if (img) { img.src = url + '?t=' + Date.now(); img.style.opacity = 1; }
    toast('Снимката е сменена.');
  } catch (ex) { toast(ex.message, 'error'); }
  finally { card.classList.remove('uploading'); input.value = ''; }
}

// Modal image field (stores URL in the hidden input; saved on form submit).
async function setModalImage(field, file) {
  if (!file || !file.type.startsWith('image/')) { toast('Моля, пуснете изображение.', 'error'); return; }
  field.classList.add('uploading');
  try {
    const url = await uploadFile(file);
    const hidden = field.querySelector('input[type=hidden]');
    const prev = field.querySelector('.img-field-preview');
    if (hidden) hidden.value = url;
    if (prev) { prev.src = url + '?t=' + Date.now(); prev.style.opacity = 1; }
    toast('Снимката е качена.');
  } catch (ex) { toast(ex.message, 'error'); }
  finally { field.classList.remove('uploading'); }
}

// Click-to-upload (delegated change).
document.addEventListener('change', (e) => {
  const input = e.target;
  if (!input.matches) return;
  if (input.matches('input[type=file][data-imgkey]')) {
    const f = input.files[0]; if (f) setInlineImage(input.closest('.img-card'), f);
  } else if (input.matches('.img-field-file')) {
    const f = input.files[0]; if (f) setModalImage(input.closest('.img-field'), f);
  }
});

// Drag-and-drop onto an image field.
['dragenter', 'dragover'].forEach((ev) => document.addEventListener(ev, (e) => {
  const dz = e.target.closest && e.target.closest('.img-inline, .img-field');
  if (dz) { e.preventDefault(); dz.classList.add('dragover'); }
}));
document.addEventListener('dragleave', (e) => {
  const dz = e.target.closest && e.target.closest('.img-inline, .img-field');
  if (dz && !dz.contains(e.relatedTarget)) dz.classList.remove('dragover');
});
document.addEventListener('drop', (e) => {
  const dz = e.target.closest && e.target.closest('.img-inline, .img-field');
  if (!dz) return;
  e.preventDefault();
  dz.classList.remove('dragover');
  const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (!file) return;
  if (dz.matches('.img-inline')) setInlineImage(dz, file);
  else setModalImage(dz, file);
});
// Stop the browser from opening files dropped elsewhere on the page.
document.addEventListener('dragover', (e) => { if (e.dataTransfer) e.preventDefault(); });
document.addEventListener('drop', (e) => { if (!(e.target.closest && e.target.closest('.img-inline, .img-field'))) e.preventDefault(); });

/* ---------- Auto-save for [data-autosave] text fields ---------- */
const saveTimers = {};
document.addEventListener('input', (e) => {
  const el = e.target;
  if (!el.matches || !el.matches('[data-autosave][data-key]')) return;
  const key = el.dataset.key;
  showSaving(el, 'saving');
  clearTimeout(saveTimers[key]);
  saveTimers[key] = setTimeout(async () => {
    try {
      await api('/settings', { method: 'PUT', body: JSON.stringify({ [key]: el.value }) });
      showSaving(el, 'saved');
    } catch (ex) {
      showSaving(el, 'error');
    }
  }, 650);
});

function showSaving(el, state) {
  const row = el.closest('.setting-row');
  if (!row) return;
  let badge = row.querySelector('.save-badge');
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'save-badge';
    (row.querySelector('label') || row).appendChild(badge);
  }
  if (state === 'saving') { badge.textContent = '… запазва се'; badge.className = 'save-badge saving'; }
  else if (state === 'saved') { badge.textContent = '✓ запазено'; badge.className = 'save-badge saved'; setTimeout(() => { badge.textContent = ''; }, 1800); }
  else { badge.textContent = '⚠ грешка'; badge.className = 'save-badge error'; }
}

/* ============================================================
   Generic collections (team / gallery / faq / why) — full CRUD
   ============================================================ */
const COLLECTIONS = {
  team: {
    ep: '/team', title: 'Членове на екипа', addLabel: 'Нов член',
    columns: ['Снимка', 'Име', 'Специалност', 'Видим'],
    fields: [
      { key: 'name', label: 'Име', type: 'text', required: true },
      { key: 'role', label: 'Специалност', type: 'text' },
      { key: 'bio', label: 'Кратко описание (биография)', type: 'textarea' },
      { key: 'image', label: 'Снимка', type: 'image' },
    ],
    row: (it) => `<td><img class="mini-thumb" src="${esc(it.image || '')}" onerror="this.style.opacity=.2"></td><td>${esc(it.name)}</td><td>${esc(it.role || '')}</td><td>${it.visible ? '✅' : '🚫'}</td>`,
  },
  gallery: {
    ep: '/gallery', title: 'Снимки в галерията', addLabel: 'Нова снимка',
    columns: ['Снимка', 'Надпис', 'Видима'],
    fields: [
      { key: 'image', label: 'Снимка', type: 'image', required: true },
      { key: 'caption', label: 'Надпис (по избор)', type: 'text' },
    ],
    row: (it) => `<td><img class="mini-thumb" src="${esc(it.image || '')}" onerror="this.style.opacity=.2"></td><td>${esc(it.caption || '')}</td><td>${it.visible ? '✅' : '🚫'}</td>`,
  },
  faq: {
    ep: '/faq', title: 'Въпроси и отговори', addLabel: 'Нов въпрос',
    columns: ['Въпрос', 'Отговор', 'Видим'],
    fields: [
      { key: 'question', label: 'Въпрос', type: 'text', required: true },
      { key: 'answer', label: 'Отговор', type: 'textarea', required: true },
    ],
    row: (it) => `<td><strong>${esc(it.question)}</strong></td><td style="max-width:380px;color:var(--muted)">${esc((it.answer || '').slice(0, 90))}${(it.answer || '').length > 90 ? '…' : ''}</td><td>${it.visible ? '✅' : '🚫'}</td>`,
  },
  why: {
    ep: '/why', title: 'Причини („Защо да изберете нас")', addLabel: 'Нова причина',
    columns: ['Заглавие', 'Текст', 'Видима'],
    fields: [
      { key: 'title', label: 'Заглавие', type: 'text', required: true },
      { key: 'text', label: 'Текст', type: 'textarea' },
    ],
    row: (it) => `<td><strong>${esc(it.title)}</strong></td><td style="max-width:380px;color:var(--muted)">${esc((it.text || '').slice(0, 90))}${(it.text || '').length > 90 ? '…' : ''}</td><td>${it.visible ? '✅' : '🚫'}</td>`,
  },
};
const collectionCache = {};

async function loadCollection(name) {
  const cfg = COLLECTIONS[name];
  const items = await api(cfg.ep + '/all');
  collectionCache[name] = items;
  const rows = items.length
    ? items.map((it) => `<tr>${cfg.row(it)}<td class="row-actions">
        <button class="btn btn-sm btn-ghost" data-edit-col="${name}" data-id="${it.id}"><i class="fa-solid fa-pen"></i></button>
        <button class="btn btn-sm btn-danger" data-del-col="${name}" data-id="${it.id}"><i class="fa-solid fa-trash"></i></button>
      </td></tr>`).join('')
    : `<tr><td colspan="${cfg.columns.length + 1}" style="text-align:center;color:var(--muted);padding:24px">Все още няма записи. Натиснете „${cfg.addLabel}".</td></tr>`;
  $('#col-' + name).innerHTML = `
    <div class="panel-box">
      <div class="toolbar"><h3 style="margin:0">${cfg.title}</h3><span class="spacer"></span>
        <button class="btn btn-primary btn-sm" data-add-col="${name}"><i class="fa-solid fa-plus"></i> ${cfg.addLabel}</button></div>
      <div class="table-wrap"><table>
        <thead><tr>${cfg.columns.map((c) => `<th>${c}</th>`).join('')}<th>Действия</th></tr></thead>
        <tbody>${rows}</tbody></table></div>
    </div>`;
}

function imageFieldHtml(f, val) {
  return `<div>
    <label>${f.label}</label>
    <div class="img-field">
      <img class="img-field-preview" src="${esc(val || '')}" onerror="this.style.opacity=.2" />
      <label class="btn btn-ghost btn-sm"><i class="fa-solid fa-upload"></i> Качи / провлачи снимка
        <input type="file" accept="image/*" class="img-field-file" hidden /></label>
      <input type="hidden" name="${f.key}" value="${esc(val || '')}" />
    </div>
  </div>`;
}

function collectionModal(name, id) {
  const cfg = COLLECTIONS[name];
  const item = id ? (collectionCache[name] || []).find((x) => String(x.id) === String(id)) : {};
  const fieldsHtml = cfg.fields.map((f) => {
    const val = item[f.key] != null ? item[f.key] : '';
    if (f.type === 'image') return imageFieldHtml(f, val);
    if (f.type === 'textarea') return `<div><label>${f.label}${f.required ? ' *' : ''}</label><textarea name="${f.key}" rows="3" ${f.required ? 'required' : ''}>${esc(val)}</textarea></div>`;
    return `<div><label>${f.label}${f.required ? ' *' : ''}</label><input name="${f.key}" value="${esc(val)}" ${f.required ? 'required' : ''} /></div>`;
  }).join('');
  openModal(`
    <h3>${id ? 'Редакция' : cfg.addLabel}</h3>
    <form class="admin-form" id="colForm">
      ${fieldsHtml}
      <div class="grid2">
        <div><label>Подредба</label><input name="sort_order" type="number" value="${item.sort_order ?? 0}" /></div>
        <label class="toggle" style="align-self:end"><input type="checkbox" name="visible" ${item.visible !== false ? 'checked' : ''} /> Видим на сайта</label>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" onclick="window._closeModal()">Отказ</button>
        <button type="submit" class="btn btn-primary">Запази</button>
      </div>
    </form>`);

  // (Image upload — click or drag-drop — handled by the global delegated handlers.)

  $('#colForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { sort_order: Number(fd.get('sort_order')) || 0, visible: fd.get('visible') === 'on' };
    cfg.fields.forEach((f) => { payload[f.key] = fd.get(f.key) || ''; });
    try {
      if (id) await api(cfg.ep + '/' + id, { method: 'PUT', body: JSON.stringify(payload) });
      else await api(cfg.ep, { method: 'POST', body: JSON.stringify(payload) });
      toast('Записано.'); closeModal(); loadCollection(name);
    } catch (ex) { toast(ex.message, 'error'); }
  });
}

async function deleteCollection(name, id) {
  if (!confirm('Сигурни ли сте, че искате да изтриете записа?')) return;
  try { await api(COLLECTIONS[name].ep + '/' + id, { method: 'DELETE' }); toast('Изтрито.'); loadCollection(name); }
  catch (ex) { toast(ex.message, 'error'); }
}

// Delegated handlers for collection add/edit/delete.
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add-col]');
  const edit = e.target.closest('[data-edit-col]');
  const del = e.target.closest('[data-del-col]');
  if (add) collectionModal(add.dataset.addCol, null);
  else if (edit) collectionModal(edit.dataset.editCol, edit.dataset.id);
  else if (del) deleteCollection(del.dataset.delCol, del.dataset.id);
});

/* ============================================================
   Stats
   ============================================================ */
async function loadStats() {
  try {
    const s = await api('/stats');
    $('#statCards').innerHTML = `
      <div class="card c1"><div class="ci"><i class="fa-solid fa-calendar-week"></i></div><div class="v">${s.week}</div><div class="k">Заявки тази седмица</div></div>
      <div class="card c2"><div class="ci"><i class="fa-solid fa-calendar-days"></i></div><div class="v">${s.month}</div><div class="k">Заявки този месец</div></div>
      <div class="card c3"><div class="ci"><i class="fa-solid fa-layer-group"></i></div><div class="v">${s.total}</div><div class="k">Общо заявки</div></div>
      <div class="card c4"><div class="ci"><i class="fa-solid fa-bell"></i></div><div class="v">${s.statusCounts.new}</div><div class="k">Нови (чакат отговор)</div></div>`;
    const max = Math.max(1, ...s.topServices.map((t) => t.count));
    $('#topChart').innerHTML = s.topServices.length
      ? s.topServices.map((t) => `<div class="bar-row"><span class="name">${esc(t.service)}</span><div class="bar-track"><div class="bar-fill" style="width:${(t.count / max) * 100}%"></div></div><span>${t.count}</span></div>`).join('')
      : '<p style="color:var(--muted)">Все още няма данни.</p>';
  } catch (e) { /* unauthorized handled in api() */ }
}

/* ---------- Boot ---------- */
function loadAll() {
  loadStats(); loadAppointments(); loadCalendar(); loadServices(); loadReviews(); loadContent();
  loadCollection('team'); loadCollection('gallery'); loadCollection('faq'); loadCollection('why');
}

/* ============================================================
   Admin calendar — appointments by day
   ============================================================ */
const ADMIN_MONTHS = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
const ADMIN_WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
let calData = {};            // iso -> [appointments]
const calNow = new Date();
let calY = calNow.getFullYear(), calM = calNow.getMonth();
let calSelected = null;

function isoOf(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

async function loadCalendar() {
  const all = await api('/appointments');
  calData = {};
  all.forEach((a) => { (calData[a.preferred_date] = calData[a.preferred_date] || []).push(a); });
  renderAdminCalendar();
}

function renderAdminCalendar() {
  const wrap = $('#adminCalWrap');
  if (!wrap) return;
  const first = new Date(calY, calM, 1);
  const startWd = (first.getDay() + 6) % 7;
  const days = new Date(calY, calM + 1, 0).getDate();
  const todayIso = isoOf(new Date());

  let cells = '';
  for (let i = 0; i < startWd; i++) cells += '<span class="acal-cell acal-empty"></span>';
  for (let d = 1; d <= days; d++) {
    const iso = isoOf(new Date(calY, calM, d));
    const list = calData[iso] || [];
    const news = list.filter((a) => a.status === 'new').length;
    const cls = ['acal-cell', 'acal-day'];
    if (iso === todayIso) cls.push('today');
    if (iso === calSelected) cls.push('selected');
    if (list.length) cls.push('has');
    const badge = list.length ? `<span class="acal-badge${news ? ' has-new' : ''}">${list.length}</span>` : '';
    cells += `<button type="button" class="${cls.join(' ')}" data-iso="${iso}"><span class="acal-num">${d}</span>${badge}</button>`;
  }

  wrap.innerHTML = `
    <div class="acal-head">
      <button class="btn btn-ghost btn-sm" data-cnav="-1"><i class="fa-solid fa-chevron-left"></i></button>
      <h3 style="margin:0">${ADMIN_MONTHS[calM]} ${calY}</h3>
      <button class="btn btn-ghost btn-sm" data-cnav="1"><i class="fa-solid fa-chevron-right"></i></button>
    </div>
    <div class="acal-grid acal-wd">${ADMIN_WD.map((w) => `<span class="acal-cell acal-wd-label">${w}</span>`).join('')}</div>
    <div class="acal-grid">${cells}</div>`;

  wrap.querySelectorAll('[data-cnav]').forEach((b) => b.addEventListener('click', () => {
    calM += Number(b.dataset.cnav);
    if (calM < 0) { calM = 11; calY--; }
    if (calM > 11) { calM = 0; calY++; }
    renderAdminCalendar();
  }));
  wrap.querySelectorAll('.acal-day').forEach((b) => b.addEventListener('click', () => {
    calSelected = b.dataset.iso;
    renderAdminCalendar();
    renderCalDay(calSelected);
  }));
}

function renderCalDay(iso) {
  const box = $('#adminCalDay');
  const list = (calData[iso] || []).slice().sort((a, b) => (a.preferred_time || '').localeCompare(b.preferred_time || ''));
  const statusLabel = { new: 'Нова', confirmed: 'Потвърдена', cancelled: 'Отказана' };
  const [y, m, d] = iso.split('-');
  box.innerHTML = `<h3>${d}.${m}.${y} — ${list.length} ${list.length === 1 ? 'час' : 'часа'}</h3>` + (list.length
    ? `<div class="cal-day-list">${list.map((a) => `
        <div class="cal-day-item ${a.status}">
          <div class="cal-day-time">${esc(a.preferred_time)}</div>
          <div class="cal-day-info">
            <strong>${esc(a.full_name)}</strong> <span class="badge ${a.status}">${statusLabel[a.status]}</span><br>
            <a href="tel:${esc(a.phone)}" style="color:var(--primary-light)">${esc(a.phone)}</a> · ${esc(a.service)}
            ${a.note ? `<br><span style="color:var(--muted);font-size:.82rem">${esc(a.note)}</span>` : ''}
          </div>
          <div class="row-actions">
            ${a.status !== 'confirmed' ? `<button class="btn btn-sm btn-primary" data-confirm="${a.id}">Потвърди</button>` : ''}
            ${a.status !== 'cancelled' ? `<button class="btn btn-sm btn-ghost" data-cancel="${a.id}">Откажи</button>` : ''}
          </div>
        </div>`).join('')}</div>`
    : '<p style="color:var(--muted)">Няма записани часове за този ден.</p>');

  box.querySelectorAll('[data-confirm]').forEach((b) => b.addEventListener('click', async () => { await setStatus(b.dataset.confirm, 'confirmed'); await loadCalendar(); renderCalDay(iso); }));
  box.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => { await setStatus(b.dataset.cancel, 'cancelled'); await loadCalendar(); renderCalDay(iso); }));
}

(async function init() {
  try {
    const me = await api('/auth/me');
    setUser(me.username);
    showApp();
    loadAll();
  } catch { showLogin(); }
})();
