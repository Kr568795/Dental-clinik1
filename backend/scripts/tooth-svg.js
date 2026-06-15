'use strict';

// Generates a realistic anatomical dental-arch SVG (32 teeth, FDI numbering)
// with scalloped gingiva, touching teeth and ivory shading.
// Used by the preview renderer and ported into frontend/js/tooth-chart.js.

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

// Crown silhouettes (crown/incisal edge pointing +Y, neck at top).
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
    const nrm = Math.atan2(y - RING.cy, x - RING.cx); // outward (root) direction
    const rot = (Math.atan2(RING.cy - y, RING.cx - x) * 180) / Math.PI - 90;
    const type = toothType(fdi);
    return { fdi, type, x, y, nrm, rot, s: SCALE[type] };
  });
}

// Scalloped gum band hugging the root side of a tooth row, with papillae
// dipping toward the crowns between neighbouring teeth.
function gumShape(list) {
  const inner = []; // crown-facing scalloped edge
  const outer = []; // far root-side edge
  const out = (t, r) => [t.x + Math.cos(t.nrm) * r, t.y + Math.sin(t.nrm) * r];

  list.forEach((t, i) => {
    inner.push(out(t, 2)); // near neck
    if (i < list.length - 1) {
      const n = list[i + 1];
      const mx = (t.x + n.x) / 2, my = (t.y + n.y) / 2;
      const ang = Math.atan2(my - RING.cy, mx - RING.cx);
      inner.push([mx - Math.cos(ang) * 7, my - Math.sin(ang) * 7]); // papilla toward crown
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

function buildToothSVG() {
  const W = 820, H = 580;

  const upper = archTeeth(UPPER, 410, 280, 318, 176, 203, 337);
  const lower = archTeeth(LOWER, 410, 290, 296, 172, 157, 23);
  const teeth = [...upper, ...lower];

  const defs = `
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
    </filter>`;

  const style = `
    .gum { fill:url(#gumGrad); filter:url(#gumShadow); }
    .tooth { fill:url(#toothGrad); stroke:#CBB89B; stroke-width:0.8; filter:url(#toothShadow); }
    .tooth-hi { fill:#FFFFFF; opacity:.55; }
    .tooth.wisdom { stroke:#C8A84B; stroke-width:1.8; }
    .tooth-num { font:600 10px Montserrat, Arial, sans-serif; fill:#7A6A55; }
    .arch-label { font:700 14px 'Playfair Display', Georgia, serif; fill:#1A6B42; }`;

  function row(list) {
    return list
      .map((t) => `<g class="tooth-g" data-fdi="${t.fdi}" data-type="${t.type}" transform="translate(${t.x.toFixed(1)},${t.y.toFixed(1)})">
        <g transform="rotate(${t.rot.toFixed(1)}) scale(${t.s})"><path class="tooth${t.type === 'wisdom' ? ' wisdom' : ''}" d="${SHAPES[t.type]}"/><ellipse class="tooth-hi" cx="-3" cy="0" rx="2.3" ry="7"/></g>
        <text class="tooth-num" x="0" y="0" text-anchor="middle" dominant-baseline="central">${t.fdi}</text>
      </g>`)
      .join('');
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="tooth-svg" role="img" aria-label="Зъбна карта">
    <defs>${defs}</defs>
    <style>${style}</style>
    <text class="arch-label" x="410" y="24" text-anchor="middle">Горна челюст</text>
    <path class="gum" d="${gumShape(upper)}"/>
    ${row(upper)}
    <path class="gum" d="${gumShape(lower)}"/>
    ${row(lower)}
    <text class="arch-label" x="410" y="${H - 12}" text-anchor="middle">Долна челюст</text>
  </svg>`;
}

module.exports = { buildToothSVG, UPPER, LOWER, toothType, SHAPES, SCALE, RING, archTeeth, gumShape };
