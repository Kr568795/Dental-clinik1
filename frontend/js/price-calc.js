/* ============================================================
   price-calc.js — live price estimator from /api/services data
   ============================================================ */

function buildPriceCalc(services) {
  const grid = document.getElementById('calcGrid');
  if (!grid) return;

  // Only services that actually have a price range.
  const priced = services.filter((s) => s.price_min != null && s.price_max != null);
  if (!priced.length) { grid.innerHTML = '<p style="text-align:center;color:var(--text-muted)">Няма ценова информация.</p>'; return; }

  grid.innerHTML = priced.map((s) => `
    <div class="calc-item" data-min="${s.price_min}" data-max="${s.price_max}">
      <label><input type="checkbox" /> ${escapeHtml(s.name)}</label>
      <span class="range">${window.priceLabel(s.price_min, s.price_max)}</span>
    </div>`).join('');

  grid.querySelectorAll('.calc-item').forEach((item) => {
    const cb = item.querySelector('input');
    item.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') cb.checked = !cb.checked;
      item.classList.toggle('checked', cb.checked);
      recalc();
    });
  });
  recalc();

  function recalc() {
    let min = 0, max = 0;
    grid.querySelectorAll('.calc-item').forEach((item) => {
      if (item.querySelector('input').checked) {
        min += Number(item.dataset.min);
        max += Number(item.dataset.max);
      }
    });
    const sumEl = document.getElementById('calcSum');
    sumEl.innerHTML = min === 0 && max === 0 ? '0 €' : window.priceLabel(min, max);
  }
}

// Build once service data is loaded.
document.addEventListener('mnl:ready', (e) => buildPriceCalc(e.detail.services));
