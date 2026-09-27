/* =========================================================
   まいにち30ぷん：画面・タイマー・記録
   データは この端末の localStorage に保存（サーバーには送らない）
   ========================================================= */
(function () {
  'use strict';

  const STORE_KEY = 'kids-study-v1';
  const GRADES = ['年少さん', '年中さん', '年長さん', '1年生', '2年生', '3年生', '4年生', '5年生', '6年生'];
  const AVATARS = ['🐶', '🐱', '🐰', '🐻', '🐼', '🦁', '🐯', '🐸', '🐧', '🦊', '🐨', '🦄', '🐲', '🐳', '🦖', '🐥'];
  const STAMPS = ['🌟', '🌈', '🍀', '🎈', '🦄', '🐳', '🌻', '🍓', '🚀', '🎉', '🍩', '🦋', '🐬', '🌸'];
  const RANKS = [
    [0, '🥚', 'たまご'], [50, '🐣', 'ひよこ'], [150, '🐤', 'ことり'], [300, '🐦', 'はばたき'],
    [600, '🦅', 'わし'], [1000, '🐉', 'ドラゴン'], [2000, '👑', 'キング'], [4000, '🌌', 'レジェンド'],
  ];
  const STREAK_BADGES = [3, 7, 14, 30, 50, 100, 200, 365];
  const IDLE_LIMIT = 90;       // 秒。この間 なにもしないと タイマーを とめる
  const ENRATIOS = [0.5, 0.6, 0.7, 0.8, 0.9];

  // ---------- 保存 ----------
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && Array.isArray(s.profiles)) return s;
    } catch (e) { /* 読めないときは 新規 */ }
    return { profiles: [], settings: { pin: '', voice: true, sound: true }, current: null };
  }
  let S = load();
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); }
  }

  // ---------- 日付 ----------
  const pad = (n) => String(n).padStart(2, '0');
  const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const fmt = (sec) => { sec = Math.max(0, Math.ceil(sec)); return `${Math.floor(sec / 60)}:${pad(sec % 60)}`; };

  // ---------- プロフィール ----------
  const cur = () => S.profiles.find((p) => p.id === S.current) || null;
  function newProfile(name, grade, avatar) {
    return {
      id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name, grade, avatar,
      studyMin: 30, gameMin: 30, enRatio: 0.7, maxLessons: 0,
      lvEn: 1, lvMath: 1, recentEn: [], recentMath: [],
      stars: 0, days: {}, kinds: {},
    };
  }
  function today(p) {
    const k = dkey();
    if (!p.days[k]) p.days[k] = { sec: 0, q: 0, c: 0, lessons: 0, lessonSec: 0, cleared: false, gameLeft: 0, gameTotal: 0, gameRunAt: null, stamp: null };
    return p.days[k];
  }
  // レッスン：studyMin ぷん やるごとに 1かい。1かいごとに gameMin ぷん もらえる
  const lessonsOf = (d) => (d ? (d.lessons != null ? d.lessons : d.cleared ? 1 : 0) : 0);
  const lessonSecOf = (d) => (d.lessonSec != null ? d.lessonSec : d.cleared ? 0 : d.sec);
  const canLesson = (p, d) => !p.maxLessons || lessonsOf(d) < p.maxLessons;
  function grantLesson(p, d) {
    d.lessons = lessonsOf(d) + 1;
    d.lessonSec = 0;
    d.cleared = true;
    if (!d.stamp) d.stamp = STAMPS[Math.floor(Math.random() * STAMPS.length)];
    const add = p.gameMin * 60;
    if (d.gameRunAt) { d.gameLeft = Math.max(0, gameRemaining(d)); d.gameRunAt = Date.now(); }
    d.gameLeft = Math.max(0, d.gameLeft) + add;
    d.gameTotal = (d.gameTotal || 0) + add;
  }
  function streak(p) {
    let d = new Date();
    if (!(p.days[dkey(d)] || {}).cleared) d = addDays(d, -1);
    let n = 0;
    while ((p.days[dkey(d)] || {}).cleared) { n++; d = addDays(d, -1); }
    return n;
  }
  function bestStreak(p) {
    const keys = Object.keys(p.days).filter((k) => p.days[k].cleared).sort();
    let best = 0, run = 0, prev = null;
    for (const k of keys) {
      const d = new Date(k + 'T00:00:00');
      run = prev && dkey(addDays(prev, 1)) === k ? run + 1 : 1;
      best = Math.max(best, run); prev = d;
    }
    return best;
  }
  const clearedCount = (p) => Object.values(p.days).filter((d) => d.cleared).length;
  const rankOf = (stars) => { let r = RANKS[0]; for (const x of RANKS) if (stars >= x[0]) r = x; return r; };
  const nextRank = (stars) => RANKS.find((x) => x[0] > stars);
  const gameRemaining = (d) => (d.gameRunAt ? d.gameLeft - (Date.now() - d.gameRunAt) / 1000 : d.gameLeft);

  // ---------- 音 ----------
  let AC = null;
  function beep(notes) {
    if (!S.settings.sound) return;
    try {
      AC = AC || new (window.AudioContext || window.webkitAudioContext)();
      if (AC.state === 'suspended') AC.resume();
      let t = AC.currentTime;
      for (const [f, dur, type = 'sine', vol = 0.18] of notes) {
        const o = AC.createOscillator(), g = AC.createGain();
        o.type = type; o.frequency.value = f;
        g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
        o.connect(g).connect(AC.destination); o.start(t); o.stop(t + dur);
        t += dur * 0.85;
      }
    } catch (e) { /* 音が出せない端末 */ }
  }
  const SFX = {
    ok: () => beep([[880, 0.12], [1320, 0.2]]),
    ng: () => beep([[220, 0.25, 'triangle', 0.2]]),
    tap: () => beep([[660, 0.05, 'sine', 0.08]]),
    fanfare: () => beep([[523, 0.15], [659, 0.15], [784, 0.15], [1047, 0.4], [784, 0.12], [1047, 0.5]]),
    alarm: () => beep([[988, 0.2, 'square', 0.12], [784, 0.2, 'square', 0.12], [988, 0.2, 'square', 0.12], [784, 0.2, 'square', 0.12], [988, 0.4, 'square', 0.12]]),
    warn: () => beep([[784, 0.15, 'triangle'], [784, 0.15, 'triangle']]),
  };

  // ---------- よみあげ ----------
  let voices = [];
  function loadVoices() { try { voices = speechSynthesis.getVoices(); } catch (e) { voices = []; } }
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  function voiceFor(lang) {
    const pref = lang === 'en' ? ['en-US', 'en-GB', 'en'] : ['ja-JP', 'ja'];
    for (const p of pref) { const v = voices.find((x) => x.lang && x.lang.replace('_', '-').startsWith(p)); if (v) return v; }
    return null;
  }
  function speak(list) {
    if (!S.settings.voice || !('speechSynthesis' in window) || !list || !list.length) return;
    try {
      speechSynthesis.cancel();
      for (const { text, lang } of list) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = lang === 'en' ? 'en-US' : 'ja-JP';
        const v = voiceFor(lang); if (v) u.voice = v;
        u.rate = lang === 'en' ? 0.8 : 1.0;
        u.pitch = 1.05;
        speechSynthesis.speak(u);
      }
    } catch (e) { /* よみあげ非対応 */ }
  }

  // ---------- 画面の スリープ防止 ----------
  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
      if (!on && wakeLock && !timerRunning()) { await wakeLock.release(); wakeLock = null; }
    } catch (e) { wakeLock = null; }
  }

  // ---------- 描画ヘルパー ----------
  const app = document.getElementById('app');
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let cleanup = [];
  function render(html, screen) {
    cleanup.forEach((f) => f()); cleanup = [];
    app.innerHTML = html;
    app.dataset.screen = screen;
    window.scrollTo(0, 0);
  }
  const $ = (sel) => app.querySelector(sel);
  const $$ = (sel) => Array.from(app.querySelectorAll(sel));
  function on(sel, ev, fn) { $$(sel).forEach((el) => el.addEventListener(ev, fn)); }
  function every(ms, fn) { const id = setInterval(fn, ms); cleanup.push(() => clearInterval(id)); }

  function ring(pct, inner, cls = '') {
    const r = 52, c = 2 * Math.PI * r;
    return `<div class="ring ${cls}"><svg viewBox="0 0 120 120" aria-hidden="true">
      <circle cx="60" cy="60" r="${r}" class="ring-bg"/>
      <circle cx="60" cy="60" r="${r}" class="ring-fg" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.min(1, pct))}"/>
      </svg><div class="ring-inner">${inner}</div></div>`;
  }

  // =========================================================
  //  ようこそ／プロフィール えらび
  // =========================================================
  function showHome() {
    keepAwake(false);
    if (!S.profiles.length) return showProfileForm(null, true);
    if (S.profiles.length === 1) { S.current = S.profiles[0].id; save(); return showDash(); }
    render(`
      <section class="screen home">
        <h1 class="logo">まいにち<b>30</b>ぷん</h1>
        <p class="lead">だれが べんきょう する？</p>
        <div class="who">
          ${S.profiles.map((p) => {
            const d = p.days[dkey()] || {};
            return `<button class="who-btn" data-id="${p.id}">
              <span class="av">${p.avatar}</span><span class="nm">${esc(p.name)}</span>
              <span class="gr">${GRADES[p.grade]}</span>
              <span class="st">${d.cleared ? `✅ きょう レッスン ${lessonsOf(d)}かい` : '🔥 ' + streak(p) + 'にち れんぞく'}</span>
            </button>`;
          }).join('')}
        </div>
        <button class="btn big ghost go-timer">⏱ タイマー${timerRunning() ? ` <b class="tchip">${fmt(timerLeft())}</b>` : ''}</button>
        <button class="link parent-link">⚙ おうちの人の せってい</button>
      </section>`, 'home');
    on('.go-timer', 'click', () => { SFX.tap(); showTimer(showHome); });
    on('.who-btn', 'click', (e) => { SFX.tap(); S.current = e.currentTarget.dataset.id; save(); showDash(); });
    on('.parent-link', 'click', () => pinGate(showParent));
  }

  // =========================================================
  //  子どもの ホーム
  // =========================================================
  function showDash() {
    keepAwake(false);
    const p = cur(); if (!p) return showHome();
    const d = today(p); save();
    const target = p.studyMin * 60;
    const ls = lessonsOf(d), lsec = lessonSecOf(d), can = canLesson(p, d);
    const pct = can ? lsec / target : 1;
    const st = streak(p);
    const rk = rankOf(p.stars), nx = nextRank(p.stars);
    const gLeft = gameRemaining(d);
    const running = !!d.gameRunAt && gLeft > 0;

    const studyBtn = !can
      ? `<button class="btn big ghost go-study">📚 もっと べんきょうする</button>`
      : `<button class="btn big primary go-study">${lsec > 0 ? '▶ つづきから' : ls ? `▶ ${ls + 1}かいめの レッスン` : '▶ レッスン スタート'}</button>`;
    const lessonDots = p.maxLessons
      ? Array.from({ length: p.maxLessons }, (_, i) => `<span class="ldot ${i < ls ? 'on' : ''}">${i < ls ? '⭐' : i + 1}</span>`).join('')
      : Array.from({ length: ls }, () => '<span class="ldot on">⭐</span>').join('') + (can ? `<span class="ldot">${ls + 1}</span>` : '');

    render(`
      <section class="screen dash">
        <header class="topbar">
          <button class="me switch" aria-label="きりかえ"><span class="av">${p.avatar}</span><span><b>${esc(p.name)}</b><small>${GRADES[p.grade]}</small></span></button>
          <span class="top-actions">
            <button class="timer-btn go-timer" aria-label="タイマー">⏱<b class="tchip">${timerRunning() || S.timer && S.timer.left > 0 && S.timer.left < S.timer.total ? fmt(timerLeft()) : 'タイマー'}</b></button>
            <button class="icon-btn parent-link" aria-label="おうちの人の せってい">⚙</button>
          </span>
        </header>

        <div class="dash-grid">
          <div class="dash-main">
            <div class="card today">
              ${ring(pct, !can ? '<span class="done">クリア!</span>' : `<b>${Math.floor(lsec / 60)}</b><small>/ ${p.studyMin}ぷん</small>`, !can ? 'cleared' : '')}
              <div class="today-txt">
                <h2>${ls ? `レッスン ${ls}かい クリア！🎉` : 'きょうの レッスン'}</h2>
                <div class="ldots" aria-label="きょうの レッスン">${lessonDots}</div>
                <p>${can ? `あと <b>${Math.ceil((target - lsec) / 60)}ぷん</b> で ゲーム <b>+${p.gameMin}ぷん</b>！` : 'きょうの レッスンは ここまで。よく がんばったね！'}</p>
                <p class="mix">えいご ${Math.round(p.enRatio * 100)}% ・ さんすう ${100 - Math.round(p.enRatio * 100)}%</p>
                ${studyBtn}
              </div>
            </div>

            <div class="card game ${d.cleared ? '' : 'locked'}">
              <div class="game-ico">${d.cleared ? '🎮' : '🔒'}</div>
              <div class="game-txt">
                <h2>ゲームタイム</h2>
                ${d.cleared
                  ? `<p>のこり <b class="gl">${fmt(gLeft)}</b>${running ? ' <span class="pill run">つかってる</span>' : ''}</p>`
                  : `<p>レッスン 1かい（${p.studyMin}ぷん）で <b>${p.gameMin}ぷん</b> もらえるよ</p>`}
              </div>
              ${d.cleared ? `<button class="btn primary go-game" ${gLeft <= 0 ? 'disabled' : ''}>${gLeft <= 0 ? 'おしまい' : 'ひらく'}</button>` : ''}
            </div>

            <div class="stats">
              <div class="stat"><span class="n">🔥 ${st}</span><span class="l">にち れんぞく</span></div>
              <div class="stat"><span class="n">⭐ ${p.stars}</span><span class="l">スター</span></div>
              <div class="stat"><span class="n">${rk[1]}</span><span class="l">${rk[2]}${nx ? `<br><small>つぎまで ⭐${nx[0] - p.stars}</small>` : ''}</span></div>
            </div>
          </div>
          <div class="dash-cal">
            <div class="card cal" data-cal></div>
            ${badgesHTML(p)}
          </div>
        </div>
      </section>`, 'dash');

    on('.go-study', 'click', () => { SFX.tap(); showStudy(); });
    on('.go-game', 'click', () => { SFX.tap(); showGame(); });
    on('.go-timer', 'click', () => { SFX.tap(); showTimer(showDash); });
    if (timerRunning()) every(1000, () => { const el = $('.go-timer .tchip'); if (el) el.textContent = fmt(timerLeft()); });
    on('.switch', 'click', () => { if (S.profiles.length > 1) { S.current = null; save(); showHome(); } });
    on('.parent-link', 'click', () => pinGate(showParent));
    if (running) every(1000, () => { const el = $('.gl'); if (el) el.textContent = fmt(gameRemaining(today(p))); });
    mountCalendar($('[data-cal]'), p, false);
  }

  // ---------- カレンダー ----------
  const WEEK = ['にち', 'げつ', 'か', 'すい', 'もく', 'きん', 'ど'];
  const WEEK_P = ['日', '月', '火', '水', '木', '金', '土'];
  // parent=true のときは 保護者向け（漢字・くわしい 数字）
  function mountCalendar(el, p, parent) {
    const now = new Date();
    let ym = new Date(now.getFullYear(), now.getMonth(), 1);
    const keys = Object.keys(p.days).sort();
    const oldest = keys.length ? new Date(keys[0] + 'T00:00:00') : now;
    const minYm = new Date(oldest.getFullYear(), oldest.getMonth(), 1);

    function draw() {
      const y = ym.getFullYear(), m = ym.getMonth();
      const first = new Date(y, m, 1).getDay();
      const days = new Date(y, m + 1, 0).getDate();
      const todayKey = dkey();
      const target = p.studyMin * 60;
      let cells = '';
      for (let i = 0; i < first; i++) cells += '<span class="cal-cell empty"></span>';
      let cnt = 0, mins = 0, lessons = 0;
      for (let d = 1; d <= days; d++) {
        const k = `${y}-${pad(m + 1)}-${pad(d)}`;
        const rec = p.days[k];
        const future = k > todayKey;
        const wd = (first + d - 1) % 7;
        if (rec && rec.cleared) cnt++;
        lessons += lessonsOf(rec);
        if (rec) mins += Math.floor(rec.sec / 60);
        let inner = '';
        const nl = lessonsOf(rec);
        if (rec && rec.cleared) inner = `<span class="stamp">${rec.stamp || '🌟'}</span>${nl > 1 ? `<b class="lx">×${nl}</b>` : ''}`;
        else if (rec && rec.sec > 0) inner = `<span class="mini"><span style="width:${Math.min(100, (lessonSecOf(rec) / target) * 100)}%"></span></span>`;
        const meta = rec && rec.sec > 0 ? `<em>${Math.floor(rec.sec / 60)}${parent ? '分' : 'ぷん'}</em>` : '';
        cells += `<button class="cal-cell ${k === todayKey ? 'today' : ''} ${rec && rec.cleared ? 'ok' : ''} ${future ? 'future' : ''} w${wd}" data-k="${k}" ${future ? 'disabled' : ''}>
          <i>${d}</i>${inner}${meta}</button>`;
      }
      const canPrev = ym > minYm;
      const canNext = ym < new Date(now.getFullYear(), now.getMonth(), 1);
      el.innerHTML = `
        <div class="cal-head">
          <button class="icon-btn cal-prev" ${canPrev ? '' : 'disabled'} aria-label="まえの月">‹</button>
          <h2>${y !== now.getFullYear() ? y + (parent ? '年' : 'ねん ') : ''}${m + 1}${parent ? '月の記録' : 'がつの カレンダー'}</h2>
          <button class="icon-btn cal-next" ${canNext ? '' : 'disabled'} aria-label="つぎの月">›</button>
        </div>
        <p class="cal-sum">${parent ? `クリア ${cnt}日・レッスン ${lessons}回・合計 ${mins}分` : `スタンプ <b>${cnt}</b>こ ・ レッスン <b>${lessons}</b>かい ・ <b>${mins}</b>ぷん`}</p>
        <div class="cal-grid">${(parent ? WEEK_P : WEEK).map((w, i) => `<span class="cal-h w${i}">${w}</span>`).join('')}${cells}</div>
        <div class="cal-legend"><span><span class="stamp-s">🌟</span>${parent ? 'クリア' : 'クリア'}</span><span><span class="mini"><span style="width:50%"></span></span>${parent ? '途中' : 'とちゅう'}</span></div>`;
      el.querySelector('.cal-prev').onclick = () => { if (canPrev) { ym = new Date(y, m - 1, 1); SFX.tap(); draw(); } };
      el.querySelector('.cal-next').onclick = () => { if (canNext) { ym = new Date(y, m + 1, 1); SFX.tap(); draw(); } };
      el.querySelectorAll('.cal-cell[data-k]').forEach((c) => c.addEventListener('click', () => { SFX.tap(); dayDetail(p, c.dataset.k, parent); }));
    }
    draw();
  }

  function dayDetail(p, k, parent) {
    const rec = p.days[k] || { sec: 0, q: 0, c: 0 };
    const [y, m, d] = k.split('-').map(Number);
    const wd = new Date(y, m - 1, d).getDay();
    const acc = rec.q ? Math.round((rec.c / rec.q) * 100) : 0;
    const gameUsed = rec.cleared ? Math.max(0, Math.round(((rec.gameTotal || p.gameMin * 60) - Math.max(0, gameRemaining(rec))) / 60)) : 0;
    const L = parent
      ? { lesson: 'レッスン', lu: '回', study: '学習時間', q: '問題', acc: '正解率', star: 'スター', game: 'ゲーム使用', none: 'この日は学習していません', close: '閉じる', unit: '分', qu: '問' }
      : { lesson: 'レッスン', lu: 'かい', study: 'べんきょう', q: 'もんだい', acc: 'せいかい', star: 'スター', game: 'ゲーム', none: 'この日は おやすみ', close: 'とじる', unit: 'ぷん', qu: 'もん' };
    const ov = document.createElement('div');
    ov.className = 'overlay day-ov';
    ov.innerHTML = `<div class="ov-card day-card" role="dialog" aria-label="${m}/${d}">
      <div class="day-stamp">${rec.cleared ? rec.stamp || '🌟' : rec.sec > 0 ? '📝' : '💤'}</div>
      <h2>${m}${parent ? '月' : 'がつ'}${d}${parent ? '日' : 'にち'}（${(parent ? WEEK_P : WEEK)[wd]}）</h2>
      ${rec.sec > 0 || rec.cleared ? `<p class="day-status ${rec.cleared ? 'ok' : ''}">${rec.cleared ? (parent ? '✅ クリア' : '✅ クリア！') : (parent ? '未クリア' : 'とちゅう')}</p>
      <div class="day-stats">
        <div><b>${lessonsOf(rec)}<u>${L.lu}</u></b><small>${L.lesson}</small></div>
        <div><b>${Math.floor(rec.sec / 60)}<u>${L.unit}</u></b><small>${L.study}</small></div>
        <div><b>${rec.q}<u>${L.qu}</u></b><small>${L.q}</small></div>
        <div><b>${acc}<u>%</u></b><small>${L.acc}</small></div>
        <div><b>⭐${rec.c}</b><small>${L.star}</small></div>
        ${rec.cleared ? `<div><b>${gameUsed}<u>${L.unit}</u></b><small>${L.game}</small></div>` : ''}
      </div>` : `<p>${L.none}</p>`}
      <button class="btn big primary close">${L.close}</button>
    </div>`;
    const close = () => { ov.remove(); };
    ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
    ov.querySelector('.close').addEventListener('click', close);
    app.appendChild(ov);
    cleanup.push(close);
  }

  function badgesHTML(p) {
    const best = bestStreak(p), total = clearedCount(p);
    const items = STREAK_BADGES.map((n) => `<span class="badge ${best >= n ? 'got' : ''}" title="${n}にち れんぞく"><b>${best >= n ? '🏅' : '・'}</b><small>${n}にち</small></span>`).join('');
    return `<div class="card badges">
      <h2>れんぞく メダル <small>これまで ${total}にち クリア</small></h2>
      <div class="badge-row">${items}</div>
    </div>`;
  }

  // =========================================================
  //  べんきょう
  // =========================================================
  function showStudy() {
    const p = cur(); if (!p) return showHome();
    const d = today(p);
    const target = p.studyMin * 60;
    const rewardable = canLesson(p, d);
    if (d.lessonSec == null) d.lessonSec = lessonSecOf(d);
    let lastAct = Date.now();
    let paused = false;
    let q = null, answered = false, input = '';
    let combo = 0, sessionStars = 0, sinceIdx = 0, sessionSec = 0;
    const retry = []; // { q, at }
    let timeUp = rewardable && d.lessonSec >= target;

    keepAwake(true);
    render(`
      <section class="screen study">
        <header class="study-bar">
          <button class="icon-btn quit" aria-label="やすむ">✕</button>
          <div class="tbar"><div class="tfill"></div><span class="tlabel"></span></div>
          <span class="sstars">⭐<b>0</b></span>
        </header>
        <div class="qwrap"></div>
        <div class="overlay idle hidden">
          <div class="ov-card">
            <div class="ov-emoji">😴</div>
            <p>タイマーが とまっているよ</p>
            <button class="btn big primary resume">つづける</button>
            <button class="btn ghost quit2">きょうは ここまで</button>
          </div>
        </div>
      </section>`, 'study');

    const tfill = $('.tfill'), tlabel = $('.tlabel'), qwrap = $('.qwrap');

    function updateBar() {
      if (!rewardable) {
        tfill.style.width = '100%';
        tlabel.textContent = `ボーナス れんしゅう ${fmt(sessionSec)}`;
      } else {
        tfill.style.width = Math.min(100, (d.lessonSec / target) * 100) + '%';
        tlabel.textContent = timeUp ? 'この もんだいで クリア！' : `レッスン${lessonsOf(d) + 1} のこり ${fmt(target - d.lessonSec)}`;
      }
      $('.sstars b').textContent = sessionStars;
    }

    function act() { lastAct = Date.now(); if (paused) resume(); }
    function pause() { paused = true; $('.idle').classList.remove('hidden'); save(); }
    function resume() { paused = false; lastAct = Date.now(); $('.idle').classList.add('hidden'); }

    every(1000, () => {
      if (paused || document.hidden) return;
      if (Date.now() - lastAct > IDLE_LIMIT * 1000) { pause(); return; }
      d.sec += 1; sessionSec += 1;
      if (rewardable) { d.lessonSec += 1; if (d.lessonSec >= target) timeUp = true; }
      if (d.sec % 10 === 0) save();
      updateBar();
    });
    const onVis = () => { if (document.hidden) save(); else lastAct = Date.now(); };
    document.addEventListener('visibilitychange', onVis);
    cleanup.push(() => document.removeEventListener('visibilitychange', onVis));
    const onKey = (e) => {
      if (!q || answered || paused) return;
      if (q.type === 'input') {
        if (/^[0-9.]$/.test(e.key)) press(e.key);
        else if (e.key === 'Backspace') press('del');
        else if (e.key === 'Enter') press('ok');
      } else if (/^[1-4]$/.test(e.key)) {
        const b = $$('.choice')[+e.key - 1]; if (b) b.click();
      }
    };
    document.addEventListener('keydown', onKey);
    cleanup.push(() => document.removeEventListener('keydown', onKey));

    on('.quit', 'click', () => { save(); showDash(); });
    on('.quit2', 'click', () => { save(); showDash(); });
    on('.resume', 'click', () => { SFX.tap(); resume(); });

    function nextQ() {
      sinceIdx++;
      const due = retry.findIndex((r) => r.at <= sinceIdx);
      if (due >= 0) { q = retry.splice(due, 1)[0].q; q.retry = true; }
      else q = Questions.next({ g: p.grade, lvEn: p.lvEn, lvMath: p.lvMath, enRatio: p.enRatio });
      answered = false; input = '';
      drawQ();
    }

    function drawQ() {
      const listen = q.listen;
      const choicesHTML = q.type === 'input'
        ? `<div class="answer-box"><span class="ans-val">&nbsp;</span></div>
           <div class="keypad">${['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'del'].map((k) => `<button class="key" data-k="${k}">${k === 'del' ? '⌫' : k}</button>`).join('')}
           <button class="key ok" data-k="ok">こたえる</button></div>`
        : `<div class="choices c${q.cols || q.choices.length}">${q.choices.map((c, i) => `<button class="choice" data-i="${i}">${c.html}</button>`).join('')}</div>`;
      qwrap.innerHTML = `
        <div class="qcard ${q.subj}">
          <div class="qtag">${q.subj === 'en' ? '🔤 えいご' : '🔢 さんすう'}・${q.kind}${q.retry ? ' <span class="pill">もういちど</span>' : ''}</div>
          ${listen ? `<button class="listen-btn" aria-label="もういちど きく">🔊<small>きく</small></button>` : ''}
          <div class="prompt">${q.prompt}</div>
          ${q.visual ? `<div class="visual">${q.visual}</div>` : ''}
          ${!listen && q.say ? `<button class="say-btn" aria-label="よみあげ">🔊</button>` : ''}
        </div>
        <div class="answers ${q.type === 'input' ? 'is-input' : ''}">${choicesHTML}</div>
        <div class="feedback hidden"></div>`;
      qwrap.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => { act(); if (!answered) answer(q.choices[+b.dataset.i].value, b); }));
      qwrap.querySelectorAll('.key').forEach((b) => b.addEventListener('click', () => { act(); press(b.dataset.k); }));
      const lb = qwrap.querySelector('.listen-btn, .say-btn');
      if (lb) lb.addEventListener('click', () => { act(); speak(q.say); });
      if (q.say && (listen || p.grade <= 3 || q.subj === 'en')) setTimeout(() => speak(q.say), 250);
      else if (p.grade <= 2) speak([{ text: q.prompt.replace(/<[^>]+>/g, ''), lang: 'ja' }]);
    }

    function press(k) {
      if (answered) return;
      const box = qwrap.querySelector('.ans-val');
      if (k === 'del') input = input.slice(0, -1);
      else if (k === 'ok') { if (input !== '' && input !== '.') answer(input, null); return; }
      else if (input.length < 8) { if (k === '.' && input.includes('.')) return; input += k; SFX.tap(); }
      box.innerHTML = input || '&nbsp;';
    }

    function answer(val, btn) {
      answered = true;
      const ok = q.type === 'input' ? Math.abs(parseFloat(val) - parseFloat(q.answer)) < 1e-9 : val === q.answer;
      // きろく
      d.q += 1; if (ok) d.c += 1;
      const kk = (p.kinds[q.kind] = p.kinds[q.kind] || { q: 0, c: 0 });
      kk.q += 1; if (ok) kk.c += 1;
      const rec = q.subj === 'en' ? p.recentEn : p.recentMath;
      rec.push(ok ? 1 : 0); if (rec.length > 20) rec.shift();
      adaptLevel(p);

      const fb = qwrap.querySelector('.feedback');
      if (q.type !== 'input') {
        qwrap.querySelectorAll('.choice').forEach((b) => {
          const v = q.choices[+b.dataset.i].value;
          if (v === q.answer) b.classList.add('right');
          else if (b === btn) b.classList.add('wrong');
          else b.classList.add('dim');
        });
      } else {
        qwrap.querySelector('.answer-box').classList.add(ok ? 'right' : 'wrong');
      }

      if (ok) {
        combo += 1; sessionStars += 1; p.stars += 1;
        SFX.ok();
        fb.className = 'feedback good';
        fb.innerHTML = `<span class="mark">⭕</span><span>${praise(combo)}</span>`;
        if (q.reveal) setTimeout(() => speak(q.reveal), 150);
        save(); updateBar();
        setTimeout(afterAnswer, q.reveal ? 1400 : 900);
      } else {
        combo = 0;
        SFX.ng();
        if (!q.retry) retry.push({ q: reshuffle(q), at: sinceIdx + 3 });
        fb.className = 'feedback bad';
        fb.innerHTML = `<div class="fb-head"><span class="mark">❌</span>おしい！</div>
          <div class="explain">${q.type === 'input' ? `こたえ：<b>${q.answer}</b><br>` : ''}${q.explain || ''}</div>
          <button class="btn primary next">つぎへ ▶</button>`;
        if (q.reveal) setTimeout(() => speak(q.reveal), 300);
        fb.querySelector('.next').addEventListener('click', () => { act(); afterAnswer(); });
        if (fb.getBoundingClientRect().bottom > window.innerHeight) fb.scrollIntoView({ behavior: 'smooth', block: 'end' });
        save(); updateBar();
      }
    }

    function afterAnswer() {
      if (rewardable && d.lessonSec >= target) return finish();
      nextQ();
    }

    function finish() {
      grantLesson(p, d);
      save();
      if (window.trackConversion) window.trackConversion('app_action_complete', { action: 'study_clear', grade: GRADES[p.grade], minutes: p.studyMin, lesson: d.lessons });
      showClear(p, d);
    }

    updateBar();
    nextQ();
  }

  function reshuffle(q) {
    const c = Object.assign({}, q);
    if (c.choices) c.choices = c.choices.slice().sort(() => Math.random() - 0.5);
    return c;
  }

  function praise(combo) {
    if (combo >= 10) return `すごすぎ！ ${combo}れんぞく！🔥`;
    if (combo >= 5) return `${combo}れんぞく せいかい！`;
    return ['せいかい！', 'すごい！', 'やったね！', 'ばっちり！', 'Great!', 'Good job!', 'Nice!'][Math.floor(Math.random() * 7)];
  }

  function adaptLevel(p) {
    for (const [lvKey, recKey] of [['lvEn', 'recentEn'], ['lvMath', 'recentMath']]) {
      const r = p[recKey];
      if (r.length < 12) continue;
      const acc = r.reduce((s, x) => s + x, 0) / r.length;
      if (acc >= 0.85 && p[lvKey] < 2) { p[lvKey] = 2; p[recKey] = []; }
      else if (acc < 0.6 && p[lvKey] > 1) { p[lvKey] = 1; p[recKey] = []; }
    }
  }

  // =========================================================
  //  クリア！
  // =========================================================
  function showClear(p, d) {
    keepAwake(false);
    SFX.fanfare();
    const st = streak(p);
    const n = lessonsOf(d);
    const newBadge = n === 1 && STREAK_BADGES.includes(st);
    const more = canLesson(p, d);
    speak([{ text: `レッスン ${n}かい クリア！ ゲームの じかんを ${p.gameMin}ぷん ゲットしたよ`, lang: 'ja' }]);
    const conf = Array.from({ length: 40 }, (_, i) => `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 1.5).toFixed(2)}s;background:hsl(${(i * 37) % 360} 90% 60%)"></i>`).join('');
    render(`
      <section class="screen clear">
        <div class="confetti">${conf}</div>
        <div class="stamp-big">${d.stamp}</div>
        <h1>レッスン ${n}かい クリア！</h1>
        <p class="big-msg">🎮 ゲーム <b>+${p.gameMin}ぷん</b> ゲット！</p>
        <p>ゲームタイム のこり <b>${fmt(gameRemaining(d))}</b></p>
        <p>きょう とけた もんだい：<b>${d.c}</b> / ${d.q} もん</p>
        <p>🔥 <b>${st}にち</b> れんぞく！${newBadge ? ' 🏅 メダル ゲット！' : ''}</p>
        <button class="btn big primary go-game">🎮 ゲームタイムへ</button>
        ${more ? `<button class="btn big ghost go-next">📚 もう1かい レッスン</button>` : ''}
        <button class="btn ghost go-dash">ホームに もどる</button>
      </section>`, 'clear');
    on('.go-game', 'click', () => showGame());
    on('.go-next', 'click', () => showStudy());
    on('.go-dash', 'click', () => showDash());
  }

  // =========================================================
  //  ゲームタイム
  // =========================================================
  function showGame() {
    const p = cur(); if (!p) return showHome();
    const d = today(p);
    if (!d.cleared) return showDash();
    let warned5 = gameRemaining(d) <= 300, warned1 = gameRemaining(d) <= 60, ended = gameRemaining(d) <= 0;

    render(`
      <section class="screen gamescr">
        <header class="topbar"><button class="icon-btn back" aria-label="もどる">←</button><h2>🎮 ゲームタイム</h2><span></span></header>
        <div class="gring"></div>
        <p class="gmsg"></p>
        <button class="btn big primary toggle"></button>
        ${deviceNote()}
        <p class="note">ゲームを するときに「スタート」、やめるときは「ストップ」。<br>とめている あいだは へらないよ。</p>
      </section>`, 'game');

    function draw() {
      const left = gameRemaining(d);
      const total = Math.max(d.gameTotal || 0, p.gameMin * 60, left);
      $('.gring').innerHTML = ring(Math.max(0, left) / total, `<b class="gtime">${fmt(left)}</b><small>のこり</small>`, 'game-ring');
      const run = !!d.gameRunAt;
      const t = $('.toggle');
      if (left <= 0) {
        t.textContent = 'おしまい'; t.disabled = true;
        $('.gmsg').innerHTML = canLesson(p, d) ? `⏰ ゲームの じかんは おしまい！<br>レッスンを すると また ${p.gameMin}ぷん もらえるよ` : '⏰ ゲームの じかんは おしまい！<br>また あした がんばろう！';
      } else {
        t.textContent = run ? '⏸ ストップ' : '▶ スタート';
        t.classList.toggle('danger', run);
        $('.gmsg').textContent = run ? 'たのしんでね！' : 'とまっているよ';
      }
    }
    function stop() {
      if (!d.gameRunAt) return;
      d.gameLeft = Math.max(0, gameRemaining(d)); d.gameRunAt = null; save();
    }
    on('.toggle', 'click', () => {
      SFX.tap();
      if (d.gameRunAt) stop();
      else if (gameRemaining(d) > 0) { d.gameRunAt = Date.now(); save(); keepAwake(true); launchDeviceTimer(gameRemaining(d), 'ゲームタイム おしまい'); }
      draw();
    });
    on('.back', 'click', () => { keepAwake(false); showDash(); });
    every(500, () => {
      const left = gameRemaining(d);
      if (d.gameRunAt && left <= 300 && !warned5) { warned5 = true; SFX.warn(); speak([{ text: 'のこり 5ふん だよ', lang: 'ja' }]); }
      if (d.gameRunAt && left <= 60 && !warned1) { warned1 = true; SFX.warn(); speak([{ text: 'のこり 1ぷん だよ', lang: 'ja' }]); }
      if (left <= 0 && !ended) {
        ended = true;
        d.gameLeft = 0; d.gameRunAt = null; save();
        SFX.alarm(); setTimeout(SFX.alarm, 1200);
        speak([{ text: 'ゲームの じかんは おしまいです。 また あした がんばろう', lang: 'ja' }]);
        if (navigator.vibrate) navigator.vibrate([400, 200, 400]);
        keepAwake(false);
      }
      draw();
    });
    if (d.gameRunAt) keepAwake(true);
    draw();
  }

  // =========================================================
  //  端末の タイマー 連携（ゲーム中でも 鳴らすため）
  //  ios: ショートカットアプリ経由で 時計のタイマーを開始 / android: 時計アプリに SET_TIMER
  // =========================================================
  const DEFAULT_SHORTCUT = 'ゲームタイマー';
  const deviceMode = () => (S.settings && S.settings.deviceTimer) || 'off';
  const deviceName = () => (deviceMode() === 'android' ? 'スマホ・タブレット' : 'iPad');
  function launchDeviceTimer(sec, label) {
    const mode = deviceMode();
    if (mode === 'off' || sec <= 0) return false;
    let url;
    if (mode === 'ios') {
      const name = S.settings.shortcutName || DEFAULT_SHORTCUT;
      url = `shortcuts://run-shortcut?name=${encodeURIComponent(name)}&input=text&text=${Math.max(1, Math.ceil(sec / 60))}`;
    } else {
      url = `intent:#Intent;action=android.intent.action.SET_TIMER;i.android.intent.extra.alarm.LENGTH=${Math.max(1, Math.round(sec))};` +
        `S.android.intent.extra.alarm.MESSAGE=${encodeURIComponent(label || 'まいにち30ぷん')};B.android.intent.extra.alarm.SKIP_UI=true;end`;
    }
    const a = document.createElement('a');
    a.href = url; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
    return true;
  }
  const deviceNote = () => (deviceMode() === 'off' ? '' :
    `<p class="dev-note">📱 スタートすると ${deviceName()}の タイマーも うごくよ。<br>とめるときは ${deviceName()}の タイマーも とめてね。</p>`);

  // =========================================================
  //  タイマー（はみがき・しゅくだい など なんでも）
  // =========================================================
  const TIMER_PRESETS = [
    { icon: '🪥', label: 'はみがき', min: 3 },
    { icon: '🧹', label: 'おかたづけ', min: 10 },
    { icon: '📖', label: 'しゅくだい', min: 20 },
    { icon: '🛁', label: 'おふろ', min: 15 },
    { icon: '🍽️', label: 'ごはん', min: 30 },
    { icon: '📺', label: 'テレビ', min: 30 },
  ];
  const TIMER_MINUTES = [1, 3, 5, 10, 15, 20, 30, 45, 60];
  function timerState() {
    if (!S.timer) S.timer = { total: 180, left: 180, runAt: null, label: 'タイマー', icon: '⏱', alarmed: false };
    return S.timer;
  }
  function timerRunning() { return !!(S.timer && S.timer.runAt); }
  function timerLeft() {
    const t = S.timer; if (!t) return 0;
    return t.runAt ? t.left - (Date.now() - t.runAt) / 1000 : t.left;
  }
  function timerSet(sec, label, icon) {
    const t = timerState();
    t.total = t.left = Math.max(10, Math.min(sec, 3 * 3600));
    t.runAt = null; t.alarmed = false;
    if (label) { t.label = label; t.icon = icon || '⏱'; }
    save();
  }

  // タイマーが おわったら どの がめんでも しらせる
  let alarmTimer = null;
  function timerAlarm() {
    const t = timerState();
    t.left = 0; t.runAt = null; t.alarmed = true; save();
    keepAwake(false);
    if (document.querySelector('.timer-ov')) return;
    let n = 0;
    const ring = () => { SFX.alarm(); if (navigator.vibrate) navigator.vibrate([300, 150, 300]); if (++n >= 15) stop(); };
    ring();
    speak([{ text: `じかんです！ ${t.label === 'タイマー' ? '' : t.label + 'の じかんは'} おしまい！`, lang: 'ja' }]);
    alarmTimer = setInterval(ring, 2000);
    const ov = document.createElement('div');
    ov.className = 'overlay timer-ov';
    ov.innerHTML = `<div class="ov-card alarm-card">
      <div class="ov-emoji ringing">⏰</div>
      <h2>${t.icon} ${esc(t.label)}<br>じかんです！</h2>
      <button class="btn big primary stop">とめる</button>
    </div>`;
    function stop() { clearInterval(alarmTimer); alarmTimer = null; }
    ov.querySelector('.stop').addEventListener('click', () => {
      stop(); ov.remove();
      t.left = t.total; t.alarmed = false; save();
      const scr = app.dataset.screen;
      if (scr === 'timer') showTimer(timerBack);
      else if (scr === 'dash') showDash();
      else if (scr === 'home') showHome();
    });
    document.body.appendChild(ov);
  }
  setInterval(() => { if (timerRunning() && timerLeft() <= 0) timerAlarm(); }, 500);

  let timerBack = null;
  function showTimer(back) {
    timerBack = back || (S.current ? showDash : showHome);
    const t = timerState();
    if (timerRunning()) keepAwake(true);
    render(`
      <section class="screen timerscr">
        <header class="topbar"><button class="icon-btn back" aria-label="もどる">←</button><h2>⏱ タイマー</h2><span></span></header>
        <div class="timer-grid">
          <div class="timer-face">
            <div class="tring"></div>
            <div class="tbtns">
              <button class="btn big primary tgo"></button>
              <button class="btn ghost treset">↺ もどす</button>
            </div>
            ${deviceNote()}
          </div>
          <div class="timer-ctrl">
            <div class="card">
              <h3>なにの タイマー？</h3>
              <div class="tpresets">${TIMER_PRESETS.map((x, i) => `<button class="tpreset ${t.label === x.label ? 'on' : ''}" data-i="${i}"><span>${x.icon}</span><b>${x.label}</b><small>${x.min}ぷん</small></button>`).join('')}</div>
            </div>
            <div class="card">
              <h3>じかんを えらぶ</h3>
              <div class="tmins">${TIMER_MINUTES.map((m) => `<button class="tmin" data-m="${m}">${m}<small>ぷん</small></button>`).join('')}</div>
              <div class="tadj">
                <button class="btn tadd" data-s="-60">−1ぷん</button>
                <button class="btn tadd" data-s="-10">−10びょう</button>
                <button class="btn tadd" data-s="10">+10びょう</button>
                <button class="btn tadd" data-s="60">+1ぷん</button>
              </div>
            </div>
          </div>
        </div>
      </section>`, 'timer');

    let warned = false;
    function draw() {
      const left = Math.max(0, timerLeft());
      const run = timerRunning();
      $('.tring').innerHTML = ring(t.total ? left / t.total : 0,
        `<span class="tlabel2">${t.icon} ${esc(t.label)}</span><b class="gtime">${fmt(left)}</b><small>${run ? 'すすんでいるよ' : left < t.total ? 'とまっているよ' : 'スタートを おしてね'}</small>`,
        'game-ring timer-ring' + (run && left <= 10 ? ' last' : ''));
      const go = $('.tgo');
      go.textContent = run ? '⏸ ストップ' : left < t.total && left > 0 ? '▶ つづける' : '▶ スタート';
      go.classList.toggle('danger', run);
      $$('.tadd, .tmin, .tpreset').forEach((b) => { b.disabled = run; });
      $$('.tmin').forEach((b) => b.classList.toggle('on', !run && +b.dataset.m * 60 === t.total));
      if (run && left <= 60 && left > 55 && !warned && t.total > 120) { warned = true; SFX.warn(); speak([{ text: 'のこり 1ぷん だよ', lang: 'ja' }]); }
    }
    on('.tgo', 'click', () => {
      SFX.tap();
      if (timerRunning()) { t.left = Math.max(0, timerLeft()); t.runAt = null; keepAwake(false); }
      else { if (t.left <= 0) t.left = t.total; t.runAt = Date.now(); t.alarmed = false; keepAwake(true); save(); launchDeviceTimer(t.left, t.label); }
      save(); draw();
    });
    on('.treset', 'click', () => { SFX.tap(); t.runAt = null; t.left = t.total; warned = false; save(); keepAwake(false); draw(); });
    on('.tmin', 'click', (e) => { SFX.tap(); timerSet(+e.currentTarget.dataset.m * 60); draw(); });
    on('.tadd', 'click', (e) => { SFX.tap(); timerSet(t.total + +e.currentTarget.dataset.s); draw(); });
    on('.tpreset', 'click', (e) => {
      SFX.tap();
      const x = TIMER_PRESETS[+e.currentTarget.dataset.i];
      timerSet(x.min * 60, x.label, x.icon);
      $$('.tpreset').forEach((b) => b.classList.toggle('on', b === e.currentTarget));
      draw();
    });
    on('.back', 'click', () => timerBack());
    every(250, draw);
    draw();
  }

  // =========================================================
  //  おうちの人
  // =========================================================
  function pinGate(next) {
    if (!S.settings.pin) return next();
    let v = '';
    render(`
      <section class="screen pin">
        <h2>おうちの人 せんよう</h2>
        <p>4けたの あんしょうばんごうを いれてください</p>
        <div class="pin-dots">${'<i></i>'.repeat(4)}</div>
        <div class="keypad pinpad">${['1', '2', '3', '4', '5', '6', '7', '8', '9', 'back', '0', 'del'].map((k) => `<button class="key" data-k="${k}">${k === 'del' ? '⌫' : k === 'back' ? '←' : k}</button>`).join('')}</div>
      </section>`, 'pin');
    const dots = () => $$('.pin-dots i').forEach((el, i) => el.classList.toggle('on', i < v.length));
    on('.key', 'click', (e) => {
      const k = e.currentTarget.dataset.k;
      if (k === 'back') return S.current ? showDash() : showHome();
      if (k === 'del') v = v.slice(0, -1); else if (v.length < 4) v += k;
      dots();
      if (v.length === 4) {
        if (v === S.settings.pin) next();
        else { $('.pin-dots').classList.add('shake'); setTimeout(() => { v = ''; dots(); $('.pin-dots').classList.remove('shake'); }, 500); }
      }
    });
  }

  function showParent() {
    const rows = S.profiles.map((p) => {
      const d = p.days[dkey()] || { sec: 0, q: 0, c: 0 };
      return `<div class="prow">
        <div class="pinfo"><span class="av">${p.avatar}</span><div><b>${esc(p.name)}</b> <small>${GRADES[p.grade]}</small><br>
          <small>きょう ${Math.floor(d.sec / 60)}分 / ${p.studyMin}分・${d.q}問 正解${d.q ? Math.round((d.c / d.q) * 100) : 0}%・レッスン${lessonsOf(d)}回・🔥${streak(p)}日</small></div></div>
        <div class="pbtns">
          <button class="btn sm edit" data-id="${p.id}">せってい</button>
          <button class="btn sm ghost report" data-id="${p.id}">きろく</button>
        </div>
      </div>`;
    }).join('');
    render(`
      <section class="screen parent">
        <header class="topbar"><button class="icon-btn back" aria-label="もどる">←</button><h2>おうちの人の せってい</h2><span></span></header>

        <div class="card">
          <h3>お子さま</h3>
          ${rows || '<p>まだ登録がありません</p>'}
          <button class="btn primary add">＋ お子さまを追加</button>
        </div>

        <div class="card">
          <h3>全体の設定</h3>
          <label class="switch-row"><input type="checkbox" class="voice" ${S.settings.voice ? 'checked' : ''}> 読み上げ（英語の発音・問題文）</label>
          <label class="switch-row"><input type="checkbox" class="sound" ${S.settings.sound ? 'checked' : ''}> 効果音</label>
          <div class="pin-row">
            <span>保護者用の暗証番号（4桁）：${S.settings.pin ? '設定済み' : '<b class="warn">未設定</b>'}</span>
            <input class="pin-in" inputmode="numeric" maxlength="4" pattern="[0-9]*" placeholder="新しい4桁">
            <button class="btn sm set-pin">保存</button>
            ${S.settings.pin ? '<button class="btn sm ghost clear-pin">解除</button>' : ''}
          </div>
          <p class="hint">暗証番号を設定すると、お子さまが勝手に時間を変えたりクリア扱いにしたりできなくなります。</p>
        </div>

        <div class="card devtimer">
          <h3>端末のタイマーと連携</h3>
          <p class="hint">ゲームアプリに切り替えると、このアプリのアラームは鳴りません。連携すると、ゲームタイムやタイマーを「スタート」したときに<b>端末の時計アプリのタイマー</b>も同じ時間でセットされ、ゲーム中でも時間になると鳴ります。</p>
          <label class="field">連携のしかた
            <select class="dev-mode">
              <option value="off" ${deviceMode() === 'off' ? 'selected' : ''}>使わない（このアプリのタイマーだけ）</option>
              <option value="ios" ${deviceMode() === 'ios' ? 'selected' : ''}>iPad・iPhone（ショートカット）</option>
              <option value="android" ${deviceMode() === 'android' ? 'selected' : ''}>Android（時計アプリ）</option>
            </select>
          </label>
          <div class="dev-ios ${deviceMode() === 'ios' ? '' : 'hidden'}">
            <label class="field">ショートカットの名前
              <input class="sc-name" value="${esc(S.settings.shortcutName || DEFAULT_SHORTCUT)}" maxlength="40">
            </label>
            <details class="steps" ${S.settings.shortcutName ? '' : 'open'}>
              <summary>ショートカットの作り方（最初に1回だけ・約2分）</summary>
              <ol>
                <li>iPadの「<b>ショートカット</b>」アプリを開き、右上の「＋」で新規作成します。</li>
                <li>名前を「<b class="sc-name-show">${esc(S.settings.shortcutName || DEFAULT_SHORTCUT)}</b>」にします（上の名前と同じにしてください）。</li>
                <li>「アクションを追加」で「<b>数字</b>」と検索し、「<b>入力から数値を取得</b>」を追加します（入力は「ショートカットの入力」）。</li>
                <li>続けて「<b>タイマー</b>」と検索し、時計の「<b>タイマーを開始</b>」を追加します。</li>
                <li>「タイマーを開始」の時間の部分をタップして、変数「<b>数値</b>」を選び、単位を「<b>分</b>」にします。</li>
                <li>右上の「ⓘ」→「共有シートに表示」をオンにして、受け取る入力を「テキスト」にしておくと確実です。</li>
                <li>下の「1分でテスト」を押して、時計アプリのタイマーが1分で動けば完了です。</li>
              </ol>
              <p class="hint">初回はショートカットの実行を許可するか聞かれることがあります。「許可」を選んでください。スタート後はショートカットアプリが開くので、そのままゲームを開いて遊べます。</p>
            </details>
          </div>
          <div class="dev-android ${deviceMode() === 'android' ? '' : 'hidden'}">
            <p class="hint">Chrome でこのアプリを開いて使ってください。「1分でテスト」で時計アプリのタイマーが動けば準備完了です（機種によっては対応していない場合があります）。</p>
          </div>
          <button class="btn sm dev-test ${deviceMode() === 'off' ? 'hidden' : ''}">1分でテスト</button>
        </div>

        <div class="card">
          <h3>データ</h3>
          <p class="hint">記録はこの端末（ブラウザ）の中だけに保存されます。機種変更の前にバックアップしてください。</p>
          <button class="btn sm export">バックアップを保存</button>
          <label class="btn sm ghost">バックアップから復元<input type="file" accept="application/json" class="import" hidden></label>
          <button class="btn sm danger wipe">すべて削除</button>
        </div>

        <div class="card howto">
          <h3>つかいかた</h3>
          <ol>
            <li>毎日「べんきょう スタート」。英語（約7割）と算数（約3割）の問題が学年に合わせて出ます。</li>
            <li>タイマーは <b>問題に取り組んでいる間だけ</b> 進みます（${IDLE_LIMIT}秒操作がないと自動で止まります）。途中でやめても続きから再開できます。</li>
            <li><b>レッスン1回（標準30分）をクリアするごとに、ゲームタイム30分</b>がもらえます。2回やれば60分、3回で90分と貯まります（1日の上限回数はお子さまごとの設定で変更できます）。</li>
            <li>ゲームタイムは「スタート／ストップ」で使った分だけ減ります。残り5分・1分でお知らせ、0分でアラームが鳴ります。その日のうちに使い切りです。</li>
            <li>正解率に合わせて「かんたん」「ふつう」の難しさが自動で切り替わります。まちがえた問題は少しあとにもう一度出ます。</li>
            <li>ホーム画面に追加すると、アプリのように全画面で使えます（iPhone/iPad：共有ボタン →「ホーム画面に追加」）。</li>
          </ol>
        </div>
      </section>`, 'parent');

    on('.back', 'click', () => (S.current ? showDash() : showHome()));
    on('.add', 'click', () => showProfileForm(null));
    on('.edit', 'click', (e) => showProfileForm(e.currentTarget.dataset.id));
    on('.report', 'click', (e) => showReport(e.currentTarget.dataset.id));
    on('.voice', 'change', (e) => { S.settings.voice = e.target.checked; save(); });
    on('.dev-mode', 'change', (e) => {
      S.settings.deviceTimer = e.target.value; save();
      $('.dev-ios').classList.toggle('hidden', e.target.value !== 'ios');
      $('.dev-android').classList.toggle('hidden', e.target.value !== 'android');
      $('.dev-test').classList.toggle('hidden', e.target.value === 'off');
    });
    on('.sc-name', 'input', (e) => {
      S.settings.shortcutName = e.target.value.trim() || DEFAULT_SHORTCUT; save();
      $$('.sc-name-show').forEach((el) => { el.textContent = S.settings.shortcutName; });
    });
    on('.dev-test', 'click', () => launchDeviceTimer(60, 'テスト'));
    on('.sound', 'change', (e) => { S.settings.sound = e.target.checked; save(); });
    on('.set-pin', 'click', () => {
      const v = $('.pin-in').value.trim();
      if (!/^\d{4}$/.test(v)) return alert('数字4桁で入力してください');
      S.settings.pin = v; save(); alert('暗証番号を保存しました'); showParent();
    });
    on('.clear-pin', 'click', () => { if (confirm('暗証番号を解除しますか？')) { S.settings.pin = ''; save(); showParent(); } });
    on('.export', 'click', () => {
      const blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `mainichi30-backup-${dkey()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    });
    on('.import', 'change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then((t) => {
        try {
          const s = JSON.parse(t);
          if (!s || !Array.isArray(s.profiles)) throw new Error('形式が違います');
          if (!confirm('今のデータを上書きして復元しますか？')) return;
          S = s; save(); alert('復元しました'); showParent();
        } catch (err) { alert('復元できませんでした：' + err.message); }
      });
    });
    on('.wipe', 'click', () => {
      if (confirm('すべてのお子さまの記録を削除します。よろしいですか？') && confirm('本当に削除しますか？（元に戻せません）')) {
        localStorage.removeItem(STORE_KEY); S = load(); showHome();
      }
    });
  }

  function showProfileForm(id, first) {
    const p = id ? S.profiles.find((x) => x.id === id) : null;
    const v = p || { name: '', grade: 3, avatar: AVATARS[S.profiles.length % AVATARS.length], studyMin: 30, gameMin: 30, enRatio: 0.7, maxLessons: 0 };
    const opts = (arr, sel) => arr.map(([val, label]) => `<option value="${val}" ${String(val) === String(sel) ? 'selected' : ''}>${label}</option>`).join('');
    const mins = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60].map((m) => [m, m + '分']);
    const d = p ? p.days[dkey()] : null;
    render(`
      <section class="screen pform">
        ${first ? `<h1 class="logo">まいにち<b>30</b>ぷん</h1>
          <p class="lead">英語を中心に算数もまぜて、毎日30分がんばったら<br>30分のゲームタイムがもらえるアプリです。</p>
          <p class="hint">はじめに、おうちの人がお子さまを登録してください。</p>` :
          `<header class="topbar"><button class="icon-btn back" aria-label="もどる">←</button><h2>${p ? 'お子さまの設定' : 'お子さまを追加'}</h2><span></span></header>`}
        <form class="card form">
          <label>なまえ（ニックネーム）<input name="name" required maxlength="12" value="${esc(v.name)}" placeholder="例：たろう"></label>
          <label>学年
            <select name="grade">${opts(GRADES.map((g, i) => [i, g]), v.grade)}</select>
          </label>
          <fieldset><legend>アイコン</legend>
            <div class="avatars">${AVATARS.map((a) => `<label class="avatar"><input type="radio" name="avatar" value="${a}" ${a === v.avatar ? 'checked' : ''}><span>${a}</span></label>`).join('')}</div>
          </fieldset>
          <div class="two">
            <label>1回のレッスン時間<select name="studyMin">${opts(mins, v.studyMin)}</select></label>
            <label>1回でもらえるゲーム時間<select name="gameMin">${opts(mins, v.gameMin)}</select></label>
          </div>
          <label>1日のレッスン回数の上限
            <select name="maxLessons">${opts([[0, '上限なし'], [1, '1回まで'], [2, '2回まで'], [3, '3回まで'], [4, '4回まで']], v.maxLessons || 0)}</select>
          </label>
          <label>英語と算数の割合
            <select name="enRatio">${opts(ENRATIOS.map((r) => [r, `英語 ${Math.round(r * 100)}% ／ 算数 ${100 - Math.round(r * 100)}%`]), v.enRatio)}</select>
          </label>
          ${p ? `<p class="hint">いまの難しさ：英語「${p.lvEn > 1 ? 'ふつう' : 'かんたん'}」・算数「${p.lvMath > 1 ? 'ふつう' : 'かんたん'}」（正解率で自動調整）</p>` : ''}
          <button class="btn big primary" type="submit">${p ? '保存' : '登録する'}</button>
        </form>
        ${p ? `<div class="card">
          <h3>きょうの調整</h3>
          <p class="hint">きょう：${Math.floor((d ? d.sec : 0) / 60)}分・レッスン${lessonsOf(d)}回${d && d.cleared ? `・ゲーム残り ${fmt(gameRemaining(d))}` : ''}</p>
          <button class="btn sm grant">レッスン1回分をクリア扱い（+ゲーム${p ? p.gameMin : 30}分）</button>
          <button class="btn sm add10">ゲーム時間 +10分</button>
          <button class="btn sm ghost reset-today">きょうの記録をリセット</button>
          <hr>
          <button class="btn sm danger del">このお子さまを削除</button>
        </div>` : ''}
      </section>`, 'pform');

    on('.back', 'click', showParent);
    on('.form', 'submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = String(f.get('name') || '').trim();
      if (!name) return;
      const t = p || newProfile(name, 0, '🐶');
      t.name = name;
      t.grade = +f.get('grade');
      t.avatar = f.get('avatar') || t.avatar;
      t.studyMin = +f.get('studyMin');
      t.gameMin = +f.get('gameMin');
      t.enRatio = +f.get('enRatio');
      t.maxLessons = +f.get('maxLessons');
      if (!p) { S.profiles.push(t); S.current = t.id; }
      save();
      if (first) showDash(); else showParent();
    });
    if (p) {
      const t = today(p);
      on('.grant', 'click', () => {
        grantLesson(p, t); save(); showProfileForm(id);
      });
      on('.add10', 'click', () => {
        if (!t.cleared) { t.cleared = true; t.stamp = t.stamp || STAMPS[0]; t.gameLeft = 0; t.gameTotal = 0; }
        if (t.gameRunAt) { t.gameLeft = Math.max(0, gameRemaining(t)); t.gameRunAt = Date.now(); }
        t.gameLeft = Math.max(0, t.gameLeft) + 600; t.gameTotal = (t.gameTotal || 0) + 600; save(); showProfileForm(id);
      });
      on('.reset-today', 'click', () => { if (confirm('きょうの記録（時間・レッスン回数・ゲーム時間）をリセットしますか？')) { delete p.days[dkey()]; save(); showProfileForm(id); } });
      on('.del', 'click', () => {
        if (confirm(`${p.name} さんの記録をすべて削除しますか？`)) {
          S.profiles = S.profiles.filter((x) => x.id !== id);
          if (S.current === id) S.current = null;
          save(); showParent();
        }
      });
    }
  }

  function showReport(id) {
    const p = S.profiles.find((x) => x.id === id); if (!p) return showParent();
    const days = [];
    for (let i = 13; i >= 0; i--) { const k = dkey(addDays(new Date(), -i)); days.push([k, p.days[k] || { sec: 0, q: 0, c: 0 }]); }
    const maxMin = Math.max(p.studyMin, ...days.map(([, d]) => d.sec / 60));
    const bars = days.map(([k, d]) => {
      const h = Math.round(((d.sec / 60) / maxMin) * 100);
      return `<div class="bar ${d.cleared ? 'ok' : ''}" title="${k}：${Math.floor(d.sec / 60)}分・レッスン${lessonsOf(d)}回・${d.q}問">
        <span style="height:${h}%"></span><small>${+k.slice(8)}</small></div>`;
    }).join('');
    const kinds = Object.entries(p.kinds).filter(([, v]) => v.q >= 3).map(([k, v]) => [k, v.q, v.c / v.q]).sort((a, b) => a[2] - b[2]);
    const total = Object.values(p.days).reduce((s, d) => ({ sec: s.sec + d.sec, q: s.q + d.q, c: s.c + d.c }), { sec: 0, q: 0, c: 0 });
    render(`
      <section class="screen report">
        <header class="topbar"><button class="icon-btn back" aria-label="もどる">←</button><h2>${p.avatar} ${esc(p.name)} の記録</h2><span></span></header>
        <div class="card">
          <h3>これまで</h3>
          <p>クリア ${clearedCount(p)}日・レッスン ${Object.values(p.days).reduce((n, d) => n + lessonsOf(d), 0)}回・いまの連続 ${streak(p)}日・最長 ${bestStreak(p)}日<br>
          学習 ${Math.floor(total.sec / 3600)}時間${Math.floor((total.sec % 3600) / 60)}分・${total.q}問・正解率 ${total.q ? Math.round((total.c / total.q) * 100) : 0}%・⭐${p.stars}</p>
        </div>
        <div class="card cal parent-cal" data-cal></div>
        <div class="card">
          <h3>最近14日の学習時間 <small>（緑＝クリア、線＝目標${p.studyMin}分）</small></h3>
          <div class="bars" style="--goal:${(p.studyMin / maxMin) * 100}%">${bars}</div>
        </div>
        <div class="card">
          <h3>問題の種類ごとの正解率 <small>（苦手な順）</small></h3>
          ${kinds.length ? `<table class="kt"><tr><th>種類</th><th>問題数</th><th>正解率</th></tr>${kinds.map(([k, q, a]) => `<tr><td>${esc(k)}</td><td>${q}</td><td><span class="acc" style="--a:${Math.round(a * 100)}%">${Math.round(a * 100)}%</span></td></tr>`).join('')}</table>` : '<p class="hint">まだデータが少ないです</p>'}
        </div>
      </section>`, 'report');
    on('.back', 'click', showParent);
    mountCalendar($('[data-cal]'), p, true);
  }

  // ---------- 日付が かわったら ホームを 更新 ----------
  let lastDay = dkey();
  setInterval(() => {
    if (dkey() !== lastDay) {
      lastDay = dkey();
      if (['dash', 'home'].includes(app.dataset.screen)) showHome();
    }
  }, 30000);

  // ---------- オフライン対応 ----------
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // 起動
  if (S.current && cur()) showDash(); else showHome();
})();
