/* ============================================================
   smile-score.js — 5-question smile health calculator + gauge
   ============================================================ */

const SMILE_QUESTIONS = [
  {
    q: 'Кога беше последното ви посещение при зъболекар?',
    opts: [
      { t: 'През последните 6 месеца', s: 20 },
      { t: 'Преди 1 година', s: 12 },
      { t: 'Преди над 2 години', s: 5 },
      { t: 'Не помня', s: 0 },
    ],
  },
  {
    q: 'Имате ли болки или чувствителност?',
    opts: [
      { t: 'Не, никакви', s: 20 },
      { t: 'Лека чувствителност', s: 12 },
      { t: 'Понякога боли', s: 5 },
      { t: 'Да, постоянно', s: 0 },
    ],
  },
  {
    q: 'Как бихте описали цвета на зъбите си?',
    opts: [
      { t: 'Бели и блестящи', s: 20 },
      { t: 'Леко пожълтели', s: 12 },
      { t: 'Видимо потъмнели', s: 6 },
      { t: 'С петна', s: 2 },
    ],
  },
  {
    q: 'Имате ли нелекувани кариеси?',
    opts: [
      { t: 'Не', s: 20 },
      { t: 'Може би 1', s: 10 },
      { t: 'Няколко', s: 4 },
      { t: 'Не знам', s: 6 },
    ],
  },
  {
    q: 'Кървят ли венците ви при миене?',
    opts: [
      { t: 'Никога', s: 20 },
      { t: 'Рядко', s: 12 },
      { t: 'Често', s: 4 },
      { t: 'Винаги', s: 0 },
    ],
  },
];

function buildSmileScore() {
  const mount = document.getElementById('smileScore');
  if (!mount) return;

  mount.innerHTML = `
    <div id="smileQuestions">
      ${SMILE_QUESTIONS.map((item, qi) => `
        <div class="smile-q">
          <h4>${qi + 1}. ${item.q}</h4>
          <div class="smile-opts">
            ${item.opts.map((o, oi) => `
              <span class="smile-opt">
                <input type="radio" name="sq${qi}" id="sq${qi}_${oi}" value="${o.s}" />
                <label for="sq${qi}_${oi}">${o.t}</label>
              </span>`).join('')}
          </div>
        </div>`).join('')}
      <div class="text-center"><button class="btn btn-primary" id="smileCalc">Изчисли резултата <i class="fa-solid fa-gauge-high"></i></button></div>
    </div>
    <div class="smile-result" id="smileResult" style="display:none"></div>`;

  document.getElementById('smileCalc').addEventListener('click', calcSmile);
}

function calcSmile() {
  let total = 0;
  let answered = 0;
  SMILE_QUESTIONS.forEach((_, qi) => {
    const sel = document.querySelector(`input[name="sq${qi}"]:checked`);
    if (sel) { total += Number(sel.value); answered++; }
  });
  if (answered < SMILE_QUESTIONS.length) {
    alert('Моля, отговорете на всички въпроси.');
    return;
  }

  let verdict, color;
  if (total >= 80) { verdict = 'Отлично! Усмивката ви е в страхотна форма. Продължавайте с редовната профилактика.'; color = '#2E8B5A'; }
  else if (total >= 55) { verdict = 'Добре, но има място за подобрение. Препоръчваме профилактичен преглед.'; color = '#C8A84B'; }
  else { verdict = 'Усмивката ви се нуждае от внимание. Запазете час за цялостен преглед възможно най-скоро.'; color = '#C0392B'; }

  document.getElementById('smileQuestions').style.display = 'none';
  const result = document.getElementById('smileResult');
  result.style.display = 'block';
  result.innerHTML = `
    <div class="gauge">
      <svg width="220" height="120" viewBox="0 0 220 120">
        <path d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="#E2EEE7" stroke-width="16" stroke-linecap="round"/>
        <path id="gaugeArc" d="M20 110 A90 90 0 0 1 200 110" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round"
          stroke-dasharray="283" stroke-dashoffset="283"/>
      </svg>
      <div class="score-text" id="scoreText" style="color:${color}">0</div>
    </div>
    <h3 style="margin-bottom:10px">Вашият Smile Score: <span style="color:${color}">${total}/100</span></h3>
    <p style="color:var(--text-muted);max-width:480px;margin:0 auto 22px">${verdict}</p>
    <a href="#booking" class="btn btn-primary">Запази безплатен преглед</a>
    <button class="btn btn-outline" id="smileRetry" style="margin-left:10px">Опитай отново</button>`;

  // Animate arc + number
  const arc = document.getElementById('gaugeArc');
  const fullLen = 283;
  const offset = fullLen - (fullLen * total) / 100;
  requestAnimationFrame(() => { arc.style.transition = 'stroke-dashoffset 1.2s ease'; arc.style.strokeDashoffset = offset; });

  const scoreText = document.getElementById('scoreText');
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / 1200, 1);
    scoreText.textContent = Math.round(total * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  document.getElementById('smileRetry').addEventListener('click', () => {
    document.getElementById('smileResult').style.display = 'none';
    document.getElementById('smileQuestions').style.display = 'block';
    document.querySelectorAll('#smileQuestions input').forEach((i) => (i.checked = false));
  });
}

document.addEventListener('DOMContentLoaded', buildSmileScore);
if (document.readyState !== 'loading') buildSmileScore();
