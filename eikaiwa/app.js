/* =========================================================
   えいかいわコース
   - ステップは ../study/js/conversation.js の CONV_STEPS（年少〜中3 の 45ステップ）
   - だれが やるかは まなびポイント（KidsPoints）の 子どもを つかう（いりぐちで えらんだ子）
   - 1つの ひょうげん・やりとりを 2回 せいかいすると「おぼえた」。ぜんぶ おぼえたら つぎの ステップへ
   - せいかい 1もん = 5ポイント（KidsPoints.answers。じかんには かんけいなし）
   ========================================================= */
(function () {
  'use strict';
  const STEPS = window.CONV_STEPS || [];
  const START = window.CONV_START || [0, 0, 0, 0, 0, 1, 3, 5, 7, 15, 25, 35];
  const KP = window.KidsPoints || null;
  const KEY = 'eikaiwa:v1';
  const MASTER = 2;          // 2回 せいかいで おぼえた
  const QN = 10;             // 1レッスンの もんだい数
  const HUB = 'https://yusandonatural.github.io/idea-/kids/';
  const GRADES = ['年少', '年中', '年長', '小1', '小2', '小3', '小4', '小5', '小6', '中1', '中2', '中3'];
  // ステップの まとまり（g = 目安の学年 0〜10）
  const BANDS = [
    { name: 'はじめての えいご', sub: 'ようじ〜小学校', test: (g) => g <= 7, color: '#38a169' },
    { name: '中学1年', sub: 'じこしょうかい・ふだんの こと', test: (g) => g === 8, color: '#3182ce' },
    { name: '中学2年', sub: 'よてい・くらべる・いけん', test: (g) => g === 9, color: '#805ad5' },
    { name: '中学3年', sub: 'けいけん・せつめい・はなしあい', test: (g) => g >= 10, color: '#d53f8c' },
  ];
  const bandOf = (st) => BANDS.findIndex((b) => b.test(st.g));

  // ---------- ほぞん ----------
  let S;
  try { S = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { S = {}; }
  S.kids = S.kids || {};
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* なし */ } }

  // ---------- だれ？ ----------
  const LOCAL = { id: 'local', name: 'わたし', icon: '🙂' };
  function kids() { return KP ? KP.kids() : [LOCAL]; }
  function picked() {
    if (!KP) return LOCAL;
    try {
      const id = sessionStorage.getItem('kids-hub:picked');
      const k = id && KP.kids().find((x) => x.id === id);
      return k || null;
    } catch (e) { return null; }
  }
  function choose(k) {
    if (KP) { KP.setCurrent(k.id); try { sessionStorage.setItem('kids-hub:picked', k.id); } catch (e) { /* なし */ } }
    me = k;
    route();
  }
  let me = picked();
  const prog = () => S.kids[me.id];

  // ---------- べんり ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const app = $('#app');
  function render(html) { app.innerHTML = html; window.scrollTo(0, 0); }
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  // ---------- おと ----------
  let voice = null;
  function pickVoice() {
    if (!window.speechSynthesis) return;
    const vs = speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang));
    voice = vs.find((v) => /Samantha|Google US|Jenny|Aria/i.test(v.name)) || vs.find((v) => /en[-_]US/i.test(v.lang)) || vs[0] || null;
  }
  if (window.speechSynthesis) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  function say(text, slow) {
    if (!window.speechSynthesis) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US'; if (voice) u.voice = voice;
    u.rate = slow ? 0.7 : 0.9;
    speechSynthesis.speak(u);
  }
  let actx = null;
  function tone(ok) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [660, 880] : [300, 220];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = f; o.connect(g); g.connect(actx.destination);
        const t = actx.currentTime + i * 0.12;
        g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
        o.start(t); o.stop(t + 0.2);
      });
    } catch (e) { /* なし */ }
  }
  const REC = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  // ---------- ひょうげんの カギ ----------
  // 1つの ステップの 中の おぼえるもの：items（ひょうげん）と talk（やりとり）
  function unitsOf(si) {
    const st = STEPS[si];
    return st.items.map((it, i) => ({ key: `${st.id}:i${i}`, si, kind: 'item', it }))
      .concat((st.talk || []).map((t, i) => ({ key: `${st.id}:t${i}`, si, kind: 'talk', t })));
  }
  function stepProgress(si) {
    const us = unitsOf(si), m = prog().m;
    const got = us.filter((u) => (m[u.key] || 0) >= MASTER).length;
    return { got, total: us.length };
  }

  // ---------- 画面：だれ？ ----------
  function showWho() {
    const ks = kids();
    render(`
      <section class="screen who">
        <a class="hub" href="${HUB}">🎒 アプリを えらぶ</a>
        <h1 class="logo">えいかいわ<b>コース</b></h1>
        <p class="lead">だれが べんきょう する？</p>
        <div class="kids">
          ${ks.map((k) => {
            const p = S.kids[k.id];
            const st = p ? STEPS[Math.min(p.si, STEPS.length - 1)] : null;
            return `<button class="kid" data-id="${esc(k.id)}"><span class="av">${esc(k.icon)}</span><b>${esc(k.name)}</b>
              <small>${st ? `ステップ ${Math.min(p.si, STEPS.length - 1) + 1} / ${STEPS.length}` : 'はじめて'}</small></button>`;
          }).join('')}
        </div>
        ${KP ? `<form class="addkid"><input name="n" maxlength="20" placeholder="なまえを いれて ついか" required><button>ついか</button></form>` : ''}
      </section>`);
    $$('.kid').forEach((b) => b.onclick = () => choose(ks.find((k) => k.id === b.dataset.id)));
    const f = $('.addkid');
    if (f) f.onsubmit = (e) => { e.preventDefault(); const n = f.n.value.trim(); if (n) choose(KP.addKid(n)); };
  }

  // ---------- 画面：はじめての がくねん ----------
  function showGrade() {
    render(`
      <section class="screen grade">
        <h1>${esc(me.icon)} ${esc(me.name)}さん、ようこそ！</h1>
        <p class="lead">いまの がくねんは？<br><small>ちょうど いい ステップから はじめます。まえの ステップも いつでも れんしゅう できるよ。</small></p>
        <div class="grades">${GRADES.map((g, i) => `<button class="gbtn" data-g="${i}">${g}</button>`).join('')}</div>
      </section>`);
    $$('.gbtn').forEach((b) => b.onclick = () => {
      const g = +b.dataset.g;
      S.kids[me.id] = { grade: g, si: START[g] || 0, m: {}, cleared: {}, xp: 0, days: {}, start: START[g] || 0 };
      save(); showMap();
    });
  }

  // ---------- 画面：ロード（ステップの いちらん） ----------
  function header() {
    const bal = KP ? KP.balance(me.id) : null;
    return `<header class="top">
      <button class="me">${esc(me.icon)} <b>${esc(me.name)}</b><small>きりかえ</small></button>
      <span class="pts">${bal != null ? `⭐ ${bal} <small>🎮 ${Math.floor(Math.max(0, bal) / 10)}ぷん</small>` : ''}</span>
      <a class="hub icon" href="${HUB}" aria-label="アプリを えらぶ がめんへ">🎒</a>
    </header>`;
  }
  function bindHeader() {
    const b = $('.top .me');
    if (b) b.onclick = () => { try { sessionStorage.removeItem('kids-hub:picked'); } catch (e) { /* なし */ } me = null; route(); };
  }
  function showMap() {
    const p = prog();
    const done = Object.keys(p.cleared).length;
    let html = header() + `<section class="screen map">
      <div class="goal card">
        <div class="goal-ic">${STEPS[Math.min(p.si, STEPS.length - 1)].icon}</div>
        <div>
          <small>いまの ステップ ${Math.min(p.si, STEPS.length - 1) + 1} / ${STEPS.length}</small>
          <h2>${esc(STEPS[Math.min(p.si, STEPS.length - 1)].title)}</h2>
          <div class="bar"><i style="width:${Math.round(Math.min(p.si, STEPS.length) / STEPS.length * 100)}%"></i></div>
          <small>中3まで ${Math.round(Math.min(p.si, STEPS.length) / STEPS.length * 100)}% ・ クリア ${done}</small>
        </div>
        <button class="btn primary go-now">▶ つづける</button>
      </div>`;
    BANDS.forEach((b, bi) => {
      const idx = STEPS.map((s, i) => i).filter((i) => bandOf(STEPS[i]) === bi);
      if (!idx.length) return;
      html += `<h3 class="band" style="--c:${b.color}">${b.name}<small>${b.sub}</small></h3><div class="steps">`;
      idx.forEach((i) => {
        const st = STEPS[i], pr = stepProgress(i);
        const cleared = !!p.cleared[st.id], locked = i > p.si, curr = i === p.si;
        html += `<button class="step ${cleared ? 'done' : ''} ${locked ? 'locked' : ''} ${curr ? 'curr' : ''}" data-si="${i}" style="--c:${b.color}" ${locked ? 'aria-disabled="true"' : ''}>
          <span class="no">${i + 1}</span><span class="ic">${locked ? '🔒' : st.icon}</span>
          <span class="tt"><b>${esc(st.title)}</b><small>${cleared ? '✅ クリア' : locked ? 'まだ ひらいていないよ' : `おぼえた ${pr.got} / ${pr.total}`}</small></span>
        </button>`;
      });
      html += '</div>';
    });
    html += `<p class="note">ステップの もんだいを 2回ずつ せいかいすると クリア。つぎの ステップが ひらくよ。<br>せいかい 1もん = ⭐5ポイント（⭐10ポイントで 🎮 ゲーム 1ぷん）</p></section>`;
    render(html);
    bindHeader();
    $('.go-now').onclick = () => showStep(Math.min(p.si, STEPS.length - 1));
    $$('.step').forEach((b) => b.onclick = () => { if (b.classList.contains('locked')) { tone(false); return; } showStep(+b.dataset.si); });
    const c = $('.step.curr'); if (c) c.scrollIntoView({ block: 'center' });
  }

  // ---------- 画面：ステップ ----------
  function showStep(si) {
    const st = STEPS[si], pr = stepProgress(si), m = prog().m;
    render(header() + `<section class="screen stepscr">
      <button class="back">← ロードに もどる</button>
      <div class="stephead card">
        <span class="big-ic">${st.icon}</span>
        <div><small>ステップ ${si + 1}</small><h2>${esc(st.title)}</h2><p class="cando">${esc(st.cando)}</p>
          <div class="bar"><i style="width:${Math.round(pr.got / pr.total * 100)}%"></i></div><small>おぼえた ${pr.got} / ${pr.total}</small></div>
      </div>
      <button class="btn primary big go-lesson">▶ レッスン スタート（${QN}もん）</button>
      <button class="btn big ghost go-talk">💬 かいわ れんしゅう</button>
      <h3>🔊 きいて まねしよう</h3>
      <ul class="phrases">
        ${st.items.map((it, i) => `<li><button class="sp" data-en="${esc(it.en)}" aria-label="きく">🔊</button><span class="e">${it.e || ''}</span>
          <span class="t"><b>${esc(it.en)}</b><small>${esc(it.ja)}</small></span><span class="mk">${(m[`${st.id}:i${i}`] || 0) >= MASTER ? '⭐' : ''}</span></li>`).join('')}
      </ul>
      <h3>💬 やりとり</h3>
      <ul class="phrases talk">
        ${(st.talk || []).map((t, i) => `<li><button class="sp" data-en="${esc(t.q + ' ' + t.a)}" aria-label="きく">🔊</button><span class="e">${t.e || ''}</span>
          <span class="t"><b>Q: ${esc(t.q)}</b><small>${esc(t.qja)}</small><b>A: ${esc(t.a)}</b><small>${esc(t.aja)}</small></span><span class="mk">${(m[`${st.id}:t${i}`] || 0) >= MASTER ? '⭐' : ''}</span></li>`).join('')}
      </ul>
    </section>`);
    bindHeader();
    $('.back').onclick = showMap;
    $('.go-lesson').onclick = () => startLesson(si);
    $('.go-talk').onclick = () => showTalk(si, 0);
    $$('.sp').forEach((b) => b.onclick = () => say(b.dataset.en));
  }

  // ---------- もんだい づくり ----------
  // まわりの ステップの ひょうげん（まちがいの せんたくし用）
  function pool(si, kind) {
    const out = [];
    for (let d = 0; d <= 3 && out.length < 12; d++) {
      [si - d, si + d].forEach((j) => {
        if (j < 0 || j >= STEPS.length || (d === 0 && j !== si) || (d > 0 && out.includes(j))) return;
        out.push(j);
      });
    }
    const uniq = [...new Set(out)];
    return uniq.flatMap((j) => kind === 'talk' ? (STEPS[j].talk || []) : STEPS[j].items);
  }
  function choicesFrom(right, cands, n = 4) {
    const seen = new Set([right]);
    const out = [right];
    shuffle(cands).forEach((c) => { if (out.length < n && !seen.has(c)) { seen.add(c); out.push(c); } });
    return shuffle(out);
  }
  const words = (en) => en.replace(/[.!?]+$/, '').split(/\s+/);
  function makeQ(u) {
    const kinds = [];
    if (u.kind === 'item') {
      kinds.push('listen', 'toEn');
      if (u.it.b) kinds.push('blank');
      if (words(u.it.en).length >= 3 && words(u.it.en).length <= 11) kinds.push('order');
      if (REC) kinds.push('speak');
    } else {
      kinds.push('reply', 'reply');
      if (words(u.t.a).length >= 3 && words(u.t.a).length <= 11) kinds.push('orderA');
      if (REC) kinds.push('speakA');
    }
    const k = pick(kinds);
    const it = u.it, t = u.t;
    if (k === 'listen') return { u, k, en: it.en, prompt: 'きこえた えいごは どんな いみ？', audio: it.en, right: it.ja, opts: choicesFrom(it.ja, pool(u.si).map((x) => x.ja)) };
    if (k === 'toEn') return { u, k, prompt: `「${it.ja}」は えいごで？`, pic: it.e, right: it.en, opts: choicesFrom(it.en, pool(u.si).map((x) => x.en)), en: it.en };
    if (k === 'blank') {
      const re = new RegExp(`\\b${it.b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
      const others = pool(u.si).map((x) => x.b).filter(Boolean);
      return { u, k, prompt: `あてはまる ことばは？<small>${esc(it.ja)}</small>`, sentence: it.en.replace(re, '＿＿＿'), right: it.b, opts: choicesFrom(it.b, others), en: it.en };
    }
    if (k === 'order') return { u, k, prompt: `ならべて 「${it.ja}」`, tiles: shuffle(words(it.en)), right: words(it.en).join(' '), en: it.en };
    if (k === 'speak') return { u, k, prompt: `えいごで いってみよう<small>${esc(it.ja)}</small>`, right: it.en, en: it.en, pic: it.e };
    if (k === 'reply') return { u, k, prompt: 'なんて こたえる？', q: t.q, qja: t.qja, audio: t.q, right: t.a, opts: choicesFrom(t.a, pool(u.si, 'talk').map((x) => x.a)), en: t.a };
    if (k === 'orderA') return { u, k, prompt: `こたえを ならべよう<small>${esc(t.aja)}</small>`, q: t.q, audio: t.q, tiles: shuffle(words(t.a)), right: words(t.a).join(' '), en: t.a };
    return { u, k: 'speak', prompt: `こたえを えいごで いってみよう<small>${esc(t.aja)}</small>`, q: t.q, audio: t.q, right: t.a, en: t.a };
  }
  function buildLesson(si) {
    const p = prog();
    const us = unitsOf(si);
    // まだ おぼえていない ものを 先に。足りなければ おぼえた もので ふくしゅう
    const todo = shuffle(us.filter((u) => (p.m[u.key] || 0) < MASTER));
    const doneU = shuffle(us.filter((u) => (p.m[u.key] || 0) >= MASTER));
    let list = todo.concat(todo).slice(0, QN - 2);
    // まえの ステップの ふくしゅうを 2もん
    const prev = [];
    for (let j = si - 1; j >= Math.max(0, si - 4); j--) prev.push(...unitsOf(j));
    list = list.concat(shuffle(prev).slice(0, 2));
    while (list.length < QN) list.push(pick(doneU.length ? doneU : us));
    // 同じ ものが つづかないように
    list = shuffle(list);
    for (let i = 1; i < list.length; i++) if (list[i].key === list[i - 1].key) { const j = (i + 2) % list.length; [list[i], list[j]] = [list[j], list[i]]; }
    return list.map(makeQ);
  }

  // ---------- 画面：レッスン ----------
  function startLesson(si) {
    const qs = buildLesson(si);
    const L = { si, qs, i: 0, good: 0, skip: 0, retry: new Set() };
    nextQ(L);
  }
  function nextQ(L) {
    if (L.i >= L.qs.length) return endLesson(L);
    const q = L.qs[L.i];
    let body = '';
    if (q.q) body += `<div class="bubble"><button class="sp big" aria-label="きく">🔊</button><span><b>${esc(q.q)}</b>${q.qja ? `<small>${esc(q.qja)}</small>` : ''}</span></div>`;
    if (q.k === 'listen') body += `<button class="listen sp" aria-label="もういちど きく">🔊<small>タップで もういちど</small></button>`;
    if (q.pic && q.k !== 'speak') body += `<div class="pic">${q.pic}</div>`;
    if (q.sentence) body += `<p class="sentence">${esc(q.sentence)}</p>`;
    if (q.opts) body += `<div class="opts">${q.opts.map((o) => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    if (q.tiles) body += `<div class="answer" aria-label="こたえ"></div><div class="tiles">${q.tiles.map((w, i) => `<button class="tile" data-i="${i}">${esc(w)}</button>`).join('')}</div><button class="btn primary check" disabled>こたえあわせ</button>`;
    if (q.k === 'speak') body += `${q.pic ? `<div class="pic">${q.pic}</div>` : ''}<button class="mic">🎤<small>おして はなす</small></button><p class="heard"></p>
      <div class="row"><button class="link hint">こたえを きく</button><button class="link skip">いまは はなせない</button></div>`;
    render(`<section class="screen lesson">
      <div class="lbar"><button class="quit" aria-label="やめる">✕</button><div class="bar"><i style="width:${L.i / L.qs.length * 100}%"></i></div><span>${L.i + 1}/${L.qs.length}</span></div>
      <h2 class="prompt">${q.prompt}</h2>
      ${body}
      <div class="fb"></div>
    </section>`);
    $('.quit').onclick = () => showStep(L.si);
    if (q.audio) { setTimeout(() => say(q.audio), 250); $$('.sp').forEach((b) => b.onclick = () => say(q.audio)); }
    let answered = false;
    const finish = (ok, shown) => {
      if (answered) return; answered = true;
      tone(ok);
      const m = prog().m;
      if (ok) { L.good++; if (!L.retry.has(q.u.key)) m[q.u.key] = (m[q.u.key] || 0) + 1; prog().xp += 10; if (KPA) KPA.correct(); }
      else if (!L.retry.has(q.u.key)) { L.retry.add(q.u.key); L.qs.push(makeQ(q.u)); } // まちがえたら さいごに もういちど
      save();
      const fb = $('.fb');
      fb.className = 'fb show ' + (ok ? 'ok' : 'ng');
      fb.innerHTML = `<div><b>${ok ? pick(['せいかい！', 'すごい！', 'Great!', 'Nice!']) : 'おしい！'}</b>
        <p class="ans"><button class="sp2" aria-label="きく">🔊</button> ${esc(shown || q.en)}</p></div><button class="btn primary next">つぎへ ▶</button>`;
      say(q.en);
      $('.sp2').onclick = () => say(q.en);
      $('.next').onclick = () => { L.i++; nextQ(L); };
    };
    if (q.opts) $$('.opt').forEach((b) => b.onclick = () => {
      const ok = b.dataset.v === q.right;
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) $$('.opt').forEach((x) => { if (x.dataset.v === q.right) x.classList.add('right'); });
      $$('.opt').forEach((x) => x.disabled = true);
      finish(ok, q.k === 'listen' ? `${q.en}（${q.right}）` : q.en);
    });
    if (q.tiles) {
      const ans = $('.answer'), chk = $('.check');
      const placed = [];
      const draw = () => { ans.innerHTML = placed.map((i, n) => `<button class="tile in" data-n="${n}">${esc(q.tiles[i])}</button>`).join(''); chk.disabled = placed.length !== q.tiles.length;
        $$('.tile.in').forEach((b) => b.onclick = () => { const i = placed.splice(+b.dataset.n, 1)[0]; $(`.tiles .tile[data-i="${i}"]`).classList.remove('used'); draw(); }); };
      $$('.tiles .tile').forEach((b) => b.onclick = () => { if (b.classList.contains('used')) return; b.classList.add('used'); placed.push(+b.dataset.i); draw(); });
      chk.onclick = () => { const got = placed.map((i) => q.tiles[i]).join(' '); chk.disabled = true; $$('.tile').forEach((x) => x.disabled = true); finish(got.toLowerCase() === q.right.toLowerCase(), q.en); };
    }
    if (q.k === 'speak') {
      $('.hint').onclick = () => say(q.right, true);
      $('.skip').onclick = () => { answered = true; L.skip++; L.i++; nextQ(L); }; // マイクが つかえない ときは とばす（まちがいに しない）
      $('.mic').onclick = () => {
        if (!REC) return;
        const r = new REC(); r.lang = 'en-US'; r.interimResults = false; r.maxAlternatives = 3;
        $('.mic').classList.add('on'); $('.heard').textContent = 'きいているよ…';
        r.onresult = (e) => {
          const alts = [...e.results[0]].map((a) => a.transcript);
          $('.heard').textContent = `「${alts[0]}」`;
          finish(alts.some((a) => similar(a, q.right) >= 0.7), q.en);
        };
        r.onerror = () => { $('.heard').textContent = 'うまく きこえなかったよ。もういちど おしてね'; };
        r.onend = () => $('.mic') && $('.mic').classList.remove('on');
        try { r.start(); } catch (e) { /* なし */ }
      };
    }
  }
  // いった ことばと こたえの にている わりあい（たんごの 一致）
  function similar(a, b) {
    const n = (s) => s.toLowerCase().replace(/[^a-z0-9' ]/g, ' ').split(/\s+/).filter(Boolean);
    const A = n(a), B = n(b);
    if (!B.length) return 0;
    let hit = 0; const pool2 = A.slice();
    B.forEach((w) => { const j = pool2.indexOf(w); if (j >= 0) { hit++; pool2.splice(j, 1); } });
    return hit / B.length;
  }
  function endLesson(L) {
    const p = prog(), si = L.si, st = STEPS[si];
    const pr = stepProgress(si);
    p.days[today()] = (p.days[today()] || 0) + 1;
    let msg = '';
    if (pr.got >= pr.total && !p.cleared[st.id]) {
      p.cleared[st.id] = today();
      if (si === p.si && p.si < STEPS.length) p.si = si + 1;
      msg = si + 1 < STEPS.length
        ? `<div class="clear">🎉 ステップ${si + 1}「${esc(st.title)}」クリア！<br><small>つぎは ステップ${si + 2}「${esc(STEPS[si + 1].title)}」</small></div>`
        : '<div class="clear">🏆 中3まで ぜんぶ クリア！ えいごで かいわが できるね！</div>';
    }
    save();
    if (KPA) KPA.flush();
    const total = L.qs.length - L.skip;
    render(`<section class="screen result">
      <div class="big-ic">${L.good >= total * 0.8 ? '🌟' : '👍'}</div>
      <h2>レッスン おわり！</h2>
      <p class="score">${L.good} / ${total} せいかい</p>
      ${msg}
      <p>ステップ${si + 1} おぼえた ${pr.got} / ${pr.total}</p>
      <button class="btn primary big again">${msg && si + 1 < STEPS.length ? '▶ つぎの ステップへ' : '▶ もう1かい'}</button>
      <button class="btn big ghost tomap">ロードに もどる</button>
    </section>`);
    // クリアしたら つぎの ステップへ。まだなら 同じ ステップを もう1かい
    $('.again').onclick = () => startLesson(msg && si + 1 < STEPS.length ? si + 1 : si);
    $('.tomap').onclick = showMap;
  }

  // ---------- 画面：かいわ れんしゅう（ロールプレイ） ----------
  function showTalk(si, ti) {
    const st = STEPS[si], talks = st.talk || [];
    if (!talks.length) return showStep(si);
    const t = talks[ti % talks.length];
    const opts = choicesFrom(t.a, pool(si, 'talk').map((x) => x.a), 3);
    render(header() + `<section class="screen talkscr">
      <button class="back">← ステップに もどる</button>
      <h2>💬 かいわ れんしゅう <small>${ti % talks.length + 1} / ${talks.length}</small></h2>
      <div class="chat">
        <div class="msg them"><span class="who">🧑‍🏫</span><div><b>${esc(t.q)}</b><small>${esc(t.qja)}</small></div><button class="sp" aria-label="きく">🔊</button></div>
        <div class="msg you pending"><div>？</div><span class="who">${esc(me.icon)}</span></div>
      </div>
      <p class="lead">あなたの へんじは？ えらんで こえに だして いってみよう</p>
      <div class="opts">${opts.map((o) => `<button class="opt" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>
      <div class="row"><button class="btn ghost nexttalk" hidden>つぎの かいわ ▶</button></div>
    </section>`);
    bindHeader();
    $('.back').onclick = () => showStep(si);
    $('.sp').onclick = () => say(t.q);
    setTimeout(() => say(t.q), 250);
    $$('.opt').forEach((b) => b.onclick = () => {
      const ok = b.dataset.v === t.a;
      tone(ok);
      b.classList.add(ok ? 'right' : 'wrong');
      if (!ok) return;
      $$('.opt').forEach((x) => x.disabled = true);
      const you = $('.msg.you');
      you.classList.remove('pending');
      you.querySelector('div').innerHTML = `<b>${esc(t.a)}</b><small>${esc(t.aja)}</small>`;
      say(t.a);
      $('.nexttalk').hidden = false;
      $('.nexttalk').onclick = () => showTalk(si, ti + 1);
    });
  }

  // ---------- じゅんばん ----------
  function route() {
    if (!me) return showWho();
    if (!S.kids[me.id]) return showGrade();
    showMap();
  }

  // せいかい 1もん = 5ポイント（まなびの いりぐち と 共通）
  const KPA = KP && KP.answers ? KP.answers('eikaiwa', { label: 'えいかいわ せいかい' }) : null;
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
  route();
})();
