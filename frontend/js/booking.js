/* ============================================================
   booking.js — 3-step form with interactive calendar + live slot availability
   ============================================================ */

(function () {
  const form = document.getElementById('bookingForm');
  if (!form) return;

  let currentStep = 1;
  const steps = () => Array.from(form.querySelectorAll('.form-step'));
  const progressSteps = Array.from(document.querySelectorAll('.progress .step'));

  /* ---- Populate service dropdown once data is ready ---- */
  document.addEventListener('mnl:ready', (e) => {
    const sel = document.getElementById('bookingService');
    if (sel) {
      e.detail.services.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s.name; opt.textContent = s.name; sel.appendChild(opt);
      });
      // Preselect a service passed via /contact?service=Name (from service cards / tooth chart).
      const wanted = new URLSearchParams(location.search).get('service');
      if (wanted && [...sel.options].some((o) => o.value === wanted)) sel.value = wanted;
    }
    initCalendar();
  });

  /* ============================================================
     Calendar
     ============================================================ */
  const MONTHS = ['Януари', 'Февруари', 'Март', 'Април', 'Май', 'Юни', 'Юли', 'Август', 'Септември', 'Октомври', 'Ноември', 'Декември'];
  const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
  const calMount = document.getElementById('bookingCalendar');
  const dateInput = form.querySelector('input[name="preferred_date"]');
  const timeGrid = document.getElementById('timeGrid');
  const timeInput = form.querySelector('input[name="preferred_time"]');

  const today0 = new Date(); today0.setHours(0, 0, 0, 0);
  let viewY = today0.getFullYear(), viewM = today0.getMonth();
  let selectedISO = null;

  const cfg = () => (window.MNL && MNL.settings) || {};
  const closedWeekdays = () => String(cfg().closed_weekdays || '0').split(',').map((s) => parseInt(s, 10)).filter((n) => !isNaN(n));
  const closedDates = () => String(cfg().closed_dates || '').split(',').map((s) => s.trim()).filter(Boolean);
  const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  function isClosed(date) {
    return closedWeekdays().includes(date.getDay()) || closedDates().includes(toISO(date));
  }

  function initCalendar() {
    if (!calMount) return;
    renderCalendar();
  }

  function renderCalendar() {
    const first = new Date(viewY, viewM, 1);
    const startWd = (first.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const atCurrentMonth = viewY === today0.getFullYear() && viewM === today0.getMonth();

    let cells = '';
    for (let i = 0; i < startWd; i++) cells += '<span class="cal-cell cal-empty"></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewY, viewM, d);
      const disabled = date < today0 || isClosed(date);
      const iso = toISO(date);
      const cls = ['cal-cell', 'cal-day'];
      if (disabled) cls.push('disabled');
      if (iso === selectedISO) cls.push('selected');
      if (iso === toISO(today0)) cls.push('today');
      cells += `<button type="button" class="${cls.join(' ')}" ${disabled ? 'disabled' : ''} data-date="${iso}">${d}</button>`;
    }

    calMount.innerHTML = `
      <div class="cal-head">
        <button type="button" class="cal-nav" data-nav="-1" ${atCurrentMonth ? 'disabled' : ''}><i class="fa-solid fa-chevron-left"></i></button>
        <span class="cal-title">${MONTHS[viewM]} ${viewY}</span>
        <button type="button" class="cal-nav" data-nav="1"><i class="fa-solid fa-chevron-right"></i></button>
      </div>
      <div class="cal-grid cal-wd">${WD.map((w) => `<span class="cal-cell cal-wd-label">${w}</span>`).join('')}</div>
      <div class="cal-grid">${cells}</div>`;

    calMount.querySelectorAll('[data-nav]').forEach((b) => b.addEventListener('click', () => {
      viewM += Number(b.dataset.nav);
      if (viewM < 0) { viewM = 11; viewY--; }
      if (viewM > 11) { viewM = 0; viewY++; }
      renderCalendar();
    }));
    calMount.querySelectorAll('.cal-day:not(.disabled)').forEach((b) => b.addEventListener('click', () => {
      selectedISO = b.dataset.date;
      dateInput.value = selectedISO;
      dateInput.closest('.field').classList.remove('invalid');
      renderCalendar();
      loadSlots(selectedISO);
    }));
  }

  /* ---- Time slots (generated per weekday, booked ones disabled) ---- */
  function timeToMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + m; }
  function minToTime(x) { return `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`; }

  function genSlots(iso) {
    const dow = new Date(iso + 'T00:00:00').getDay();
    const start = timeToMin(cfg().slot_start || '09:00');
    const end = timeToMin(dow === 6 ? (cfg().slot_end_saturday || '12:30') : (cfg().slot_end_weekday || '17:30'));
    const step = parseInt(cfg().slot_minutes || '30', 10) || 30;
    const out = [];
    for (let t = start; t <= end; t += step) out.push(minToTime(t));
    return out;
  }

  async function loadSlots(iso) {
    timeInput.value = '';
    timeGrid.innerHTML = '<p class="slot-hint">Зареждане на свободните часове…</p>';
    let booked = [];
    try {
      const res = await fetch('/api/appointments/availability?date=' + iso);
      if (res.ok) booked = (await res.json()).booked || [];
    } catch (e) { /* show all as free if it fails */ }

    const slots = genSlots(iso);
    if (!slots.length) { timeGrid.innerHTML = '<p class="slot-hint">Няма работни часове за този ден.</p>'; return; }
    timeGrid.innerHTML = slots.map((t) => {
      const taken = booked.includes(t);
      return `<div class="time-slot${taken ? ' taken' : ''}" ${taken ? '' : `data-time="${t}"`}>${t}${taken ? ' <small>заето</small>' : ''}</div>`;
    }).join('');

    timeGrid.querySelectorAll('.time-slot[data-time]').forEach((slot) => slot.addEventListener('click', () => {
      timeGrid.querySelectorAll('.time-slot').forEach((s) => s.classList.remove('selected'));
      slot.classList.add('selected');
      timeInput.value = slot.dataset.time;
      timeInput.closest('.field').classList.remove('invalid');
    }));
  }

  /* ============================================================
     Step navigation + validation
     ============================================================ */
  function showStep(n) {
    steps().forEach((s) => s.classList.toggle('active', Number(s.dataset.step) === n));
    progressSteps.forEach((p, i) => p.classList.toggle('active', i < n));
    currentStep = n;
  }

  function validateStep(n) {
    let ok = true;
    const step = form.querySelector(`.form-step[data-step="${n}"]`);
    step.querySelectorAll('input[required], select[required]').forEach((el) => {
      const field = el.closest('.field');
      let valid = el.value.trim() !== '';
      if (el.name === 'email' && el.value.trim() !== '') valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value);
      if (el.name === 'email' && el.value.trim() === '') valid = true;
      field.classList.toggle('invalid', !valid);
      if (!valid) ok = false;
    });
    return ok;
  }

  form.querySelectorAll('[data-next]').forEach((btn) =>
    btn.addEventListener('click', () => { if (validateStep(currentStep)) showStep(currentStep + 1); }));
  form.querySelectorAll('[data-prev]').forEach((btn) =>
    btn.addEventListener('click', () => showStep(currentStep - 1)));

  /* ---- Submit ---- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const btn = document.getElementById('bookingSubmit');
    const original = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = 'Изпращане… <i class="fa-solid fa-spinner fa-spin"></i>';
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Грешка при изпращане.'); }
      form.style.display = 'none';
      document.querySelector('.progress').style.display = 'none';
      document.getElementById('bookingSuccess').classList.add('show');
    } catch (err) {
      alert(err.message || 'Възникна грешка. Опитайте отново или се обадете.');
      btn.disabled = false; btn.innerHTML = original;
    }
  });

  showStep(1);
  // If settings are already loaded, init now; otherwise the mnl:ready handler does it.
  if (window.MNL && MNL.settings && Object.keys(MNL.settings).length) initCalendar();
})();
