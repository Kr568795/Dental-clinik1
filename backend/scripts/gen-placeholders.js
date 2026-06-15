'use strict';

// Generates tasteful SVG placeholder images for the demo.
// Replace these files with real photos later (keep the same names).
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', '..', 'frontend', 'images');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const PLACEHOLDERS = [
  { file: 'team', label: 'Екипът на MNL', sub: 'Снимка на екипа', w: 1200, h: 525, c1: '#2E8B5A', c2: '#1A6B42', icon: 'team' },
  { file: 'doctor', label: 'Д-р Билял', sub: 'Главен лекар', w: 800, h: 1000, c1: '#4CAF7A', c2: '#1A6B42', icon: 'doctor' },
  { file: 'doctor2', label: 'Д-р Елена', sub: 'Естетична стоматология', w: 800, h: 1000, c1: '#3FA76E', c2: '#1A6B42', icon: 'doctor' },
  { file: 'cabinet1', label: 'Кабинет 1', sub: 'Модерно оборудване', w: 800, h: 1000, c1: '#5BB98A', c2: '#2E8B5A', icon: 'chair' },
  { file: 'cabinet2', label: 'Кабинет 2', sub: 'Дигитален рентген', w: 800, h: 1000, c1: '#69C295', c2: '#2E8B5A', icon: 'chair' },
  { file: 'patient', label: 'Грижа за пациенти', sub: 'Спокойна среда', w: 800, h: 800, c1: '#4CAF7A', c2: '#1A6B42', icon: 'smile' },
];

const ICONS = {
  team: '<circle cx="-26" cy="-8" r="16"/><circle cx="26" cy="-8" r="16"/><circle cx="0" cy="2" r="20"/><path d="M-52 44c0-18 12-28 26-28s26 10 26 28z" opacity=".0"/>',
  doctor: '<circle cx="0" cy="-20" r="22"/><path d="M-34 46c0-22 15-34 34-34s34 12 34 34z"/>',
  chair: '<rect x="-30" y="-26" width="60" height="34" rx="10"/><rect x="-10" y="8" width="20" height="34" rx="6"/>',
  smile: '<circle cx="0" cy="0" r="40" fill="none" stroke="#fff" stroke-width="6"/><circle cx="-15" cy="-10" r="5"/><circle cx="15" cy="-10" r="5"/><path d="M-20 12 Q0 32 20 12" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>',
};

function svg({ label, sub, w, h, c1, c2, icon }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/>
      <stop offset="1" stop-color="${c2}"/>
    </linearGradient>
    <pattern id="dots" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="2.5" fill="#ffffff" opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#dots)"/>
  <g transform="translate(${w / 2}, ${h / 2 - 60})" fill="#ffffff" opacity="0.92">${ICONS[icon]}</g>
  <text x="${w / 2}" y="${h / 2 + 60}" text-anchor="middle" fill="#ffffff" font-family="Playfair Display, Georgia, serif" font-size="${Math.round(w / 18)}" font-weight="700">${label}</text>
  <text x="${w / 2}" y="${h / 2 + 60 + Math.round(w / 22)}" text-anchor="middle" fill="#ffffff" opacity="0.8" font-family="Montserrat, Arial, sans-serif" font-size="${Math.round(w / 34)}">${sub}</text>
</svg>`;
}

PLACEHOLDERS.forEach((p) => {
  fs.writeFileSync(path.join(OUT, `${p.file}.svg`), svg(p));
  console.log(`🖼️  images/${p.file}.svg`);
});
console.log('\n✅  Placeholder images generated.');
