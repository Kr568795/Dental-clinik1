/* ============================================================
   components.js — shared chrome injected on every page:
   header (nav), footer, floating UI, lightbox container.
   Loaded BEFORE main.js so its behaviour can wire these elements.
   ============================================================ */
(function () {
  const NAV = [
    { href: '/', label: 'Начало' },
    { href: '/services', label: 'Услуги' },
    { href: '/about', label: 'За нас' },
    { href: '/team', label: 'Екип' },
    { href: '/gallery', label: 'Галерия' },
    { href: '/contact', label: 'Контакт' },
  ];

  const path = (location.pathname.replace(/\/+$/, '') || '/');
  const isActive = (href) => (href === '/' ? path === '/' : path === href || path.startsWith(href + '/'));

  const navLinks = NAV.map((n) => `<li><a href="${n.href}"${isActive(n.href) ? ' class="active"' : ''}>${n.label}</a></li>`).join('');
  const mobileLinks = NAV.map((n) => `<a href="${n.href}"${isActive(n.href) ? ' class="active"' : ''}>${n.label}</a>`).join('');

  /* ---------- Header (nav + info bar on top, sticky) ---------- */
  const header = document.getElementById('siteHeader');
  if (header) {
    header.innerHTML = `
      <div class="site-head" id="siteHead">
        <nav class="nav" id="nav">
          <div class="container">
            <a href="/" class="logo">
              <img src="/images/logo.svg" alt="MNL лого" data-img="img_logo" />
              <span class="logo-text">Дентални клиники<br /><small>MNL · Младост 4</small></span>
            </a>
            <ul class="nav-links">${navLinks}</ul>
            <div class="nav-cta">
              <a href="/contact" class="btn btn-primary pulse">Запази час <i class="fa-solid fa-arrow-right"></i></a>
              <button class="burger" id="burger" aria-label="Меню"><span></span><span></span><span></span></button>
            </div>
          </div>
        </nav>
        <div class="topbar-info">
          <div class="container info-bar-grid">
            <div class="info-bar-item">
              <div class="info-bar-ico"><i class="fa-solid fa-location-dot"></i></div>
              <div><strong>Адрес</strong><span data-content="address">бл. 418, Младост 4, вх. 1 – партер, 1715 София</span></div>
            </div>
            <a class="info-bar-item" href="tel:+359897288776">
              <div class="info-bar-ico"><i class="fa-solid fa-phone"></i></div>
              <div><strong data-content="phone">089 728 8776</strong><span>Позвънете днес!</span></div>
            </a>
            <div class="info-bar-item">
              <div class="info-bar-ico"><i class="fa-solid fa-clock"></i></div>
              <div><strong>Работно време</strong><span data-content="working_hours">Пон–Пет: 09:00–18:00</span></div>
            </div>
            <a class="info-bar-item info-bar-cta" href="/contact">
              <div class="info-bar-ico"><i class="fa-solid fa-calendar-check"></i></div>
              <div><strong>Запазете час</strong><span>Онлайн, бързо и лесно</span></div>
            </a>
          </div>
        </div>
      </div>
      <div class="mobile-menu" id="mobileMenu">
        <button class="close" id="menuClose" aria-label="Затвори">&times;</button>
        ${mobileLinks}
        <a href="/contact" class="btn btn-primary">Запази час</a>
      </div>`;
  }

  /* ---------- Footer (with persistent info bar on top) ---------- */
  const footer = document.getElementById('siteFooter');
  if (footer) {
    footer.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div>
              <div class="logo" style="margin-bottom:6px"><img src="/images/logo.svg" alt="MNL" style="width:40px" data-img="img_logo" /></div>
              <div class="brand-text">Дентални клиники MNL</div>
              <p data-content="footer_desc">Вашата усмивка заслужава най-доброто. Модерна дентална грижа в сърцето на Младост 4, София.</p>
              <div class="social">
                <a href="#" aria-label="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
                <a href="#" aria-label="Instagram"><i class="fa-brands fa-instagram"></i></a>
                <a href="https://www.google.com/maps" target="_blank" rel="noopener" aria-label="Google Maps"><i class="fa-solid fa-location-dot"></i></a>
              </div>
            </div>
            <div>
              <h4>Страници</h4>
              <ul class="footer-links">
                <li><a href="/services">Услуги</a></li>
                <li><a href="/about">За нас</a></li>
                <li><a href="/team">Екип</a></li>
                <li><a href="/gallery">Галерия</a></li>
                <li><a href="/contact">Контакт</a></li>
              </ul>
            </div>
            <div>
              <h4>Услуги</h4>
              <ul class="footer-links" id="footerServices"></ul>
            </div>
            <div>
              <h4>Контакт</h4>
              <ul class="footer-links">
                <li><i class="fa-solid fa-location-dot"></i> <span data-content="address">бл. 418, Младост 4, София</span></li>
                <li><a href="tel:+359897288776"><i class="fa-solid fa-phone"></i> <span data-content="phone">089 728 8776</span></a></li>
                <li><i class="fa-solid fa-clock"></i> <span data-content="working_hours">Пон–Пет: 09:00–18:00</span></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">© <span id="year"></span> Дентални клиники MNL. Всички права запазени.</div>
        </div>
      </footer>`;
  }

  /* ---------- Floating UI + lightbox (appended to body) ---------- */
  const extras = document.createElement('div');
  extras.innerHTML = `
    <div id="scroll-progress"></div>
    <a href="tel:+359897288776" class="float-call" aria-label="Обади се"><i class="fa-solid fa-phone"></i></a>
    <button class="back-top" id="backTop" aria-label="Нагоре"><i class="fa-solid fa-arrow-up"></i></button>
    <div class="cookie-banner" id="cookieBanner">
      <p>Използваме бисквитки, за да подобрим вашето изживяване. Като продължите, се съгласявате с използването им.</p>
      <div class="cookie-actions">
        <button class="btn btn-primary" id="cookieAccept">Приемам</button>
        <button class="btn btn-outline" id="cookieDecline">Откажи</button>
      </div>
    </div>
    <div class="lightbox" id="lightbox">
      <button class="lb-btn lb-close" id="lbClose">&times;</button>
      <button class="lb-btn lb-prev" id="lbPrev">‹</button>
      <img src="" alt="" id="lbImg" />
      <button class="lb-btn lb-next" id="lbNext">›</button>
    </div>`;
  while (extras.firstChild) document.body.appendChild(extras.firstChild);

  /* ---------- Chrome behaviour ---------- */
  const siteHead = document.getElementById('siteHead');
  const progress = document.getElementById('scroll-progress');
  const backTop = document.getElementById('backTop');

  // Push page content below the fixed header (height is dynamic / responsive).
  function syncHeadOffset() {
    if (siteHead) document.body.style.paddingTop = siteHead.offsetHeight + 'px';
  }
  syncHeadOffset();
  window.addEventListener('load', syncHeadOffset);
  window.addEventListener('resize', syncHeadOffset);

  // Hide the header when scrolling down (frees up screen), reveal when scrolling
  // up; the info bar only shows at the very top of the page.
  let lastY = window.scrollY;
  if (siteHead) siteHead.classList.add('at-top');
  function onScroll() {
    const y = window.scrollY;
    if (siteHead) {
      siteHead.classList.toggle('at-top', y < 60);
      if (y > lastY && y > 160) siteHead.classList.add('hidden');
      else if (y < lastY) siteHead.classList.remove('hidden');
    }
    if (backTop) backTop.classList.toggle('show', y > 300);
    if (progress) {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  if (backTop) backTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const mobileMenu = document.getElementById('mobileMenu');
  const burger = document.getElementById('burger');
  const menuClose = document.getElementById('menuClose');
  if (burger) burger.addEventListener('click', () => mobileMenu.classList.add('open'));
  if (menuClose) menuClose.addEventListener('click', () => mobileMenu.classList.remove('open'));

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const cookieBanner = document.getElementById('cookieBanner');
  if (cookieBanner && !localStorage.getItem('mnl_cookie')) setTimeout(() => cookieBanner.classList.add('show'), 1200);
  const ca = document.getElementById('cookieAccept');
  const cd = document.getElementById('cookieDecline');
  if (ca) ca.addEventListener('click', () => { localStorage.setItem('mnl_cookie', 'accepted'); cookieBanner.classList.remove('show'); });
  if (cd) cd.addEventListener('click', () => { localStorage.setItem('mnl_cookie', 'declined'); cookieBanner.classList.remove('show'); });

  /* ---------- Rich CTA bands (filled from data-attributes) ---------- */
  document.querySelectorAll('.cta-band[data-cta-title]').forEach((band) => {
    const title = band.getAttribute('data-cta-title');
    const text = band.getAttribute('data-cta-text') || '';
    const eyebrow = band.getAttribute('data-cta-eyebrow') || 'Запазете час';
    band.innerHTML = `
      <div class="cta-inner">
        <span class="cta-eyebrow">${eyebrow}</span>
        <h2>${title}</h2>
        <p>${text}</p>
        <div class="cta-actions">
          <a href="/contact" class="btn btn-gold btn-lg">Запазете час онлайн <i class="fa-solid fa-arrow-right"></i></a>
          <a href="tel:+359897288776" class="btn cta-call"><i class="fa-solid fa-phone"></i> <span data-content="phone">089 728 8776</span></a>
        </div>
        <div class="cta-trust"><i class="fa-solid fa-star"></i> <span data-content="rating_value">4.5</span>/5 · <span data-content="review_count">33</span> отзива · <i class="fa-solid fa-check"></i> Без болка · <i class="fa-solid fa-check"></i> Модерно оборудване</div>
      </div>`;
  });
})();
