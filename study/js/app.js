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
  const NO_REPEAT_MS = 10 * 60 * 1000; // おなじ問題を 出さない 時間（10ぷん）
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
  let S = migrate(load());
  save();
  // まえの 標準（30分 → 30分）のまま だった子を、いまの 標準（10分 → 10分）に（1回だけ）
  function migrate(st) {
    for (const p of st.profiles || []) {
      if (p.min10) continue;
      if (p.studyMin === 30 && p.gameMin === 30) { p.studyMin = 10; p.gameMin = 10; }
      p.min10 = true;
    }
    return st;
  }
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
      studyMin: 10, gameMin: 10, enRatio: 0.7, maxLessons: 0, min10: true,
      lvEn: 1, lvMath: 1, recentEn: [], recentMath: [],
      level: { en: 4, math: 4, auto: true, from: '', v2: true }, xp: 0,
      stars: 0, days: {}, kinds: {},
    };
  }
  function today(p) {
    const k = dkey();
    if (!p.days[k]) p.days[k] = { sec: 0, q: 0, c: 0, lessons: 0, lessonSec: 0, cleared: false, gameLeft: 0, gameTotal: 0, gameRunAt: null, stamp: null };
    return p.days[k];
  }
  // ---------- 毎日すこしずつ むずかしく（レベル 1〜10） ----------
  // prev: 前の学年から出す割合 / hard: 「ふつう」問題の割合 / next: 上の学年にチャレンジする割合
  const LEVELS = [
    null,
    { prev: 0.3, hard: 0, next: 0, ja: '前の学年の復習多め・かんたん' },
    { prev: 0.15, hard: 0, next: 0, ja: '前の学年の復習すこし・かんたん' },
    { prev: 0, hard: 0, next: 0, ja: 'かんたん' },
    { prev: 0, hard: 0.5, next: 0, ja: 'ふつうの問題がまじる' },
    { prev: 0, hard: 0.75, next: 0, ja: 'ふつうの問題が多め' },
    { prev: 0, hard: 1, next: 0, ja: 'ふつう' },
    { prev: 0, hard: 1, next: 0.15, ja: '上の学年にチャレンジ（約15%）' },
    { prev: 0, hard: 1, next: 0.25, ja: '上の学年にチャレンジ（約25%）' },
    { prev: 0, hard: 1, next: 0.35, ja: '上の学年にチャレンジ（約35%）' },
    { prev: 0, hard: 1, next: 0.5, ja: '上の学年にチャレンジ（約半分）' },
    { prev: 0, hard: 1, next: 0.6, ja: '上の学年の問題が6割' },
    { prev: 0, hard: 1, next: 0.7, ja: '上の学年の問題が7割' },
    { prev: 0, hard: 1, next: 0.8, ja: '上の学年の問題が8割' },
    { prev: 0, hard: 1, next: 0.9, ja: '上の学年の問題が9割' },
    { prev: 0, hard: 1, next: 1, ja: 'ぜんぶ上の学年の問題' },
  ];
  const maxLevel = (p) => (p.grade >= 8 ? 6 : 15); // 小6は 上の学年が ないので 6まで
  function levels(p) {
    if (!p.level) {
      // まえの しくみ（かんたん／ふつう）から ひきつぐ
      p.level = { en: p.lvEn > 1 ? 5 : 4, math: p.lvMath > 1 ? 5 : 4, auto: true, from: '' };
    }
    // クエスト制に かえたとき：かんたんすぎないよう Lv4 からに
    if (!p.level.v2) { p.level.en = Math.max(p.level.en, 4); p.level.math = Math.max(p.level.math, 4); p.level.v2 = true; }
    return p.level;
  }
  // その日の レベルを きろく（記録画面の 推移用）
  function dailyLevelUp(p) {
    const L = levels(p), d = today(p);
    d.lvE = L.en; d.lvM = L.math;
  }
  // プレイヤーレベル（XP）
  const xpNeed = (n) => 50 * n * (n + 1); // Lv.n → n+1 に ひつような るいけい XP
  function playerLevel(xp) { let n = 1; while (xp >= xpNeed(n)) n++; return n; }

  // レベルから、この もんだいの 学年と むずかしさを きめる
  function pickGradeLv(p, subj, sessionDrop) {
    const L = levels(p), g = p.grade;
    const lvNo = Math.max(1, L[subj === 'en' ? 'en' : 'math'] - (sessionDrop ? 1 : 0));
    const cfg = LEVELS[Math.min(lvNo, LEVELS.length - 1)];
    const r = Math.random();
    let gg = g;
    if (g > 0 && r < cfg.prev) gg = g - 1;
    else if (g < 8 && r < cfg.next) gg = g + 1;
    const lv = gg > g ? (Math.random() < 0.5 ? 2 : 1) : Math.random() < cfg.hard ? 2 : 1;
    return { g: gg, lv, lvNo };
  }

  // ---------- 目標（えいかいわロード・算数の目標） ----------
  const STEPS = window.CONV_STEPS || [];
  const CONV_SHARE = 0.6; // えいごの もんだいの うち、えいかいわロードから だす わりあい
  const MASTER = 2;       // 1つの ひょうげんを 何回 せいかいしたら「おぼえた」か
  function goals(p) {
    if (!p.conv) p.conv = { si: (window.CONV_START || [])[p.grade] || 0, target: STEPS.length - 1, due: '', m: {}, cleared: {} };
    if (!p.mathGoal) p.mathGoal = { unit: -1, target: 30, count: 0, done: '' };
    return p;
  }
  function stepProgress(p, si) {
    const units = Questions.unitsOf(si);
    const got = units.filter((u) => (p.conv.m[u.key] || 0) >= MASTER).length;
    return { got, total: units.length };
  }
  // ペース：これまでの クリアの はやさから、目標ステップに つく日を よそく
  function convPace(p) {
    const c = p.conv, left = c.target - c.si + 1;
    if (left <= 0) return null;
    const dates = Object.values(c.cleared).sort();
    const perStep = dates.length >= 2 ? (new Date(dates[dates.length - 1]) - new Date(dates[0])) / 864e5 / (dates.length - 1) : 7;
    const eta = addDays(new Date(), Math.ceil(Math.max(1, perStep) * left));
    return { left, eta, late: c.due ? dkey(eta) > c.due : false };
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

  // ---------- こえの にんしき（まねして いう れんしゅう） ----------
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  function hearSpeech(cb) {
    if (!SR) return cb(null);
    let done = false;
    const fin = (v) => { if (!done) { done = true; cb(v); } };
    try {
      try { speechSynthesis.cancel(); } catch (e) { /* なし */ }
      const r = new SR();
      r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 5;
      r.onresult = (e) => fin(Array.from(e.results[0]).map((a) => a.transcript));
      r.onerror = (e) => fin(e.error === 'no-speech' ? [] : null);
      r.onend = () => fin([]);
      r.start();
      setTimeout(() => { try { r.stop(); } catch (e) { /* なし */ } }, 7000);
    } catch (e) { fin(null); }
  }
  const wordsOf = (t) => t.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
  function speechScore(target, heard) {
    const want = wordsOf(target);
    let best = 0;
    for (const h of heard) {
      const got = new Set(wordsOf(h));
      best = Math.max(best, want.filter((w) => got.has(w) || got.has(w.replace(/'.*/, ''))).length / want.length);
    }
    return best;
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
    render(`
      <section class="screen home">
        <h1 class="logo">まいにち<b>30</b>ぷん</h1>
        <p class="lead">だれが べんきょう する？</p>
        <div class="who">
          ${S.profiles.map((p) => {
            const d = p.days[dkey()] || {};
            return `<button class="who-btn ${p.id === S.current ? 'last' : ''}" data-id="${p.id}">
              ${p.id === S.current ? '<span class="last-tag">さいごに つかった</span>' : ''}
              <span class="av">${p.avatar}</span><span class="nm">${esc(p.name)}</span>
              <span class="gr">${GRADES[p.grade]}</span>
              <span class="st">${d.cleared ? `✅ きょう レッスン ${lessonsOf(d)}かい` : '🔥 ' + streak(p) + 'にち れんぞく'}</span>
            </button>`;
          }).join('')}
          <button class="who-btn add-who"><span class="av">＋</span><span class="nm">ついか</span><span class="gr">おうちの人が とうろく</span></button>
        </div>
        <button class="btn big ghost go-timer">⏱ タイマー${timerRunning() ? ` <b class="tchip">${fmt(timerLeft())}</b>` : ''}</button>
        <button class="link parent-link">⚙ おうちの人の せってい</button>
      </section>`, 'home');
    on('.go-timer', 'click', () => { SFX.tap(); showTimer(showHome); });
    on('.who-btn', 'click', (e) => { SFX.tap(); S.current = e.currentTarget.dataset.id; save(); showDash(); });
    on('.add-who', 'click', () => { SFX.tap(); pinGate(() => showProfileForm(null, false, showHome), showHome); });
    on('.parent-link', 'click', () => pinGate(() => showParent(showHome), showHome));
  }

  // =========================================================
  //  子どもの ホーム
  // =========================================================
  function showDash() {
    keepAwake(false);
    const p = cur(); if (!p) return showHome();
    const d = today(p); dailyLevelUp(p);
    const L = levels(p);
    const target = p.studyMin * 60;
    const ls = lessonsOf(d), lsec = lessonSecOf(d), can = canLesson(p, d);
    const pct = can ? lsec / target : 1;
    const st = streak(p);
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
          <button class="me switch" aria-label="きりかえ"><span class="av">${p.avatar}</span><span><b>${esc(p.name)}</b><small>${GRADES[p.grade]} ・ <u>きりかえ</u></small></span></button>
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
                <div class="lv-chips"><span class="lv-chip en">🔤 えいご Lv.${L.en}</span><span class="lv-chip math">🔢 さんすう Lv.${L.math}</span>${(d.quests || []).length ? `<span class="lv-chip quest">⚔️ クエスト ${(d.quests || []).length}こ ・ ★${(d.quests || []).reduce((a, x) => a + x.st, 0)}</span>` : ''}</div>
                ${studyBtn}
              </div>
            </div>

            ${goalCardHTML(p)}

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
              <div class="stat"><span class="n">🏆 ${playerLevel(p.xp || 0)}</span><span class="l">プレイヤー Lv<br><small>つぎまで ${xpNeed(playerLevel(p.xp || 0)) - (p.xp || 0)}XP</small></span>
                <span class="xpbar"><span style="width:${(() => { const n = playerLevel(p.xp || 0); const lo = n > 1 ? xpNeed(n - 1) : 0; return Math.round((((p.xp || 0) - lo) / (xpNeed(n) - lo)) * 100); })()}%"></span></span></div>
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
    on('.go-road', 'click', () => { SFX.tap(); showRoad(); });
    if (timerRunning()) every(1000, () => { const el = $('.go-timer .tchip'); if (el) el.textContent = fmt(timerLeft()); });
    on('.switch', 'click', () => { SFX.tap(); showHome(); });
    on('.parent-link', 'click', () => pinGate(() => showParent(showDash)));
    if (running) every(1000, () => { const el = $('.gl'); if (el) el.textContent = fmt(gameRemaining(today(p))); });
    mountCalendar($('[data-cal]'), p, false);
  }

  // ---------- 目標カード ----------
  function goalCardHTML(p) {
    goals(p);
    const c = p.conv, st = STEPS[c.si];
    if (!st) return '';
    const allDone = !!c.cleared[STEPS[STEPS.length - 1].id];
    const pr = stepProgress(p, c.si);
    const pace = convPace(p);
    const mg = p.mathGoal, units = Questions.mathUnits(p.grade);
    const mathRow = mg.unit >= 0 && units[mg.unit] ? `
      <button class="goal-row go-road">
        <span class="goal-ico">🧮</span>
        <span class="goal-txt"><small>さんすうの もくひょう</small><b>${esc(units[mg.unit])}</b>
          <span class="gbar math"><span style="width:${Math.min(100, (mg.count / mg.target) * 100)}%"></span></span>
          <small>${mg.done ? '🏅 たっせい！' : `${mg.count} / ${mg.target}もん せいかい`}</small></span>
      </button>` : '';
    return `<div class="card goal">
      <div class="goal-head"><h2>🎯 もくひょう</h2><button class="link go-road">えいかいわロード ›</button></div>
      <button class="goal-row go-road">
        <span class="goal-ico">${allDone ? '🏆' : st.icon}</span>
        <span class="goal-txt"><small>えいかいわ ステップ ${c.si + 1} / ${STEPS.length}</small><b>${allDone ? 'ぜんぶ クリア！' : esc(st.title)}</b>
          <span class="gbar"><span style="width:${allDone ? 100 : (pr.got / pr.total) * 100}%"></span></span>
          <small>${allDone ? 'えいごで かいわが できるね！' : `${pr.got} / ${pr.total} おぼえた`}${pace && c.due ? `・${pace.late ? '⏳ いそごう' : '👍 じゅんちょう'}` : ''}</small></span>
      </button>
      ${mathRow}
    </div>`;
  }

  // =========================================================
  //  えいかいわロード（ゴールまでの みち）
  // =========================================================
  function showRoad() {
    const p = cur(); if (!p) return showHome();
    goals(p);
    const c = p.conv;
    const pace = convPace(p);
    const rows = STEPS.map((st, i) => {
      const done = !!c.cleared[st.id];
      const now = i === c.si && !done;
      const pr = stepProgress(p, i);
      const state = done ? 'done' : now ? 'now' : i < c.si ? 'skip' : 'lock';
      return `<li class="road-step ${state} ${i === c.target ? 'target' : ''}">
        <button class="road-btn" data-i="${i}" ${state === 'lock' ? 'disabled' : ''}>
          <span class="road-dot">${done ? '✅' : now ? st.icon : state === 'skip' ? '⏭️' : '🔒'}</span>
          <span class="road-txt">
            <small>ステップ ${i + 1}${i === c.target ? ' ・ 🚩 もくひょう' : ''}</small>
            <b>${esc(st.title)}</b>
            ${now ? `<span class="gbar"><span style="width:${(pr.got / pr.total) * 100}%"></span></span><small>${pr.got} / ${pr.total} おぼえた・タップで ことばを きく</small>` : done ? `<small>${c.cleared[st.id].slice(5).replace('-', '/')} クリア</small>` : ''}
          </span>
        </button>
      </li>`;
    }).join('');
    render(`
      <section class="screen road">
        <header class="topbar"><button class="icon-btn back" aria-label="もどる">←</button><h2>🗺️ えいかいわロード</h2><span></span></header>
        <div class="card road-goal">
          <div class="road-flag">🏁</div>
          <div><small>ゴール</small><b class="rg-title">えいごで かいわが できる！</b>
            <p>${c.target < STEPS.length - 1 ? `🚩 いまの もくひょう：ステップ${c.target + 1}「${esc(STEPS[c.target].title)}」まで${c.due ? `（${+c.due.slice(5, 7)}/${+c.due.slice(8)} まで）` : ''}` : `🚩 もくひょう：ステップ${STEPS.length}まで ぜんぶ${c.due ? `（${+c.due.slice(5, 7)}/${+c.due.slice(8)} まで）` : ''}`}
            ${pace ? `<br>このペースだと <b>${pace.eta.getMonth() + 1}/${pace.eta.getDate()}</b> ごろ とうちゃく${c.due ? (pace.late ? ' ⏳' : ' 👍') : ''}` : '<br>🎉 もくひょう たっせい！'}</p>
          </div>
        </div>
        <ol class="road-list">${rows}</ol>
      </section>`, 'road');
    on('.back', 'click', showDash);
    on('.road-btn', 'click', (e) => { SFX.tap(); showStep(+e.currentTarget.dataset.i); });
    const nowEl = $('.road-step.now'); if (nowEl) nowEl.scrollIntoView({ block: 'center' });
  }

  // ステップの ことばリスト（きいて れんしゅう）
  function showStep(si) {
    const p = cur(); if (!p) return showHome();
    const st = STEPS[si];
    const units = Questions.unitsOf(si);
    const row = (u) => {
      const n = p.conv.m[u.key] || 0;
      return `<li class="phrase">
        <button class="say-btn2" data-t="${esc(u.en)}" aria-label="きく">🔊</button>
        <span class="ph-e">${u.e || ''}</span>
        <span class="ph-txt">${u.kind === 't' ? `<span class="en xs q">${esc(u.q)}</span>` : ''}<b class="en">${esc(u.en)}</b><small>${esc(u.ja)}</small></span>
        <span class="ph-m" title="せいかい ${n}かい">${n >= MASTER ? '⭐' : '☆'.repeat(Math.max(0, MASTER - n)) + '★'.repeat(n)}</span>
      </li>`;
    };
    render(`
      <section class="screen stepscr">
        <header class="topbar"><button class="icon-btn back" aria-label="もどる">←</button><h2>ステップ ${si + 1}</h2><span></span></header>
        <div class="card step-head">
          <div class="step-ico">${st.icon}</div>
          <div><b>${esc(st.title)}</b><p>${esc(st.cando)}</p></div>
        </div>
        <div class="card"><h3>つかう ことば</h3><ul class="phrases">${units.filter((u) => u.kind === 'i').map(row).join('')}</ul></div>
        <div class="card"><h3>やりとり（しつもん → こたえ）</h3><ul class="phrases">${units.filter((u) => u.kind === 't').map(row).join('')}</ul></div>
      </section>`, 'step');
    on('.back', 'click', showRoad);
    on('.say-btn2', 'click', (e) => {
      const b = e.currentTarget;
      const u = units.find((x) => x.en === b.dataset.t);
      speak(u && u.kind === 't' ? [{ text: u.q, lang: 'en' }, { text: u.en, lang: 'en' }] : [{ text: b.dataset.t, lang: 'en' }]);
    });
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
    let combo = 0, sessionXP = 0, sessionSec = 0;
    dailyLevelUp(p);
    // 最近 出した問題（10ぷん）＋ 一度 正解した問題（ずっと）は 出さない
    const seen = (p.seenQ = p.seenQ || {});
    for (const k in seen) if (Date.now() - seen[k] >= NO_REPEAT_MS) delete seen[k];
    const solved = (p.solved = p.solved || {});
    const seenAt = (k) => solved[k] || (seen[k] && Date.now() - seen[k] < NO_REPEAT_MS ? seen[k] : 0);
    // まちがいノート（正解するまで 次の日も 出る）
    const notes = (p.mistakes = p.mistakes || []);
    // クエスト
    const QN = p.grade <= 2 ? 8 : 10;
    let quest = null;
    if (typeof p.xp !== 'number') p.xp = 0;
    let timeUp = rewardable && d.lessonSec >= target;

    keepAwake(true);
    render(`
      <section class="screen study">
        <header class="study-bar">
          <button class="icon-btn quit" aria-label="やすむ">✕</button>
          <div class="tbar"><div class="tfill"></div><span class="tlabel"></span></div>
          <span class="sstars">✨<b>0</b></span>
        </header>
        <div class="questbar"><span class="qb-title"></span><div class="qb-dots"></div></div>
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
        tlabel.textContent = timeUp ? 'この クエストで レッスン クリア！' : `レッスン${lessonsOf(d) + 1} のこり ${fmt(target - d.lessonSec)}`;
      }
      $('.sstars b').textContent = sessionXP;
    }

    const SUBJ_LABEL = { en: '🔤 えいご', conv: '🗣️ かいわ', math: '🔢 さんすう' };
    function updateQuestBar() {
      if (!quest) return;
      const L = levels(p);
      $('.qb-title').innerHTML = quest.phase === 'review'
        ? `🔁 まちがえた もんだいを もういちど！ <small>のこり ${quest.review.length + 1}</small>`
        : `⚔️ クエスト ${quest.no}・${SUBJ_LABEL[quest.subj]} ${quest.subj === 'conv' ? `ステップ${goals(p).conv.si + 1}` : `Lv.${L[quest.subj]}`}`;
      $('.qb-dots').innerHTML = Array.from({ length: QN }, (_, i) => `<i class="${i < quest.res.length ? (quest.res[i] ? 'ok' : 'ng') : i === quest.res.length && quest.phase === 'main' ? 'now' : ''}"></i>`).join('');
    }

    function startQuest() {
      goals(p);
      const useEn = Math.random() < p.enRatio;
      const convOk = STEPS[p.conv.si] && !p.conv.cleared[STEPS[STEPS.length - 1].id];
      const subj = !useEn ? 'math' : convOk && Math.random() < CONV_SHARE ? 'conv' : 'en';
      d.questNo = (d.questNo || 0) + 1;
      quest = { no: d.questNo, subj, res: [], review: [], tries: {}, phase: 'main', xp: 0 };
    }

    // クエストの 教科で 1もん つくる
    function makeQ(subj) {
      // まちがいノートから ときどき（正解するまで 出る）
      const noteIdx = notes.findIndex((n) => n.subj === subj && !(seen[n.q.key] && Date.now() - seen[n.q.key] < NO_REPEAT_MS));
      if (noteIdx >= 0 && Math.random() < 0.3) { const x = reshuffle(notes[noteIdx].q); x.retry = true; x.fromNote = true; return x; }
      if (subj === 'conv') {
        const si = p.conv.si > 0 && Math.random() < 0.2 ? Math.floor(Math.random() * p.conv.si) : Math.min(p.conv.si, STEPS.length - 1);
        const cq = Questions.nextConv({ g: p.grade, si, mastery: p.conv.m, seenAt });
        if (cq) return cq;
        subj = 'en';
      }
      const gl = pickGradeLv(p, subj, false);
      const x = Questions.next({ g: gl.g, lvEn: gl.lv, lvMath: gl.lv, enRatio: subj === 'en' ? 1 : 0, seenAt, mathFocus: p.mathGoal.done || gl.g !== p.grade ? -1 : p.mathGoal.unit });
      if (gl.g > p.grade) x.challenge = true;
      return x;
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
      if (!quest) startQuest();
      if (quest.phase === 'review') { q = quest.review.shift(); q.retry = true; }
      else q = makeQ(quest.subj);
      seen[q.key] = Date.now();
      answered = false; input = '';
      updateQuestBar();
      drawQ();
    }

    function drawQ() {
      const listen = q.listen;
      const choicesHTML = q.type === 'input'
        ? `<div class="answer-box"><span class="ans-val">&nbsp;</span></div>
           <div class="keypad">${['7', '8', '9', '4', '5', '6', '1', '2', '3', '0', '.', 'del'].map((k) => `<button class="key" data-k="${k}">${k === 'del' ? '⌫' : k}</button>`).join('')}
           <button class="key ok" data-k="ok">こたえる</button></div>`
        : q.type === 'speak'
        ? `<div class="speak-box">
             <button class="btn big primary mic">${SR ? '🎤 いってみる' : '🗣️ こえに だして いってみよう'}</button>
             <p class="heard" aria-live="polite">${SR ? 'ボタンを おして、えいごで いってね' : 'きこえた とおりに まねして いってね'}</p>
             <div class="speak-btns">
               <button class="btn said ${SR ? 'hidden' : ''}">⭕ いえた！</button>
               <button class="btn ghost skip">つぎへ</button>
             </div>
           </div>`
        : `<div class="choices c${q.cols || q.choices.length}">${q.choices.map((c, i) => `<button class="choice" data-i="${i}">${c.html}${c.say ? '<span class="say-mini" role="button" aria-label="きく">🔊</span>' : ''}</button>`).join('')}</div>`;
      qwrap.innerHTML = `
        <div class="qcard ${q.subj}">
          <div class="qtag">${q.subj === 'en' ? '🔤 えいご' : '🔢 さんすう'}・${q.kind}${q.retry ? ' <span class="pill">もういちど</span>' : ''}${q.challenge ? ' <span class="pill up">⬆ チャレンジ</span>' : ''}</div>
          ${listen ? `<button class="listen-btn" aria-label="もういちど きく">🔊<small>きく</small></button>` : ''}
          <div class="prompt">${q.prompt}</div>
          ${q.visual ? `<div class="visual">${q.visual}</div>` : ''}
          ${!listen && q.say ? `<button class="say-btn" aria-label="よみあげ">🔊</button>` : ''}
        </div>
        <div class="answers ${q.type === 'input' ? 'is-input' : ''}">${choicesHTML}</div>
        <div class="feedback hidden"></div>`;
      qwrap.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', (e) => {
        act();
        const c = q.choices[+b.dataset.i];
        if (e.target.closest('.say-mini')) { speak([c.say]); return; }
        if (!answered) answer(c.value, b);
      }));
      if (q.type === 'speak') setupSpeak();
      if (quest.phase === 'review') qwrap.querySelector('.qcard').classList.add('review');
      qwrap.querySelectorAll('.key').forEach((b) => b.addEventListener('click', () => { act(); press(b.dataset.k); }));
      const lb = qwrap.querySelector('.listen-btn, .say-btn');
      if (lb) lb.addEventListener('click', () => { act(); speak(q.say); });
      if (q.say && (listen || p.grade <= 3 || q.subj === 'en')) setTimeout(() => speak(q.say), 250);
      else if (p.grade <= 2) speak([{ text: q.prompt.replace(/<[^>]+>/g, ''), lang: 'ja' }]);
    }

    function setupSpeak() {
      const heard = qwrap.querySelector('.heard'), mic = qwrap.querySelector('.mic'), said = qwrap.querySelector('.said');
      let tries = 0;
      mic.addEventListener('click', () => {
        act();
        if (!SR) { speak(q.say); return; }
        mic.disabled = true; mic.textContent = '👂 きいているよ…';
        hearSpeech((alts) => {
          mic.disabled = false; mic.textContent = '🎤 もういちど';
          tries++;
          if (alts === null) { heard.textContent = 'マイクが つかえないので、まねして いえたら「いえた！」を おしてね'; said.classList.remove('hidden'); return; }
          const sc = alts.length ? speechScore(q.speakText, alts) : 0;
          if (sc >= 0.6) { heard.innerHTML = `きこえたよ：<b>${esc(alts[0])}</b>`; answer(q.answer, null); return; }
          heard.innerHTML = alts.length ? `きこえたのは「${esc(alts[0])}」。もういちど いってみよう！` : 'きこえなかったよ。もういちど！';
          if (tries >= 2) said.classList.remove('hidden');
        });
      });
      said.addEventListener('click', () => { act(); if (!answered) answer(q.answer, null); });
      qwrap.querySelector('.skip').addEventListener('click', () => { act(); if (!answered) { answered = true; if (quest.phase === 'review') afterAnswer(); else nextQ(); } });
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
      let goalMsg = null;
      if (ok) goalMsg = advanceGoals(p, q, d);
      // 教科ごとの きろく
      if (q.subj === 'en') { d.qe = (d.qe || 0) + 1; if (ok) d.ce = (d.ce || 0) + 1; }
      else { d.qm = (d.qm || 0) + 1; if (ok) d.cm = (d.cm || 0) + 1; }
      // 正解した問題は もう出さない／まちがえた問題は ノートへ
      const ni = notes.findIndex((n) => n.q.key === q.key);
      if (ok) {
        solved[q.key] = Date.now();
        if (ni >= 0) notes.splice(ni, 1);
        const gain = 10 + (q.challenge ? 5 : 0);
        quest.xp += gain; sessionXP += gain;
      } else if (ni < 0) {
        notes.push({ q: reshuffle(q), subj: quest.subj === 'conv' && q.conv ? 'conv' : q.subj, at: Date.now() });
        if (notes.length > 60) notes.shift();
      }
      if (Object.keys(solved).length > 3000) {
        Object.entries(solved).sort((x, y) => x[1] - y[1]).slice(0, 800).forEach(([k]) => delete solved[k]);
      }
      if (quest.phase === 'main') {
        quest.res.push(ok);
        if (!ok) quest.review.push(reshuffle(q));
      } else if (!ok) {
        // ふくしゅうで また まちがえたら、もう1かいだけ
        quest.tries[q.key] = (quest.tries[q.key] || 0) + 1;
        if (quest.tries[q.key] < 2) quest.review.push(reshuffle(q));
      }

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
        combo += 1; p.stars += 1;
        SFX.ok();
        fb.className = 'feedback good';
        fb.innerHTML = `<span class="mark">⭕</span><span>${praise(combo)}</span>`;
        if (q.reveal) setTimeout(() => speak(q.reveal), 150);
        save(); updateBar();
        if (goalMsg) setTimeout(() => goalCelebrate(goalMsg, afterAnswer), 900);
        else setTimeout(afterAnswer, q.reveal ? 1400 : 900);
      } else {
        combo = 0;
        SFX.ng();
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
      updateQuestBar();
      if (quest.phase === 'main' && quest.res.length < QN) return nextQ();
      if (quest.review.length) { quest.phase = 'review'; return nextQ(); }
      endQuest();
    }

    function endQuest() {
      const L = levels(p);
      const good = quest.res.filter(Boolean).length, miss = QN - good;
      const stars = miss === 0 ? 3 : miss <= 2 ? 2 : 1;
      let lvMsg = '';
      if (quest.subj !== 'conv' && L.auto) {
        const k = quest.subj, before = L[k];
        if (good >= Math.ceil(QN * 0.8)) L[k] = Math.min(maxLevel(p), L[k] + 1);
        else if (good <= Math.floor(QN * 0.4)) L[k] = Math.max(1, L[k] - 1);
        if (L[k] > before) lvMsg = `⬆️ ${SUBJ_LABEL[k]} Lv.${before} → <b>Lv.${L[k]}</b> レベルアップ！`;
        else if (L[k] < before) lvMsg = `${SUBJ_LABEL[k]}は Lv.${L[k]} で もういちど じっくり`;
        else if (L[k] >= maxLevel(p)) lvMsg = `${SUBJ_LABEL[k]} Lv.${L[k]}（さいこう レベル）`;
      }
      const bonus = stars * 20;
      const plBefore = playerLevel(p.xp);
      p.xp += quest.xp + bonus; sessionXP += bonus;
      const plAfter = playerLevel(p.xp);
      (d.quests = d.quests || []).push({ s: quest.subj, st: stars });
      dailyLevelUp(p);
      save(); updateBar();
      const doneLesson = rewardable && d.lessonSec >= target;
      if (stars === 3) SFX.fanfare(); else SFX.ok();
      speak([{ text: stars === 3 ? 'Perfect!' : stars === 2 ? 'Great job!' : 'Good try!', lang: 'en' }]);
      const ov = document.createElement('div');
      ov.className = 'overlay quest-ov';
      ov.innerHTML = `<div class="ov-card quest-card">
        <small>クエスト ${quest.no} クリア！</small>
        <div class="q-stars">${'<span class="on">★</span>'.repeat(stars)}${'<span>★</span>'.repeat(3 - stars)}</div>
        <p class="q-score">${good} / ${QN} せいかい</p>
        <p class="q-xp">✨ +${quest.xp + bonus} XP</p>
        ${lvMsg ? `<p class="q-lv">${lvMsg}</p>` : ''}
        ${plAfter > plBefore ? `<p class="q-pl">🏆 プレイヤー Lv.${plAfter} に なった！</p>` : ''}
        <button class="btn big primary q-next">${doneLesson ? '🎉 レッスン クリア！' : '⚔️ つぎの クエスト'}</button>
        ${doneLesson ? '' : '<button class="btn ghost q-stop">きょうは ここまで</button>'}
      </div>`;
      app.appendChild(ov);
      ov.querySelector('.q-next').addEventListener('click', () => { act(); ov.remove(); quest = null; if (doneLesson) finish(); else nextQ(); });
      const st = ov.querySelector('.q-stop'); if (st) st.addEventListener('click', () => { ov.remove(); save(); showDash(); });
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

  // 正解したら 目標を すすめる。クリアしたら おいわいの ないようを かえす
  function advanceGoals(p, q, d) {
    goals(p);
    let msg = null;
    if (q.conv) {
      const c = p.conv;
      c.m[q.conv] = (c.m[q.conv] || 0) + 1;
      const si = c.si;
      if (q.step === si && STEPS[si] && !c.cleared[STEPS[si].id]) {
        const pr = stepProgress(p, si);
        if (pr.got >= pr.total) {
          c.cleared[STEPS[si].id] = dkey();
          if (si < STEPS.length - 1) c.si = si + 1;
          msg = { icon: STEPS[si].icon, title: `ステップ${si + 1} クリア！`, body: `「${STEPS[si].title}」ように なったね！`, next: si < STEPS.length - 1 ? `つぎは ステップ${si + 2}「${STEPS[si + 1].title}」` : '🏆 えいかいわロード ぜんぶ クリア！', say: 'Great job! You did it!' };
          if (window.trackConversion) window.trackConversion('app_action_complete', { action: 'conv_step_clear', step: si + 1 });
        }
      }
    }
    const mg = p.mathGoal;
    if (q.subj === 'math' && mg.unit >= 0 && !mg.done && q.unit === mg.unit) {
      mg.count += 1;
      if (mg.count >= mg.target) {
        mg.done = dkey();
        const name = Questions.mathUnits(p.grade)[mg.unit] || '';
        msg = msg || { icon: '🧮', title: 'さんすうの もくひょう たっせい！', body: `「${name}」を ${mg.target}もん せいかい！`, next: 'おうちの人に つぎの もくひょうを きめて もらおう', say: 'Excellent!' };
      }
    }
    return msg;
  }

  function goalCelebrate(m, then) {
    SFX.fanfare();
    speak([{ text: m.say, lang: 'en' }]);
    const ov = document.createElement('div');
    ov.className = 'overlay goal-ov';
    ov.innerHTML = `<div class="ov-card goal-card">
      <div class="ov-emoji">${m.icon}🏅</div>
      <h2>${esc(m.title)}</h2>
      <p>${esc(m.body)}</p>
      <p class="goal-next">${esc(m.next)}</p>
      <button class="btn big primary">つづける</button>
    </div>`;
    ov.querySelector('button').addEventListener('click', () => { ov.remove(); then(); });
    app.appendChild(ov);
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
  function pinGate(next, back) {
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
      if (k === 'back') return back ? back() : S.current ? showDash() : showHome();
      if (k === 'del') v = v.slice(0, -1); else if (v.length < 4) v += k;
      dots();
      if (v.length === 4) {
        if (v === S.settings.pin) next();
        else { $('.pin-dots').classList.add('shake'); setTimeout(() => { v = ''; dots(); $('.pin-dots').classList.remove('shake'); }, 500); }
      }
    });
  }

  let parentBack = null;
  function showParent(back) {
    if (typeof back === 'function') parentBack = back;
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
            <li><b>⚔️ クエスト制：</b>10問で1クエスト。8割以上正解するとその場でレベルアップ、星とXPがもらえてプレイヤーレベルが上がります。英語・算数のレベルは1〜15（レベル7からは上の学年の問題にチャレンジ）。<b>一度正解した問題は二度と出ず、まちがえた問題だけ</b>クエストの最後と次の日以降に正解するまで出ます。</li>
            <li><b>🎯 目標：</b>英語は「英語で会話ができる」をゴールにした15ステップの「えいかいわロード」で進みます（あいさつ → 気持ち → 名前 → 好きなもの … → 自己紹介スピーチ）。聞き取り・受け答え・穴うめ・並べかえに加え、マイクで<b>声に出して言う練習</b>もあります。目標のステップと期限、算数で重点的にやる単元は、お子さまの「せってい」で決められます。</li>
            <li>タイマーは <b>問題に取り組んでいる間だけ</b> 進みます（${IDLE_LIMIT}秒操作がないと自動で止まります）。途中でやめても続きから再開できます。</li>
            <li><b>レッスン1回（標準10分）をクリアするごとに、ゲームタイム10分</b>がもらえます。2回やれば20分、3回で30分と貯まります。時間はお子さまごとに変えられます（1日の上限回数はお子さまごとの設定で変更できます）。</li>
            <li>ゲームタイムは「スタート／ストップ」で使った分だけ減ります。残り5分・1分でお知らせ、0分でアラームが鳴ります。その日のうちに使い切りです。</li>
            <li>正解率に合わせて「かんたん」「ふつう」の難しさが自動で切り替わります。<b>同じ問題は10分間は出ません</b>（まちがえた問題は10分後にもう一度出ます）。</li>
            <li>ホーム画面に追加すると、アプリのように全画面で使えます（iPhone/iPad：共有ボタン →「ホーム画面に追加」）。</li>
          </ol>
        </div>
      </section>`, 'parent');

    on('.back', 'click', () => (parentBack || (S.current ? showDash : showHome))());
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
          S = migrate(s); save(); alert('復元しました'); showParent();
        } catch (err) { alert('復元できませんでした：' + err.message); }
      });
    });
    on('.wipe', 'click', () => {
      if (confirm('すべてのお子さまの記録を削除します。よろしいですか？') && confirm('本当に削除しますか？（元に戻せません）')) {
        localStorage.removeItem(STORE_KEY); S = load(); showHome();
      }
    });
  }

  function levelFormHTML(p, opts) {
    const L = levels(p);
    const lvOpts = LEVELS.slice(1, maxLevel(p) + 1).map((x, i) => [i + 1, `Lv.${i + 1}：${x.ja}`]);
    return `<fieldset class="goal-set">
      <legend>📈 難しさ（レベル）</legend>
      <label class="switch-row"><input type="checkbox" name="lvAuto" ${L.auto ? 'checked' : ''}> クエストの結果で自動で上げ下げする</label>
      <p class="hint">10問（年少〜年長は8問）で1クエスト。8割以上正解でその場でレベル+1、4割以下で−1。レベル7からは上の学年の問題が混ざり、Lv15は上の学年の問題だけになります（小6はLv6まで）。一度正解した問題は出さず、まちがえた問題だけクエストの最後と次の日以降にもう一度出ます。</p>
      <div class="two">
        <label>英語のレベル<select name="lvEn">${opts(lvOpts, L.en)}</select></label>
        <label>算数のレベル<select name="lvMath">${opts(lvOpts, L.math)}</select></label>
      </div>
      <p class="hint">英語のレベルは単語・数・文法などの問題に使います（えいかいわロードはステップで進みます）。</p>
    </fieldset>`;
  }

  function goalFormHTML(p, opts) {
    const c = p.conv, mg = p.mathGoal;
    const stepOpts = STEPS.map((st, i) => [i, `ステップ${i + 1}：${st.title}`]);
    const units = Questions.mathUnits(p.grade);
    return `<fieldset class="goal-set">
      <legend>🎯 目標</legend>
      <p class="hint">英語は「英語で会話ができる」ことをゴールに、あいさつ → 気持ち → 自己紹介 → 好きなもの … → 自己紹介スピーチ まで15ステップで進みます。ステップ内の表現・やりとりを全部${MASTER}回ずつ正解すると次のステップに進みます。</p>
      <label>英会話：いまのステップ
        <select name="convSi">${opts(stepOpts, c.si)}</select>
      </label>
      <div class="two">
        <label>英会話：目標のステップ
          <select name="convTarget">${opts(stepOpts, c.target)}</select>
        </label>
        <label>いつまでに（任意）
          <input type="date" name="convDue" value="${esc(c.due || '')}">
        </label>
      </div>
      <div class="two">
        <label>算数：重点的にやる単元
          <select name="mathUnit">${opts([[-1, 'おまかせ（バランスよく）']].concat(units.map((u, i) => [i, u])), mg.unit)}</select>
        </label>
        <label>目標の正解数
          <select name="mathTarget">${opts([[20, '20問'], [30, '30問'], [50, '50問'], [100, '100問']], mg.target)}</select>
        </label>
      </div>
      <p class="hint">算数の単元を選ぶと、算数の問題の約6割がその単元から出ます。${mg.unit >= 0 ? `いま：${mg.count}/${mg.target}問${mg.done ? '（達成済み）' : ''}` : ''}</p>
    </fieldset>`;
  }

  function showProfileForm(id, first, after) {
    const p = id ? S.profiles.find((x) => x.id === id) : null;
    const v = p || { name: '', grade: 3, avatar: AVATARS[S.profiles.length % AVATARS.length], studyMin: 10, gameMin: 10, enRatio: 0.7, maxLessons: 0 };
    const opts = (arr, sel) => arr.map(([val, label]) => `<option value="${val}" ${String(val) === String(sel) ? 'selected' : ''}>${label}</option>`).join('');
    const mins = [10, 15, 20, 25, 30, 35, 40, 45, 50, 60].map((m) => [m, m + '分']);
    const d = p ? p.days[dkey()] : null;
    render(`
      <section class="screen pform">
        ${first ? `<h1 class="logo">まいにち<b>30</b>ぷん</h1>
          <p class="lead">英語を中心に算数もまぜて、10分のレッスンをがんばるたびに<br>10分のゲームタイムがもらえるアプリです。</p>
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
          ${p ? levelFormHTML(p, opts) : ''}
          ${p ? goalFormHTML(goals(p), opts) : '<p class="hint">🎯 英会話・算数の目標は、登録したあとに設定できます（最初は学年に合わせて自動で決まります）。</p>'}
          <button class="btn big primary" type="submit">${p ? '保存' : '登録する'}</button>
        </form>
        ${p ? `<div class="card">
          <h3>きょうの調整</h3>
          <p class="hint">きょう：${Math.floor((d ? d.sec : 0) / 60)}分・レッスン${lessonsOf(d)}回${d && d.cleared ? `・ゲーム残り ${fmt(gameRemaining(d))}` : ''}</p>
          <button class="btn sm grant">レッスン1回分をクリア扱い（+ゲーム${p ? p.gameMin : 10}分）</button>
          <button class="btn sm add10">ゲーム時間 +10分</button>
          <button class="btn sm ghost reset-today">きょうの記録をリセット</button>
          <hr>
          <button class="btn sm danger del">このお子さまを削除</button>
        </div>` : ''}
      </section>`, 'pform');

    on('.back', 'click', after || showParent);
    on('.form', 'submit', (e) => {
      e.preventDefault();
      const f = new FormData(e.target);
      const name = String(f.get('name') || '').trim();
      if (!name) return;
      const t = p || newProfile(name, 0, '🐶');
      const gradeChanged = !!p && p.grade !== +f.get('grade');
      t.name = name;
      t.grade = +f.get('grade');
      t.avatar = f.get('avatar') || t.avatar;
      t.studyMin = +f.get('studyMin');
      t.gameMin = +f.get('gameMin');
      t.enRatio = +f.get('enRatio');
      t.maxLessons = +f.get('maxLessons');
      if (p) {
        const L = levels(t);
        L.auto = !!f.get('lvAuto');
        L.en = Math.min(+f.get('lvEn'), maxLevel(t)); L.math = Math.min(+f.get('lvMath'), maxLevel(t));
        const td = today(t); td.lvE = L.en; td.lvM = L.math; delete td.lvChange;
        goals(t);
        const c = t.conv, si = +f.get('convSi');
        if (si !== c.si) { c.si = si; for (const st of STEPS.slice(si)) delete c.cleared[st.id]; }
        c.target = Math.max(+f.get('convTarget'), c.si);
        c.due = String(f.get('convDue') || '');
        const unit = +f.get('mathUnit'), target = +f.get('mathTarget');
        const mg = t.mathGoal;
        if (unit !== mg.unit || gradeChanged) { mg.unit = gradeChanged ? -1 : unit; mg.count = 0; mg.done = ''; }
        mg.target = target;
      } else goals(t);
      if (!p) { S.profiles.push(t); S.current = t.id; }
      save();
      if (first) showHome(); else (after || showParent)();
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

  function levelReportHTML(p) {
    const L = levels(p);
    const days = [];
    for (let i = 13; i >= 0; i--) { const k = dkey(addDays(new Date(), -i)); if (p.days[k] && p.days[k].lvE != null) days.push([k, p.days[k]]); }
    const first = days[0] ? days[0][1] : null;
    const acc = (d, q, c) => (d[q] ? `${Math.round(((d[c] || 0) / d[q]) * 100)}%` : '−');
    return `<div class="card">
      <h3>📈 レベル（${L.auto ? 'クエストで自動調整' : '固定'}）</h3>
      <p>英語 <b>Lv.${L.en}</b>（${LEVELS[L.en].ja}）${first ? `　最近14日で ${first.lvE}→${L.en}` : ''}<br>
      算数 <b>Lv.${L.math}</b>（${LEVELS[L.math].ja}）${first ? `　最近14日で ${first.lvM}→${L.math}` : ''}</p>
      ${days.length ? `<div class="lv-table-wrap"><table class="kt lv-table"><tr><th>日</th><th>英語Lv</th><th>正解率</th><th>算数Lv</th><th>正解率</th></tr>
        ${days.map(([k, d]) => `<tr><td>${+k.slice(5, 7)}/${+k.slice(8)}</td><td>${d.lvE}</td><td>${acc(d, 'qe', 'ce')}</td><td>${d.lvM}</td><td>${acc(d, 'qm', 'cm')}</td></tr>`).join('')}</table></div>` : ''}
      <p>🏆 プレイヤー Lv.${playerLevel(p.xp || 0)}（${p.xp || 0} XP）・ 📒 まちがいノート ${(p.mistakes || []).length}問 ・ ✅ 正解ずみ（もう出さない）${Object.keys(p.solved || {}).length}問</p>
    </div>`;
  }

  function goalReportHTML(p) {
    const c = p.conv, pace = convPace(p), mg = p.mathGoal, units = Questions.mathUnits(p.grade);
    const pr = STEPS[c.si] ? stepProgress(p, c.si) : { got: 0, total: 1 };
    return `<div class="card">
      <h3>🎯 目標の進み具合</h3>
      <p><b>英会話：ステップ${c.si + 1}「${esc(STEPS[c.si].title)}」</b>（${pr.got}/${pr.total} 習得）<br>
      <small>${esc(STEPS[c.si].cando)}</small><br>
      目標：ステップ${c.target + 1}${c.due ? `（${c.due} まで）` : ''}${pace ? ` ・ このペースだと ${dkey(pace.eta)} ごろ到達${c.due ? (pace.late ? '（期限に間に合わない見込み）' : '（期限内の見込み）') : ''}` : ' ・ 達成！'}</p>
      <ul class="cleared-list">${STEPS.map((st, i) => (c.cleared[st.id] ? `<li>✅ ステップ${i + 1} ${esc(st.title)} <small>${c.cleared[st.id]}</small></li>` : '')).join('') || '<li><small>まだクリアしたステップはありません</small></li>'}</ul>
      <p><b>算数：</b>${mg.unit >= 0 && units[mg.unit] ? `${esc(units[mg.unit])} ${mg.count}/${mg.target}問${mg.done ? `（${mg.done} 達成）` : ''}` : 'おまかせ（単元の指定なし）'}</p>
    </div>`;
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
        ${levelReportHTML(p)}
        ${goalReportHTML(goals(p))}
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
  // さいしょは いつも アカウントを えらぶ 画面から
  showHome();
})();
