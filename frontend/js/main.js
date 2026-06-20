/* ============================================================
   main.js — shared state, nav, counters, services/reviews,
   gallery lightbox, FAQ, floating UI
   ============================================================ */

// Shared app state other modules read from (services list, settings).
window.MNL = { services: [], settings: {}, api: '/api' };

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

async function api(path, opts = {}) {
  const res = await fetch(MNL.api + path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error('API ' + res.status);
  return res.json();
}
window.mnlApi = api;

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}
window.escapeHtml = escapeHtml;

/* ---------- Currency: stored amounts are BGN; display EUR as primary ---------- */
const EUR_RATE = 1.95583; // fixed BGN per EUR
function eur(bgn) { return Math.round(Number(bgn) / EUR_RATE); }
// Returns "X–Y € (X–Y лв.)" with EUR primary; handles single values too.
function priceLabel(min, max) {
  if (min == null || max == null) return '';
  const eRange = Number(min) === Number(max) ? `${eur(min)} €` : `${eur(min)}–${eur(max)} €`;
  const bRange = Number(min) === Number(max) ? `${min} лв.` : `${min}–${max} лв.`;
  return `<span class="px-eur">${eRange}</span> <span class="px-bgn">${bRange}</span>`;
}
function priceFrom(bgn) {
  return `<span class="px-eur">от ${eur(bgn)} €</span> <span class="px-bgn">${bgn} лв.</span>`;
}
window.eur = eur;
window.priceLabel = priceLabel;

/* ---------- AOS ---------- */
if (window.AOS) AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 60 });

// Note: nav, mobile menu, scroll progress, back-to-top, cookie banner and the
// footer year are injected & wired by components.js (shared across pages).

/* ---------- Parallax hero (desktop only — feels janky on mobile) ---------- */
const heroPhoto = $('#heroPhoto');
window.addEventListener('scroll', () => {
  if (heroPhoto && window.innerWidth > 980 && window.scrollY < window.innerHeight) {
    heroPhoto.style.transform = `translateY(${window.scrollY * 0.06}px)`;
  } else if (heroPhoto) {
    heroPhoto.style.transform = '';
  }
}, { passive: true });

/* ---------- Animated counters ---------- */
function animateCounter(el) {
  const target = parseFloat(el.dataset.count);
  const decimals = parseInt(el.dataset.decimals || '0', 10);
  const suffix = el.dataset.suffix || '';
  const dur = 1600;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else el.textContent = target.toFixed(decimals) + suffix;
  }
  requestAnimationFrame(tick);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { animateCounter(e.target); counterObserver.unobserve(e.target); }
  });
}, { threshold: 0.5 });
$$('[data-count]').forEach((el) => counterObserver.observe(el));

/* ---------- FAQ accordion (re-bindable after dynamic render) ---------- */
function initFaqAccordion() {
  $$('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const ans = btn.nextElementSibling;
      const isOpen = item.classList.contains('open');
      $$('.faq-item').forEach((i) => { i.classList.remove('open'); i.querySelector('.faq-a').style.maxHeight = null; });
      if (!isOpen) { item.classList.add('open'); ans.style.maxHeight = ans.scrollHeight + 'px'; }
    });
  });
}

/* ---------- Gallery lightbox (galleryImgs refreshed after render) ---------- */
let galleryImgs = [];
const lightbox = $('#lightbox');
const lbImg = $('#lbImg');
let lbIndex = 0;
function openLb(i) { lbIndex = i; lbImg.src = galleryImgs[i].src; lightbox.classList.add('open'); }
function moveLb(d) { lbIndex = (lbIndex + d + galleryImgs.length) % galleryImgs.length; lbImg.src = galleryImgs[lbIndex].src; }
function initLightbox() {
  galleryImgs = $$('#galleryGrid img');
  galleryImgs.forEach((img, i) => img.addEventListener('click', () => openLb(i)));
}
$('#lbClose').addEventListener('click', () => lightbox.classList.remove('open'));
$('#lbPrev').addEventListener('click', () => moveLb(-1));
$('#lbNext').addEventListener('click', () => moveLb(1));
lightbox.addEventListener('click', (e) => { if (e.target === lightbox) lightbox.classList.remove('open'); });
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') lightbox.classList.remove('open');
  if (e.key === 'ArrowLeft') moveLb(-1);
  if (e.key === 'ArrowRight') moveLb(1);
});

/* ---------- Render services (grouped into category accordion) ---------- */
const CAT_ICONS = {
  'Профилактика и диагностика': 'fa-stethoscope',
  'Лечение и възстановяване': 'fa-teeth',
  'Естетика и ортодонтия': 'fa-wand-magic-sparkles',
  'Хирургия и импланти': 'fa-user-doctor',
};

function serviceCardHtml(s) {
  const price = (s.price_min != null && s.price_max != null) ? priceLabel(s.price_min, s.price_max) : '';
  return `<div class="service-card">
    <div class="ico"><i class="fa-solid ${escapeHtml(s.icon || 'fa-tooth')}"></i></div>
    <h3>${escapeHtml(s.name)}</h3>
    <p>${escapeHtml(s.description || '')}</p>
    ${price ? `<div class="price">${price}</div>` : ''}
    <a href="/contact?service=${encodeURIComponent(s.name)}" class="more">Запази час <i class="fa-solid fa-arrow-right"></i></a>
  </div>`;
}

// Home page: showcase services as 4 category cards (more visual than the list).
function renderServicePreview() {
  const mount = $('#servicesPreview');
  if (!mount) return;
  if (!MNL.services.length) { mount.innerHTML = ''; return; }
  const order = [];
  const groups = {};
  MNL.services.forEach((s) => {
    const cat = (s.category && s.category.trim()) || 'Други услуги';
    if (!groups[cat]) { groups[cat] = []; order.push(cat); }
    groups[cat].push(s);
  });
  mount.innerHTML = order.map((cat, i) => {
    const list = groups[cat];
    const prices = list.map((s) => s.price_min).filter((p) => p != null && p > 0);
    const from = prices.length ? Math.min(...prices) : null;
    return `<a class="cat-card" href="/services" data-aos="fade-up" data-aos-delay="${(i % 4) * 70}">
      <div class="cat-card-top">
        <div class="cat-card-ico"><i class="fa-solid ${CAT_ICONS[cat] || 'fa-tooth'}"></i></div>
        <span class="cat-card-count">${list.length} услуги</span>
      </div>
      <h3>${escapeHtml(cat)}</h3>
      <p class="cat-card-list">${list.slice(0, 4).map((s) => escapeHtml(s.name)).join(' · ')}</p>
      <div class="cat-card-foot">
        ${from != null ? `<span class="cat-card-price">${priceFrom(from)}</span>` : '<span></span>'}
        <span class="cat-card-link">Вижте услугите <i class="fa-solid fa-arrow-right"></i></span>
      </div>
    </a>`;
  }).join('');
  if (window.AOS) AOS.refresh();
}

function renderServices() {
  const grid = $('#servicesGrid');
  const footer = $('#footerServices');

  // Footer services list (present on every page via shared footer).
  if (footer && MNL.services.length) {
    footer.innerHTML = MNL.services.slice(0, 6).map((s) => `<li><a href="/services">${escapeHtml(s.name)}</a></li>`).join('');
  }
  // The accordion only renders where the services grid exists.
  if (!grid) return;
  if (!MNL.services.length) { grid.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Няма налични услуги.</p>'; return; }

  // Group by category, preserving first-seen order.
  const order = [];
  const groups = {};
  MNL.services.forEach((s) => {
    const cat = (s.category && s.category.trim()) || 'Други услуги';
    if (!groups[cat]) { groups[cat] = []; order.push(cat); }
    groups[cat].push(s);
  });

  grid.classList.remove('services-grid');
  grid.classList.add('svc-cats');
  grid.innerHTML = order.map((cat, idx) => `
    <div class="svc-cat${idx === 0 ? ' open' : ''}">
      <button class="svc-cat-head" type="button">
        <span class="svc-cat-ico"><i class="fa-solid ${CAT_ICONS[cat] || 'fa-tooth'}"></i></span>
        <span class="svc-cat-name">${escapeHtml(cat)}</span>
        <span class="svc-cat-count">${groups[cat].length} услуги</span>
        <i class="fa-solid fa-chevron-down svc-cat-arrow"></i>
      </button>
      <div class="svc-cat-body"><div class="services-grid">${groups[cat].map(serviceCardHtml).join('')}</div></div>
    </div>`).join('');

  const setMax = (body, open) => { body.style.maxHeight = open ? body.scrollHeight + 'px' : null; };
  $$('#servicesGrid .svc-cat').forEach((cat) => {
    const head = cat.querySelector('.svc-cat-head');
    const body = cat.querySelector('.svc-cat-body');
    if (cat.classList.contains('open')) setMax(body, true);
    head.addEventListener('click', () => {
      const open = cat.classList.toggle('open');
      setMax(body, open);
    });
  });
  // Keep open panels sized correctly on resize.
  window.addEventListener('resize', () => {
    $$('#servicesGrid .svc-cat.open .svc-cat-body').forEach((b) => { b.style.maxHeight = b.scrollHeight + 'px'; });
  });

  if (window.AOS) AOS.refresh();
}

/* ---------- Render reviews (Swiper) ---------- */
function renderReviews(reviews) {
  const wrap = $('#reviewsWrapper');
  if (!wrap) return;
  if (!reviews.length) { wrap.innerHTML = '<div class="swiper-slide"><div class="review-card"><p class="content">Все още няма отзиви.</p></div></div>'; return; }
  wrap.innerHTML = reviews.map((r) => {
    const initials = r.author_name.trim().charAt(0).toUpperCase();
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    return `<div class="swiper-slide"><div class="review-card">
      <div class="stars">${stars}</div>
      <p class="content">„${escapeHtml(r.content)}"</p>
      <div class="author"><div class="avatar">${escapeHtml(initials)}</div>
        <div><strong>${escapeHtml(r.author_name)}</strong><br /><small>${escapeHtml(r.date_text || '')}</small></div>
      </div>
    </div></div>`;
  }).join('');
  new Swiper('.reviews-swiper', {
    slidesPerView: 1, spaceBetween: 24, loop: reviews.length > 2,
    pagination: { el: '.swiper-pagination', clickable: true },
    autoplay: { delay: 5000 },
    breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
  });
}

/* ---------- Apply settings to the page ---------- */
function applySettings(s) {
  MNL.settings = s;

  // Generic CMS content: any element tagged data-content / data-img.
  $$('[data-content]').forEach((el) => {
    const v = s[el.dataset.content];
    if (v != null && v !== '') el.textContent = v;
  });
  $$('[data-img]').forEach((el) => {
    const v = s[el.dataset.img];
    if (v) el.src = v;
  });

  const setTxt = (sel, v) => { const el = $(sel); if (el && v != null) el.textContent = v; };
  const setAttr = (sel, attr, v) => { const el = $(sel); if (el && v != null) el[attr] = v; };
  if (s.rating_value) { setTxt('#heroRating', s.rating_value); setTxt('#floatRating', `${s.rating_value} / 5.0`); setTxt('#reviewsBig', s.rating_value); }
  if (s.review_count) { setTxt('#heroReviews', s.review_count); setTxt('#reviewsCount', s.review_count); }
  setTxt('#infoAddress', s.address);
  setTxt('#infoHours', s.working_hours);
  setTxt('#infoPhone', s.phone);
  if (s.phone_link) { setAttr('#infoPhone', 'href', 'tel:' + s.phone_link); setAttr('.float-call', 'href', 'tel:' + s.phone_link); }
  setAttr('#infoMap', 'src', s.google_maps_url);

  // Booking closed when not accepting patients
  if (s.accepting_patients === 'false') {
    const form = $('#bookingForm');
    if (form) form.innerHTML = '<div class="closed-notice"><i class="fa-solid fa-circle-info"></i> В момента не приемаме нови пациенти онлайн. Моля, обадете се на ' + escapeHtml(s.phone || '') + '.</div>';
  }
}

/* ---------- Before / After slider ---------- */
(function () {
  const slider = $('#baSlider');
  if (!slider) return;
  const before = $('#baBefore');
  const handle = $('#baHandle');
  let dragging = false;

  function setPos(clientX) {
    const rect = slider.getBoundingClientRect();
    let pct = ((clientX - rect.left) / rect.width) * 100;
    pct = Math.max(0, Math.min(100, pct));
    before.style.clipPath = `inset(0 ${100 - pct}% 0 0)`;
    handle.style.left = pct + '%';
  }
  const start = () => { dragging = true; slider.classList.add('dragging'); };
  const end = () => { dragging = false; slider.classList.remove('dragging'); };
  const move = (e) => {
    if (!dragging) return;
    const x = e.touches ? e.touches[0].clientX : e.clientX;
    setPos(x);
  };
  handle.addEventListener('mousedown', start);
  handle.addEventListener('touchstart', start, { passive: true });
  window.addEventListener('mouseup', end);
  window.addEventListener('touchend', end);
  window.addEventListener('mousemove', move);
  window.addEventListener('touchmove', move, { passive: true });
  // Click anywhere on the slider jumps the handle there.
  slider.addEventListener('click', (e) => { if (e.target !== handle && !handle.contains(e.target)) setPos(e.clientX); });
  // init at 50%
  before.style.clipPath = 'inset(0 50% 0 0)';
  handle.style.left = '50%';
})();

/* ---------- Render collections (team / gallery / why / faq) ---------- */
function renderTeam(members) {
  const grid = $('#teamGrid');
  if (!grid) return;
  if (!members.length) { grid.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Все още няма добавени членове.</p>'; return; }
  grid.innerHTML = members.map((m, i) => `
    <div class="team-member" data-aos="fade-up" data-aos-delay="${(i % 3) * 80}">
      <div class="team-photo"><img src="${escapeHtml(m.image || '/images/doctor.jpg')}" alt="${escapeHtml(m.name)}" loading="lazy" /></div>
      <div class="team-body">
        <h4>${escapeHtml(m.name)}</h4>
        <span class="team-role">${escapeHtml(m.role || '')}</span>
        ${m.bio ? `<p class="team-bio">${escapeHtml(m.bio)}</p>` : ''}
        <a href="/contact?service=${encodeURIComponent('Профилактичен преглед')}" class="btn btn-gold btn-sm">Запази час при мен</a>
      </div>
    </div>`).join('');
  if (window.AOS) AOS.refresh();
}

function renderGallery(images) {
  const wrap = $('#galleryGrid');
  if (!wrap) return;
  wrap.innerHTML = images.map((g) => `
    <div class="swiper-slide">
      <div class="story-card">
        <img src="${escapeHtml(g.image)}" alt="${escapeHtml(g.caption || 'Галерия')}" loading="lazy" draggable="false" />
        ${g.caption ? `<div class="story-cap">${escapeHtml(g.caption)}</div>` : ''}
        <div class="story-zoom"><i class="fa-solid fa-magnifying-glass-plus"></i></div>
      </div>
    </div>`).join('');

  if (window.gallerySwiper) window.gallerySwiper.destroy(true, true);
  window.gallerySwiper = new Swiper('.gallery-swiper', {
    slidesPerView: 1.25,
    spaceBetween: 18,
    grabCursor: true,
    pagination: { el: '.gallery-swiper .swiper-pagination', clickable: true },
    navigation: { nextEl: '.story-next', prevEl: '.story-prev' },
    breakpoints: { 600: { slidesPerView: 2.2 }, 900: { slidesPerView: 3.2 }, 1200: { slidesPerView: 4 } },
  });
  initLightbox();
}

const WHY_ICONS = ['fa-user-doctor', 'fa-heart-pulse', 'fa-x-ray', 'fa-clock', 'fa-location-dot', 'fa-comments', 'fa-tooth', 'fa-award'];

// Home page: premium "floating cards around the doctor" showcase.
function renderWhyShowcase(reasons) {
  const mount = $('#whyShowcase');
  if (!mount) return;
  const trim = (t, n) => { t = (t || '').trim(); return t.length > n ? t.slice(0, n - 1).trim() + '…' : t; };
  const r = (i) => reasons[i] || { title: '', text: '' };
  const cardBody = (item, icon, extra) => `
    <div class="wsc-ico"><i class="fa-solid ${icon}"></i></div>
    <h4>${escapeHtml(item.title)}</h4>
    <span class="wsc-divider"></span>${extra || ''}`;

  const avatars = `
    <div class="wsc-avatars">
      <img src="/images/doctor.jpg" alt="" /><img src="/images/doctor2.jpg" alt="" /><img src="/images/patient.jpg" alt="" /><img src="/images/smile.jpg" alt="" />
      <span class="wsc-avatar-more"><span data-content="patients_count">33</span>+</span>
    </div>`;

  mount.innerHTML = `
    <div class="wsc-card wsc-a">${cardBody(r(0), 'fa-user-doctor', avatars)}</div>
    <div class="wsc-card wsc-b">${cardBody(r(3), 'fa-clock')}</div>
    <div class="wsc-photo wsc-photo-area">
      <img src="/images/doctor.jpg" alt="Д-р Билял" data-img="img_why" />
      <span class="wsc-name" data-content="why_doctor_name">Д-р Билял</span>
      <div class="wsc-accent">
        <div class="wsc-accent-ico"><i class="fa-solid fa-heart"></i></div>
        <div><h4>${escapeHtml(r(4).title || 'Спокойствие без притеснение')}</h4><p>${escapeHtml(trim(r(4).text || 'Деликатен подход и внимание към детайла.', 60))}</p></div>
      </div>
    </div>
    <div class="wsc-card wsc-c">${cardBody(r(1), 'fa-tooth')}</div>
    <div class="wsc-card wsc-d">${cardBody(r(2), 'fa-comments')}</div>`;

  if (window.AOS) AOS.refresh();
}

function renderWhy(reasons) {
  // About page: elegant checklist.
  const ul = $('#whyChecklist');
  if (ul) ul.innerHTML = reasons.map((r) => `
    <li><span class="chk"><i class="fa-solid fa-check"></i></span>
      <div><h4>${escapeHtml(r.title)}</h4><p>${escapeHtml(r.text || '')}</p></div></li>`).join('');

  // Home page: interactive feature cards.
  const feat = $('#whyFeatures');
  if (feat) {
    feat.innerHTML = reasons.map((r, i) => `
      <div class="why-feature" data-aos="fade-up" data-aos-delay="${(i % 4) * 70}">
        <div class="why-feature-ico"><i class="fa-solid ${WHY_ICONS[i % WHY_ICONS.length]}"></i></div>
        <h4>${escapeHtml(r.title)}</h4>
        <p>${escapeHtml(r.text || '')}</p>
      </div>`).join('');
    if (window.AOS) AOS.refresh();
  }
}

function renderFaq(items) {
  const list = $('#faqList');
  if (!list) return;
  list.innerHTML = items.map((f) => `
    <div class="faq-item"><button class="faq-q"><span>${escapeHtml(f.question)}</span> <i class="fa-solid fa-plus"></i></button>
      <div class="faq-a"><p>${escapeHtml(f.answer)}</p></div></div>`).join('');
  initFaqAccordion();
}

/* ---------- Boot data ---------- */
(async function boot() {
  // Apply settings baked into the page by the server FIRST (instant, no wait),
  // so text/images are correct on first paint. The fetch below then refreshes.
  if (window.__MNL_SETTINGS__) {
    try { applySettings(window.__MNL_SETTINGS__); } catch (_e) { /* ignore */ }
  }
  try {
    const [services, reviews, settings, team, gallery, why, faq] = await Promise.all([
      api('/services'),
      api('/reviews'),
      api('/settings'),
      api('/team'),
      api('/gallery'),
      api('/why'),
      api('/faq'),
    ]);
    MNL.services = services;
    renderServices();
    renderServicePreview();
    renderReviews(reviews);
    renderTeam(team);
    renderGallery(gallery);
    renderWhy(why);
    renderWhyShowcase(why);
    renderFaq(faq);
    applySettings(settings);
    if (window.AOS) AOS.refresh();
    // Notify other modules data is ready
    document.dispatchEvent(new CustomEvent('mnl:ready', { detail: { services, settings } }));
  } catch (err) {
    console.error('Грешка при зареждане:', err);
  }
})();
