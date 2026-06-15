/* ============================================================
   tooth-chart.js — realistic interactive dental arch (FDI) + tools tabs
   ============================================================ */

/* ---------- Tools tab switching ---------- */
document.querySelectorAll('.tool-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tool-tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.tool-panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tool-' + tab.dataset.tool).classList.add('active');
    if (window.AOS) AOS.refresh();
  });
});

/* ---------- Tooth clinical info by type ---------- */
const TEETH = {
  incisor:  { name: 'Резец', problem: 'Кариес, счупване, естетика', treatment: 'Естетична пломба или фасета', service: 'Естетична стоматология' },
  canine:   { name: 'Кучешки зъб', problem: 'Износване, чувствителност', treatment: 'Възстановяване и профилактика', service: 'Лечение на кариес' },
  premolar: { name: 'Премолар', problem: 'Кариес, пукнатини', treatment: 'Пломба или коронка', service: 'Лечение на кариес' },
  molar:    { name: 'Молар (кътник)', problem: 'Дълбок кариес, ендодонтия', treatment: 'Лечение на коренови канали / коронка', service: 'Коронки и мостове' },
  wisdom:   { name: 'Мъдрец', problem: 'Ретиниран мъдрец, възпаление', treatment: 'Хирургично вадене', service: 'Вадене на зъби', specialist: 'Д-р Билял' },
};

/* ---------- Geometry (kept in sync with backend/scripts/tooth-svg.js) ---------- */
const UPPER = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

function toothType(fdi) {
  const p = fdi % 10;
  if (p === 8) return 'wisdom';
  if (p === 6 || p === 7) return 'molar';
  if (p === 4 || p === 5) return 'premolar';
  if (p === 3) return 'canine';
  return 'incisor';
}

const SHAPES = {
  incisor: 'M-10,-14 C-11,-6 -11,8 -9,12 C-7,15 7,15 9,12 C11,8 11,-6 10,-14 C5,-16 -5,-16 -10,-14 Z',
  canine: 'M-9,-14 C-10,-4 -9,6 -2,14.5 C-0.6,15.8 0.6,15.8 2,14.5 C9,6 10,-4 9,-14 C5,-16.5 -5,-16.5 -9,-14 Z',
  premolar: 'M-10,-13 C-12,-3 -12,7 -9,11 C-6,14.5 -2,12.5 0,10.5 C2,12.5 6,14.5 9,11 C12,7 12,-3 10,-13 C5,-16 -5,-16 -10,-13 Z',
  molar: 'M-14,-13 C-16,-3 -16,7 -13.5,11 C-11,14 -8,12.5 -5,10.8 C-2.5,9.4 2.5,9.4 5,10.8 C8,12.5 11,14 13.5,11 C16,7 16,-3 14,-13 C7,-16 -7,-16 -14,-13 Z',
};
SHAPES.wisdom = SHAPES.molar;
const SCALE = { incisor: 1.45, canine: 1.5, premolar: 1.5, molar: 1.62, wisdom: 1.5 };
const RING = { cx: 410, cy: 285 };

function archTeeth(fdis, cx, cy, rx, ry, aStart, aEnd) {
  const n = fdis.length;
  return fdis.map((fdi, i) => {
    const a = ((aStart + ((aEnd - aStart) * i) / (n - 1)) * Math.PI) / 180;
    const x = cx + rx * Math.cos(a);
    const y = cy + ry * Math.sin(a);
    const nrm = Math.atan2(y - RING.cy, x - RING.cx);
    const rot = (Math.atan2(RING.cy - y, RING.cx - x) * 180) / Math.PI - 90;
    const type = toothType(fdi);
    return { fdi, type, x, y, nrm, rot, s: SCALE[type] };
  });
}

function gumShape(list) {
  const inner = [], outer = [];
  const out = (t, r) => [t.x + Math.cos(t.nrm) * r, t.y + Math.sin(t.nrm) * r];
  list.forEach((t, i) => {
    inner.push(out(t, 2));
    if (i < list.length - 1) {
      const n = list[i + 1];
      const mx = (t.x + n.x) / 2, my = (t.y + n.y) / 2;
      const ang = Math.atan2(my - RING.cy, mx - RING.cx);
      inner.push([mx - Math.cos(ang) * 7, my - Math.sin(ang) * 7]);
    }
    outer.push(out(t, 40));
  });
  let d = `M ${inner[0][0].toFixed(1)},${inner[0][1].toFixed(1)}`;
  for (let i = 1; i < inner.length; i++) {
    const p = inner[i], prev = inner[i - 1];
    d += ` Q ${prev[0].toFixed(1)},${prev[1].toFixed(1)} ${((p[0] + prev[0]) / 2).toFixed(1)},${((p[1] + prev[1]) / 2).toFixed(1)}`;
  }
  d += ` L ${inner[inner.length - 1][0].toFixed(1)},${inner[inner.length - 1][1].toFixed(1)}`;
  for (let i = outer.length - 1; i >= 0; i--) d += ` L ${outer[i][0].toFixed(1)},${outer[i][1].toFixed(1)}`;
  return d + ' Z';
}

function buildChart() {
  const mount = document.getElementById('toothChart');
  if (!mount || mount.dataset.built) return;
  mount.dataset.built = '1';

  const upper = archTeeth(UPPER, 410, 280, 318, 176, 203, 337);
  const lower = archTeeth(LOWER, 410, 290, 296, 172, 157, 23);

  const row = (list) =>
    list
      .map((t) => `<g class="tooth-g" data-fdi="${t.fdi}" data-type="${t.type}" transform="translate(${t.x.toFixed(1)},${t.y.toFixed(1)})">
        <g transform="rotate(${t.rot.toFixed(1)}) scale(${t.s})"><path class="tooth${t.type === 'wisdom' ? ' wisdom' : ''}" d="${SHAPES[t.type]}"/><ellipse class="tooth-hi" cx="-3" cy="0" rx="2.3" ry="7"/></g>
        <text class="tooth-num" x="0" y="0" text-anchor="middle" dominant-baseline="central">${t.fdi}</text>
      </g>`)
      .join('');

  mount.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 580" class="tooth-svg" role="img" aria-label="Зъбна карта (FDI номерация)">
      <defs>
        <linearGradient id="toothGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#F4ECDC"/><stop offset="0.35" stop-color="#FFFFFF"/>
          <stop offset="0.8" stop-color="#F6FAF6"/><stop offset="1" stop-color="#E2EAE1"/>
        </linearGradient>
        <radialGradient id="gumGrad" cx="50%" cy="40%" r="70%">
          <stop offset="0" stop-color="#EFA9B7"/><stop offset="1" stop-color="#D27E91"/>
        </radialGradient>
        <filter id="toothShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.1" flood-color="#7a5560" flood-opacity="0.35"/>
        </filter>
        <filter id="gumShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#9c5566" flood-opacity="0.3"/>
        </filter>
      </defs>
      <text class="arch-label" x="410" y="24" text-anchor="middle">Горна челюст</text>
      <path class="gum" d="${gumShape(upper)}"/>
      ${row(upper)}
      <path class="gum" d="${gumShape(lower)}"/>
      ${row(lower)}
      <text class="arch-label" x="410" y="568" text-anchor="middle">Долна челюст</text>
    </svg>
    <div class="tooth-legend">
      <span><i class="dot normal"></i> Зъб — посочете за информация</span>
      <span><i class="dot pain"></i> Болен зъб (избран)</span>
      <span><i class="dot wisdom"></i> Мъдрец (Д-р Билял)</span>
    </div>
    <div class="tooth-tooltip" id="toothTooltip"></div>`;

  const tooltip = document.getElementById('toothTooltip');
  mount.querySelectorAll('.tooth-g').forEach((g) => {
    const fdi = g.dataset.fdi;
    const info = TEETH[g.dataset.type];
    g.addEventListener('mousemove', (e) => {
      tooltip.innerHTML = `<strong>Зъб ${fdi}</strong> · ${info.name} — ${info.problem}`;
      tooltip.style.left = e.clientX + 14 + 'px';
      tooltip.style.top = e.clientY - 12 + 'px';
      tooltip.classList.add('show');
    });
    g.addEventListener('mouseleave', () => tooltip.classList.remove('show'));
    g.addEventListener('click', () => {
      mount.querySelectorAll('.tooth-g').forEach((x) => x.classList.remove('selected'));
      g.classList.add('selected');
      openToothModal(fdi, info);
    });
  });
}

function openToothModal(fdi, info) {
  const specialist = info.specialist
    ? `<p style="margin-top:10px;color:var(--primary-dark);font-weight:600"><i class="fa-solid fa-user-doctor"></i> Специалист: ${info.specialist}</p>`
    : '';
  const html = `
    <div class="tooth-modal-overlay" id="toothModalOverlay" style="position:fixed;inset:0;background:rgba(15,31,20,.7);z-index:1300;display:grid;place-items:center;padding:20px">
      <div style="background:#fff;border-radius:var(--radius-lg);max-width:460px;width:100%;padding:34px;box-shadow:var(--shadow);animation:fade-up .3s ease">
        <div style="display:flex;justify-content:space-between;align-items:start;gap:14px">
          <div><span style="color:var(--primary);font-weight:700;letter-spacing:1px;font-size:.8rem">ЗЪБ № ${fdi}</span><h3 style="font-size:1.5rem">${info.name}</h3></div>
          <button id="toothModalClose" style="background:none;border:none;font-size:1.6rem;cursor:pointer;color:var(--text-muted);line-height:1">&times;</button>
        </div>
        <p style="margin:14px 0 4px"><strong>Чести проблеми:</strong> ${info.problem}</p>
        <p><strong>Препоръчително лечение:</strong> ${info.treatment}</p>
        ${specialist}
        <a href="/contact?service=${encodeURIComponent(info.service)}" class="btn btn-primary btn-block" id="toothBook" style="margin-top:22px">Запази час за този зъб <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  const overlay = document.getElementById('toothModalOverlay');
  const close = () => overlay.remove();
  document.getElementById('toothModalClose').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
}

document.addEventListener('DOMContentLoaded', buildChart);
if (document.readyState !== 'loading') buildChart();
