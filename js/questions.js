/* =========================================================
   もんだい の じどう さくせい
   学年 g: 0=年少 1=年中 2=年長 3=小1 4=小2 5=小3 6=小4 7=小5 8=小6
   レベル lv: 1=かんたん 2=ふつう（せいかい率で じどう で かわる）
   ========================================================= */
window.Questions = (function () {
  const D = window.STUDY_DATA;

  // ---------- ユーティリティ ----------
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const round = (x, n = 4) => Math.round(x * 10 ** n) / 10 ** n;

  // 正解 + まちがい を n こ（key が かぶらない）
  function withDistractors(correct, pool, n, key = (x) => x) {
    const seen = new Set([key(correct)]);
    const out = [correct];
    for (const x of shuffle(pool)) {
      if (out.length >= n) break;
      const k = key(x);
      if (!seen.has(k)) { seen.add(k); out.push(x); }
    }
    return shuffle(out);
  }
  // 数の まちがい候補
  function numChoices(ans, n, lo, hi) {
    const pool = [];
    for (let d = -3; d <= 3; d++) if (d && ans + d >= lo && ans + d <= hi) pool.push(ans + d);
    if (pool.length < n - 1) for (let v = lo; v <= hi; v++) if (v !== ans) pool.push(v);
    return withDistractors(ans, pool, n);
  }

  const en = (text) => ({ text, lang: 'en' });
  const ja = (text) => ({ text, lang: 'ja' });
  const nChoices = (g) => (g <= 0 ? 3 : 4);
  const wordsFor = (g, filter) => D.words.filter((w) => w.g <= g && (!filter || filter(w)));
  const emojiRow = (e, k, cls = '') => `<div class="emoji-row ${cls}">${Array.from({ length: k }, () => `<span>${e}</span>`).join('')}</div>`;
  const dots = (k) => `<span class="dots">${'●'.repeat(k)}</span>`;
  const numLabel = (n, g) => (g <= 1 && n <= 10 ? `<b class="big">${n}</b>${dots(n)}` : `<b class="big">${n}</b>`);

  function frac(n, d) {
    const g = gcd(n, d); n /= g; d /= g;
    if (d === 1) return { html: `<b class="big">${n}</b>`, value: `${n}` };
    return { html: `<span class="frac"><span>${n}</span><span>${d}</span></span>`, value: `${n}/${d}` };
  }
  const fracRaw = (n, d) => `<span class="frac"><span>${n}</span><span>${d}</span></span>`;

  function clockSVG(h, m) {
    const ma = (m / 60) * 360, ha = ((h % 12) / 12) * 360 + (m / 60) * 30;
    let ticks = '';
    for (let i = 1; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ticks += `<text x="${50 + Math.sin(a) * 36}" y="${50 - Math.cos(a) * 36 + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">${i}</text>`;
    }
    return `<svg class="clock" viewBox="0 0 100 100" role="img" aria-label="とけい">
      <circle cx="50" cy="50" r="47" fill="var(--card)" stroke="currentColor" stroke-width="3"/>
      ${ticks}
      <line x1="50" y1="50" x2="${50 + Math.sin((ha * Math.PI) / 180) * 22}" y2="${50 - Math.cos((ha * Math.PI) / 180) * 22}" stroke="#e53935" stroke-width="5" stroke-linecap="round"/>
      <line x1="50" y1="50" x2="${50 + Math.sin((ma * Math.PI) / 180) * 32}" y2="${50 - Math.cos((ma * Math.PI) / 180) * 32}" stroke="#1e88e5" stroke-width="3" stroke-linecap="round"/>
      <circle cx="50" cy="50" r="3" fill="currentColor"/></svg>`;
  }

  // ---------- えいご ----------
  const E = {};

  // きいて えを えらぶ
  E.listenPic = ({ g }) => {
    const pool = wordsFor(Math.min(g, 5));
    const t = pick(pool);
    const choices = withDistractors(t, pool, nChoices(g), (w) => w.emoji);
    return {
      subj: 'en', kind: 'きいて えらぶ',
      prompt: 'えいごを きいて、えを えらぼう',
      listen: true, say: [en(t.en)],
      choices: choices.map((w) => ({ html: `<span class="emoji">${w.emoji}</span>`, value: w.en })),
      answer: t.en, reveal: [en(t.en)],
      explain: `${t.emoji} <b>${esc(t.en)}</b> ＝ ${esc(t.ja)}`,
    };
  };

  // きいて いろを えらぶ
  E.listenColor = ({ g }) => {
    const pool = D.colors.filter((c) => c.g <= g);
    const t = pick(pool);
    const choices = withDistractors(t, pool, nChoices(g), (c) => c.en);
    return {
      subj: 'en', kind: 'いろ',
      prompt: 'えいごを きいて、いろを えらぼう',
      listen: true, say: [en(t.en)],
      choices: choices.map((c) => ({ html: `<span class="swatch" style="background:${c.hex}"></span>`, value: c.en })),
      answer: t.en, reveal: [en(t.en)],
      explain: `<span class="swatch sm" style="background:${t.hex}"></span> <b>${t.en}</b> ＝ ${t.ja}`,
    };
  };

  // きいて かたちを えらぶ
  E.listenShape = ({ g }) => {
    const pool = D.shapes.filter((s) => s.g <= g);
    const t = pick(pool);
    const choices = withDistractors(t, pool, nChoices(g), (s) => s.en);
    return {
      subj: 'en', kind: 'かたち',
      prompt: 'えいごを きいて、かたちを えらぼう',
      listen: true, say: [en(t.en)],
      choices: choices.map((s) => ({ html: `<span class="shape">${s.sym}</span>`, value: s.en })),
      answer: t.en, reveal: [en(t.en)],
      explain: `${t.sym} <b>${t.en}</b> ＝ ${t.ja}`,
    };
  };

  // きいて かずを えらぶ
  E.listenNumber = ({ g, lv }) => {
    const max = g <= 0 ? 5 : g <= 2 ? 10 : g <= 3 ? (lv > 1 ? 20 : 12) : 20;
    const n = ri(1, max);
    const choices = numChoices(n, nChoices(g), 1, max);
    return {
      subj: 'en', kind: 'かず（きく）',
      prompt: 'えいごを きいて、かずを えらぼう',
      listen: true, say: [en(D.numberWord(n))],
      choices: choices.map((v) => ({ html: numLabel(v, g), value: String(v) })),
      answer: String(n), reveal: [en(D.numberWord(n))],
      explain: `<b>${D.numberWord(n)}</b> ＝ ${n}`,
    };
  };

  // えを みて How many? （きいて こたえる）
  E.howMany = ({ g }) => {
    const pool = wordsFor(g, (w) => ['animal', 'fruit', 'food'].includes(w.cat));
    const t = pick(pool);
    const n = ri(1, g <= 3 ? 6 : 10);
    const choices = numChoices(n, 4, 1, 10);
    return {
      subj: 'en', kind: 'How many?',
      prompt: `<span class="en">How many?</span> いくつ あるかな？`,
      visual: emojiRow(t.emoji, n),
      say: [en('How many?')],
      choices: choices.map((v) => ({ html: `<span class="en">${D.numberWord(v)}</span>`, value: String(v), say: en(D.numberWord(v)) })),
      answer: String(n), reveal: [en(D.numberWord(n))],
      explain: `${n} ＝ <b>${D.numberWord(n)}</b>`,
    };
  };

  // アルファベットを きいて えらぶ
  E.listenAlpha = ({ g }) => {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const t = pick(L);
    const lower = g >= 4 && Math.random() < 0.5;
    const choices = withDistractors(t, L, 4);
    return {
      subj: 'en', kind: 'アルファベット',
      prompt: `アルファベットを きいて えらぼう${lower ? '（こもじ）' : ''}`,
      listen: true, say: [en(t)],
      choices: choices.map((c) => ({ html: `<span class="letter">${lower ? c.toLowerCase() : c}</span>`, value: c })),
      answer: t, reveal: [en(t)],
      explain: `<b>${t} ${t.toLowerCase()}</b>`,
    };
  };

  // おおもじ ⇔ こもじ
  E.alphaMatch = () => {
    const L = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const confusing = { b: 'dpq', d: 'bpq', p: 'bdq', q: 'bdp', m: 'nw', n: 'mh', u: 'nv', v: 'uw', i: 'jl', j: 'il' };
    const t = pick(L);
    const pool = confusing[t] ? confusing[t].split('').concat(shuffle(L).slice(0, 3)) : L;
    const choices = withDistractors(t, pool, 4);
    return {
      subj: 'en', kind: 'おおもじ・こもじ',
      prompt: `<span class="letter">${t.toUpperCase()}</span> の こもじは どれ？`,
      say: [en(t.toUpperCase())],
      choices: choices.map((c) => ({ html: `<span class="letter">${c}</span>`, value: c })),
      answer: t,
      explain: `<b>${t.toUpperCase()} → ${t}</b>`,
    };
  };

  // アルファベットの じゅんばん
  E.alphaOrder = ({ g }) => {
    const L = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    const lower = g >= 6 && Math.random() < 0.5;
    const s = ri(0, 22);
    const miss = ri(1, 3);
    const seq = L.slice(s, s + 4).map((c, i) => (i === miss ? '<span class="blank">?</span>' : lower ? c.toLowerCase() : c));
    const t = L[s + miss];
    const pool = L.slice(Math.max(0, s - 2), s + 7);
    const choices = withDistractors(t, pool, 4);
    return {
      subj: 'en', kind: 'ABCの じゅんばん',
      prompt: '？に はいる もじは どれ？',
      visual: `<div class="seq letter">${seq.join(' ')}</div>`,
      choices: choices.map((c) => ({ html: `<span class="letter">${lower ? c.toLowerCase() : c}</span>`, value: c })),
      answer: t,
      explain: `${L.slice(s, s + 4).join(' ')}`,
    };
  };

  // え → えいご
  E.picToWord = ({ g }) => {
    const pool = wordsFor(g);
    const t = pick(pool);
    const same = pool.filter((w) => w.cat === t.cat);
    const choices = withDistractors(t, same.length >= 4 ? same : pool, 4, (w) => w.en);
    return {
      subj: 'en', kind: 'え→たんご',
      prompt: 'えいごで なんと いう？',
      visual: `<div class="emoji huge">${t.emoji}</div>`,
      choices: choices.map((w) => ({ html: `<span class="en">${esc(w.en)}</span>`, value: w.en, say: en(w.en) })),
      answer: t.en, reveal: [en(t.en)],
      explain: `${t.emoji} <b>${esc(t.en)}</b> ＝ ${esc(t.ja)}`,
    };
  };

  // えいご → いみ
  E.wordToJa = ({ g }) => {
    const pool = wordsFor(g);
    const t = pick(pool);
    const choices = withDistractors(t, pool, 4, (w) => w.ja);
    return {
      subj: 'en', kind: 'たんごの いみ',
      prompt: `<span class="en big-en">${esc(t.en)}</span><br>の いみは？`,
      say: [en(t.en)],
      choices: choices.map((w) => ({ html: esc(w.ja), value: w.ja })),
      answer: t.ja,
      explain: `${t.emoji} <b>${esc(t.en)}</b> ＝ ${esc(t.ja)}`,
    };
  };

  // いみ → えいご
  E.jaToWord = ({ g }) => {
    const pool = wordsFor(g);
    const t = pick(pool);
    const choices = withDistractors(t, pool, 4, (w) => w.en);
    return {
      subj: 'en', kind: 'いみ→たんご',
      prompt: `「${esc(t.ja)}」は えいごで？`,
      choices: choices.map((w) => ({ html: `<span class="en">${esc(w.en)}</span>`, value: w.en, say: en(w.en) })),
      answer: t.en, reveal: [en(t.en)],
      explain: `${esc(t.ja)} ＝ <b>${esc(t.en)}</b>`,
    };
  };

  // つづり（ぬけている もじ）
  E.spell = ({ g, lv }) => {
    const pool = wordsFor(g, (w) => /^[a-z]{3,8}$/.test(w.en) && (lv > 1 || w.en.length <= 5));
    const t = pick(pool);
    const idx = ri(0, t.en.length - 1);
    const ch = t.en[idx];
    const vowels = 'aeiou'.split('');
    const pool2 = vowels.includes(ch) ? vowels : 'bcdfghklmnprstw'.split('');
    const choices = withDistractors(ch, pool2, 4);
    const shown = t.en.split('').map((c, i) => (i === idx ? '<span class="blank">_</span>' : c)).join('');
    return {
      subj: 'en', kind: 'つづり',
      prompt: 'ぬけている もじは どれ？',
      visual: `<div class="emoji">${t.emoji}</div><div class="seq en">${shown}</div>`,
      say: [en(t.en)],
      choices: choices.map((c) => ({ html: `<span class="letter">${c}</span>`, value: c })),
      answer: ch, reveal: [en(t.en)],
      explain: `<b>${t.en}</b> ＝ ${t.ja}`,
    };
  };

  // いろ → えいご
  E.colorWord = ({ g }) => {
    const pool = D.colors.filter((c) => c.g <= g);
    const t = pick(pool);
    const choices = withDistractors(t, pool, 4, (c) => c.en);
    return {
      subj: 'en', kind: 'いろ',
      prompt: 'この いろは えいごで？',
      visual: `<span class="swatch big" style="background:${t.hex}"></span>`,
      choices: choices.map((c) => ({ html: `<span class="en">${c.en}</span>`, value: c.en, say: en(c.en) })),
      answer: t.en, reveal: [en(t.en)],
      explain: `<b>${t.en}</b> ＝ ${t.ja}`,
    };
  };

  // かずの たんご → すうじ
  E.numberWord = ({ g, lv }) => {
    const max = g <= 4 ? 20 : lv > 1 ? 100 : 50;
    const n = ri(1, max);
    const choices = numChoices(n, 4, 1, max);
    return {
      subj: 'en', kind: 'かずの たんご',
      prompt: `<span class="en big-en">${D.numberWord(n)}</span><br>は どの かず？`,
      say: [en(D.numberWord(n))],
      choices: choices.map((v) => ({ html: `<b class="big">${v}</b>`, value: String(v) })),
      answer: String(n),
      explain: `<b>${D.numberWord(n)}</b> ＝ ${n}`,
    };
  };

  // えいごで けいさん
  E.mathInEnglish = ({ lv }) => {
    const plus = Math.random() < 0.6;
    let a, b, ans;
    if (plus) { a = ri(1, lv > 1 ? 10 : 6); b = ri(1, lv > 1 ? 10 : 6); ans = a + b; }
    else { a = ri(3, lv > 1 ? 20 : 10); b = ri(1, a - 1); ans = a - b; }
    const op = plus ? 'plus' : 'minus';
    const text = `${D.numberWord(a)} ${op} ${D.numberWord(b)} is ...?`;
    const choices = numChoices(ans, 4, 0, 20);
    return {
      subj: 'en', kind: 'えいごで けいさん',
      prompt: `<span class="en">${text}</span>`,
      say: [en(text.replace(' ...?', ' what?'))],
      choices: choices.map((v) => ({ html: `<span class="en">${D.numberWord(v)}</span>`, value: String(v), say: en(D.numberWord(v)) })),
      answer: String(ans), reveal: [en(D.numberWord(ans))],
      explain: `${a} ${plus ? '+' : '−'} ${b} = ${ans} → <b>${D.numberWord(ans)}</b>（plus＝たす、minus＝ひく）`,
    };
  };

  // あいさつ
  E.greeting = ({ g }) => {
    const pool = D.greetings.filter((x) => x.g <= g);
    const t = pick(pool);
    const choices = withDistractors(t, pool, 4, (x) => x.ja);
    return {
      subj: 'en', kind: 'あいさつ',
      prompt: `<span class="en">${esc(t.en)}</span><br>の いみは？`,
      say: [en(t.en)],
      choices: choices.map((x) => ({ html: esc(x.ja), value: x.ja })),
      answer: t.ja,
      explain: `<b>${esc(t.en)}</b> ＝ ${t.ja}`,
    };
  };

  // ようび
  E.days = ({ g, lv }) => {
    const i = ri(0, 6);
    if (g >= 6 && lv > 1 && Math.random() < 0.5) {
      const nxt = D.days[(i + 1) % 7];
      const choices = withDistractors(nxt, D.days, 4, (x) => x.en);
      const text = `What day comes after ${D.days[i].en}?`;
      return {
        subj: 'en', kind: 'ようび',
        prompt: `<span class="en">${text}</span>`,
        say: [en(text)],
        choices: choices.map((x) => ({ html: `<span class="en">${x.en}</span>`, value: x.en, say: en(x.en) })),
        answer: nxt.en, reveal: [en(nxt.en)],
        explain: `${D.days[i].en}（${D.days[i].ja}）の つぎは <b>${nxt.en}</b>（${nxt.ja}）`,
      };
    }
    const t = D.days[i];
    const choices = withDistractors(t, D.days, 4, (x) => x.en);
    return {
      subj: 'en', kind: 'ようび',
      prompt: `「${t.ja}」は えいごで？`,
      choices: choices.map((x) => ({ html: `<span class="en">${x.en}</span>`, value: x.en, say: en(x.en) })),
      answer: t.en, reveal: [en(t.en)],
      explain: `${t.ja} ＝ <b>${t.en}</b>`,
    };
  };

  // つき
  E.months = () => {
    const i = ri(0, 11);
    const t = D.months[i];
    const choices = withDistractors(t, D.months, 4);
    return {
      subj: 'en', kind: 'つき',
      prompt: `「${i + 1}がつ」は えいごで？`,
      choices: choices.map((x) => ({ html: `<span class="en">${x}</span>`, value: x, say: en(x) })),
      answer: t, reveal: [en(t)],
      explain: `${i + 1}がつ ＝ <b>${t}</b>`,
    };
  };

  // じゅんばん
  E.ordinals = () => {
    const i = ri(0, 11);
    const t = D.ordinals[i];
    const choices = withDistractors(t, D.ordinals, 4);
    return {
      subj: 'en', kind: 'じゅんばん',
      prompt: `「${i + 1}ばんめ」は えいごで？`,
      choices: choices.map((x) => ({ html: `<span class="en">${x}</span>`, value: x, say: en(x) })),
      answer: t, reveal: [en(t)],
      explain: `${i + 1}ばんめ ＝ <b>${t}</b>（たんじょうびの 日にちにも つかうよ）`,
    };
  };

  // しつもんに こたえる
  E.qa = ({ g }) => {
    const pool = D.qa.filter((x) => x.g <= g);
    const t = pick(pool);
    const choices = withDistractors(t, D.qa, 4, (x) => x.a);
    return {
      subj: 'en', kind: 'かいわ',
      prompt: `<span class="en">${esc(t.q)}</span><br>の こたえに なるのは？`,
      say: [en(t.q)],
      choices: choices.map((x) => ({ html: `<span class="en sm">${esc(x.a)}</span>`, value: x.a, say: en(x.a) })),
      answer: t.a, reveal: [en(t.a)],
      explain: `<b>${esc(t.q)}</b><br>→ ${esc(t.a)}`,
    };
  };

  // ぶんの いみ
  E.sentence = ({ g }) => {
    const pool = D.sentences.filter((x) => x.g <= g);
    const t = pick(pool);
    const choices = withDistractors(t, D.sentences, 4, (x) => x.ja);
    return {
      subj: 'en', kind: 'ぶんの いみ',
      prompt: `<span class="en">${esc(t.en)}</span><br>の いみは？`,
      say: [en(t.en)],
      choices: choices.map((x) => ({ html: `<span class="sm">${esc(x.ja)}</span>`, value: x.ja })),
      answer: t.ja,
      explain: `<b>${esc(t.en)}</b><br>${esc(t.ja)}`,
    };
  };

  // かこけい
  E.past = () => {
    const t = pick(D.past);
    const [base, pst] = t;
    const wrong = [base, base + 'ed', base + 's', base + 'ing', pick(D.past)[1], pick(D.past)[1]].filter((x) => x !== pst);
    const choices = withDistractors(pst, wrong, 4);
    return {
      subj: 'en', kind: 'かこの いいかた',
      prompt: `<span class="en">${base}</span> の かこけい（〜した）は？`,
      say: [en(base)],
      choices: choices.map((x) => ({ html: `<span class="en">${x}</span>`, value: x, say: en(x) })),
      answer: pst, reveal: [en(`${base}, ${pst}`)],
      explain: `<b>${base} → ${pst}</b>`,
    };
  };

  // ただしい ならびかえ
  E.wordOrder = ({ g }) => {
    const pool = D.sentences.filter((x) => x.g <= g && !/'/.test(x.en));
    const t = pick(pool);
    const mark = t.en.slice(-1);
    const raw = t.en.slice(0, -1).split(' ');
    // 文頭いがいでも 大文字のままの 語（I・国名など）
    const keepCap = (w, i) => w === 'I' || (i > 0 && /^[A-Z]/.test(w)) || raw.slice(1).includes(w);
    const tokens = raw.map((w, i) => (i === 0 && !keepCap(w, 0) ? w.toLowerCase() : w));
    const build = (arr) => { const a = arr.slice(); a[0] = a[0][0].toUpperCase() + a[0].slice(1); return a.join(' ') + mark; };
    const wrongs = new Set();
    for (let guard = 0; wrongs.size < 3 && guard < 60; guard++) {
      const cand = build(shuffle(tokens));
      if (cand !== t.en) wrongs.add(cand);
    }
    const choices = shuffle([t.en, ...wrongs]);
    return {
      subj: 'en', kind: 'ならびかえ',
      prompt: `「${esc(t.ja)}」<br>ただしい えいごは どれ？`,
      choices: choices.map((x) => ({ html: `<span class="en sm">${esc(x)}</span>`, value: x })),
      answer: t.en, reveal: [en(t.en)],
      explain: `<b>${esc(t.en)}</b>`,
    };
  };

  // とけい（えいご）
  E.clock = ({ lv }) => {
    const h = ri(1, 12);
    const m = lv > 1 ? pick([0, 15, 30, 45]) : pick([0, 30]);
    const mw = (mm) => (mm === 0 ? '' : mm === 15 ? 'fifteen' : mm === 30 ? 'thirty' : 'forty-five');
    const say2 = (hh, mm) => (mm === 0 ? `It's ${D.numberWord(hh)} o'clock.` : `It's ${D.numberWord(hh)} ${mw(mm)}.`);
    const correct = say2(h, m);
    const pool = [];
    for (let k = 0; k < 10; k++) { const hh = ri(1, 12); const mm = pick([0, 15, 30, 45]); pool.push(say2(hh, mm)); }
    pool.push(say2(h % 12 + 1, m), say2(h, (m + 30) % 60));
    const choices = withDistractors(correct, pool, 4);
    return {
      subj: 'en', kind: 'とけい（えいご）',
      prompt: '<span class="en">What time is it?</span>',
      visual: clockSVG(h, m),
      say: [en('What time is it?')],
      choices: choices.map((x) => ({ html: `<span class="en sm">${x}</span>`, value: x, say: en(x) })),
      answer: correct, reveal: [en(correct)],
      explain: `${h}じ${m ? m + 'ふん' : ''} → <b>${correct}</b>`,
    };
  };

  // くに
  E.country = () => {
    const t = pick(D.countries);
    const choices = withDistractors(t, D.countries, 4, (x) => x.en);
    const s = `I want to go to ${t.en}.`;
    return {
      subj: 'en', kind: 'くに',
      prompt: `「${t.ja}に 行きたい」は えいごで？`,
      choices: choices.map((x) => ({ html: `<span class="en sm">I want to go to ${x.en}.</span>`, value: x.en })),
      answer: t.en, reveal: [en(s)],
      explain: `<b>${s}</b><br>${t.ja}に 行きたいです。`,
    };
  };

  // きょうか
  E.subjects = () => {
    const t = pick(D.subjects);
    const choices = withDistractors(t, D.subjects, 4, (x) => x.en);
    return {
      subj: 'en', kind: 'きょうか',
      prompt: `「${t.ja}」は えいごで？`,
      choices: choices.map((x) => ({ html: `<span class="en">${x.en}</span>`, value: x.en, say: en(x.en) })),
      answer: t.en, reveal: [en(t.en)],
      explain: `${t.ja} ＝ <b>${t.en}</b>`,
    };
  };

  // ---------- さんすう ----------
  const M = {};
  const COUNT_EMOJI = ['🍎', '🍓', '🐶', '🐱', '⭐', '🚗', '🌸', '🍌', '🐟', '🎈'];

  M.count = ({ g }) => {
    const max = g <= 0 ? 5 : 10;
    const n = ri(1, max);
    const e = pick(COUNT_EMOJI);
    return {
      subj: 'math', kind: 'かぞえる',
      prompt: 'いくつ あるかな？', say: [ja('いくつ あるかな？')],
      visual: emojiRow(e, n),
      choices: numChoices(n, nChoices(g), 1, max).map((v) => ({ html: numLabel(v, g), value: String(v) })),
      answer: String(n),
      explain: `${e} は <b>${n}</b> こ`,
    };
  };

  M.more = ({ g }) => {
    const max = g <= 0 ? 5 : 9;
    const a = ri(1, max); let b = ri(1, max); while (b === a) b = ri(1, max);
    const e1 = pick(COUNT_EMOJI); let e2 = pick(COUNT_EMOJI); while (e2 === e1) e2 = pick(COUNT_EMOJI);
    const opts = shuffle([{ e: e1, n: a }, { e: e2, n: b }]);
    const win = a > b ? e1 : e2;
    return {
      subj: 'math', kind: 'おおい・すくない',
      prompt: 'おおい のは どっち？', say: [ja('おおい のは どっち？')],
      cols: 1,
      choices: opts.map((o) => ({ html: emojiRow(o.e, o.n, 'sm'), value: o.e })),
      answer: win,
      explain: `${e1} ${a}こ と ${e2} ${b}こ → ${win} が おおい`,
    };
  };

  M.bigger = ({ g }) => {
    const max = g <= 2 ? 20 : 100;
    const a = ri(1, max); let b = ri(1, max); while (b === a) b = ri(1, max);
    return {
      subj: 'math', kind: 'おおきい かず',
      prompt: 'おおきい かずは どっち？', say: [ja('おおきい かずは どっち？')],
      choices: [a, b].map((v) => ({ html: `<b class="big">${v}</b>`, value: String(v) })),
      answer: String(Math.max(a, b)),
      explain: `${Math.max(a, b)} の ほうが おおきい`,
    };
  };

  M.next = ({ g }) => {
    const max = g <= 1 ? 9 : 19;
    const n = ri(1, max);
    return {
      subj: 'math', kind: 'かずの じゅんばん',
      prompt: `<b class="big">${n}</b> の つぎの かずは？`, say: [ja(`${n} の つぎの かずは？`)],
      choices: numChoices(n + 1, nChoices(g), 1, max + 1).map((v) => ({ html: numLabel(v, g), value: String(v) })),
      answer: String(n + 1),
      explain: `${n} → <b>${n + 1}</b>`,
    };
  };

  M.addPic = ({ lv }) => {
    const max = lv > 1 ? 10 : 5;
    const a = ri(1, max - 1), b = ri(1, max - a);
    const e = pick(COUNT_EMOJI);
    return {
      subj: 'math', kind: 'たしざん（え）',
      prompt: `${a} と ${b} で いくつ？`, say: [ja(`${a} と ${b} で いくつ？`)],
      visual: `<div class="pic-eq">${emojiRow(e, a, 'sm')}<b>＋</b>${emojiRow(e, b, 'sm')}</div>`,
      choices: numChoices(a + b, 4, 1, 10).map((v) => ({ html: `<b class="big">${v}</b>`, value: String(v) })),
      answer: String(a + b),
      explain: `${a} ＋ ${b} ＝ <b>${a + b}</b>`,
    };
  };

  M.subPic = ({ lv }) => {
    const a = ri(2, lv > 1 ? 10 : 5), b = ri(1, a - 1);
    const e = pick(COUNT_EMOJI);
    const row = `<div class="emoji-row sm">${Array.from({ length: a }, (_, i) => `<span class="${i >= a - b ? 'gone' : ''}">${e}</span>`).join('')}</div>`;
    return {
      subj: 'math', kind: 'ひきざん（え）',
      prompt: `${a} こ から ${b} こ へると？`, say: [ja(`${a}こ から ${b}こ へると いくつ？`)],
      visual: row,
      choices: numChoices(a - b, 4, 0, 10).map((v) => ({ html: `<b class="big">${v}</b>`, value: String(v) })),
      answer: String(a - b),
      explain: `${a} − ${b} ＝ <b>${a - b}</b>`,
    };
  };

  const inputQ = (kind, text, ans, explain, sayText) => ({
    subj: 'math', kind, type: 'input',
    prompt: `<span class="formula">${text}</span>`,
    say: sayText ? [ja(sayText)] : undefined,
    answer: String(ans), explain,
  });

  M.add20 = ({ lv }) => {
    const a = ri(1, lv > 1 ? 9 : 9), b = lv > 1 ? ri(10 - a, 9) : ri(1, 10 - a);
    return inputQ('たしざん', `${a} ＋ ${b} ＝ ？`, a + b, `${a} ＋ ${b} ＝ <b>${a + b}</b>`);
  };
  M.sub20 = ({ lv }) => {
    const a = lv > 1 ? ri(11, 18) : ri(3, 10); const b = lv > 1 ? ri(a - 9, 9) : ri(1, a - 1);
    return inputQ('ひきざん', `${a} − ${b} ＝ ？`, a - b, `${a} − ${b} ＝ <b>${a - b}</b>`);
  };

  M.clockJa = ({ g, lv }) => {
    const h = ri(1, 12);
    const m = g <= 3 ? (lv > 1 ? pick([0, 30]) : 0) : ri(0, 11) * 5;
    const label = (hh, mm) => (mm === 0 ? `${hh}じ` : mm === 30 && g <= 3 ? `${hh}じはん` : `${hh}じ${mm}ぷん`);
    const pool = [label(h % 12 + 1, m), label(h === 1 ? 12 : h - 1, m), label(h, (m + 30) % 60), label(ri(1, 12), g <= 3 ? 0 : ri(0, 11) * 5), label(h, (m + 5) % 60)];
    const correct = label(h, m);
    return {
      subj: 'math', kind: 'とけい',
      prompt: 'なんじ かな？', say: [ja('なんじ かな？')],
      visual: clockSVG(h, m),
      choices: withDistractors(correct, pool, 4).map((x) => ({ html: x, value: x })),
      answer: correct,
      explain: `みじかい はり（あか）が じ、ながい はり（あお）が ふん → <b>${correct}</b>`,
    };
  };

  M.add2d = ({ lv }) => {
    let a, b;
    if (lv > 1) { a = ri(15, 79); b = ri(12, 99 - a); }
    else { a = ri(10, 60); b = ri(1, 9); if ((a % 10) + b >= 10) b = 9 - (a % 10) || 1; }
    return inputQ('たしざん', `${a} ＋ ${b} ＝ ？`, a + b, `${a} ＋ ${b} ＝ <b>${a + b}</b>`);
  };
  M.sub2d = ({ lv }) => {
    let a, b;
    if (lv > 1) { a = ri(30, 99); b = ri(11, a - 5); }
    else { a = ri(20, 99); b = ri(1, a % 10 || 1); if (b > a % 10) b = a % 10; if (b === 0) b = 10; }
    return inputQ('ひきざん', `${a} − ${b} ＝ ？`, a - b, `${a} − ${b} ＝ <b>${a - b}</b>`);
  };
  M.kuku = ({ lv }) => {
    const a = lv > 1 ? ri(2, 9) : pick([1, 2, 3, 4, 5]); const b = ri(1, 9);
    return inputQ('九九', `${a} × ${b} ＝ ？`, a * b, `${a} × ${b} ＝ <b>${a * b}</b>`);
  };
  M.placeValue = () => {
    const h = ri(1, 9), t = ri(0, 9), o = ri(0, 9);
    return inputQ('大きい かず', `100が${h}こ、10が${t}こ、1が${o}こ で いくつ？`, h * 100 + t * 10 + o, `<b>${h * 100 + t * 10 + o}</b>`);
  };
  M.length = ({ lv }) => {
    const r = ri(0, lv > 1 ? 3 : 1);
    if (r === 0) { const a = ri(1, 9), b = ri(1, 9); return inputQ('ながさ', `${a}cm${b}mm ＝ ？mm`, a * 10 + b, `1cm＝10mm → <b>${a * 10 + b}mm</b>`); }
    if (r === 1) { const a = ri(1, 5); return inputQ('ながさ', `${a}m ＝ ？cm`, a * 100, `1m＝100cm → <b>${a * 100}cm</b>`); }
    if (r === 2) { const a = ri(1, 3), b = ri(5, 95); return inputQ('ながさ', `${a}m${b}cm ＝ ？cm`, a * 100 + b, `<b>${a * 100 + b}cm</b>`); }
    const a = ri(11, 99); return inputQ('ながさ', `${a}mm ＝ ？cm と ${a % 10}mm`, Math.floor(a / 10), `${a}mm ＝ <b>${Math.floor(a / 10)}cm</b>${a % 10}mm`);
  };
  M.div = ({ lv }) => {
    const b = ri(2, 9), q = ri(1, 9);
    if (lv > 1 && Math.random() < 0.5) {
      const r = ri(1, b - 1), a = b * q + r;
      const correct = `${q} あまり ${r}`;
      const pool = [`${q + 1} あまり ${r}`, `${q} あまり ${r + 1}`, `${q - 1 || 1} あまり ${r + b > 9 ? r : r + b}`, `${q} あまり ${Math.max(0, r - 1)}`];
      return {
        subj: 'math', kind: 'あまりの ある わりざん',
        prompt: `<span class="formula">${a} ÷ ${b} ＝ ？</span>`,
        choices: withDistractors(correct, pool, 4).map((x) => ({ html: x, value: x })),
        answer: correct,
        explain: `${b} × ${q} ＝ ${b * q}、${a} − ${b * q} ＝ ${r} → <b>${correct}</b>`,
      };
    }
    return inputQ('わりざん', `${b * q} ÷ ${b} ＝ ？`, q, `${b} × <b>${q}</b> ＝ ${b * q}`);
  };
  M.mul2x1 = ({ lv }) => {
    const a = lv > 1 ? ri(21, 99) : ri(11, 40), b = ri(2, lv > 1 ? 9 : 4);
    return inputQ('かけざん', `${a} × ${b} ＝ ？`, a * b, `${a} × ${b} ＝ <b>${a * b}</b>`);
  };
  M.add3d = ({ lv }) => {
    const plus = Math.random() < 0.5;
    const a = ri(100, lv > 1 ? 899 : 500), b = ri(100, lv > 1 ? 899 : 400);
    if (plus) return inputQ('たしざん', `${a} ＋ ${b} ＝ ？`, a + b, `<b>${a + b}</b>`);
    const [x, y] = a > b ? [a, b] : [b, a];
    return inputQ('ひきざん', `${x} − ${y} ＝ ？`, x - y, `<b>${x - y}</b>`);
  };
  M.time = () => {
    const r = ri(0, 2);
    if (r === 0) { const h = ri(1, 3); return inputQ('じかん', `${h}じかん ＝ ？ふん`, h * 60, `1じかん＝60ぷん → <b>${h * 60}ぷん</b>`); }
    if (r === 1) { const m = ri(61, 119); return inputQ('じかん', `${m}ぷん ＝ 1じかん ？ふん`, m - 60, `${m} − 60 ＝ <b>${m - 60}</b>`); }
    const a = ri(1, 5); return inputQ('じかん', `${a}ふん ＝ ？びょう`, a * 60, `1ぷん＝60びょう → <b>${a * 60}びょう</b>`);
  };
  M.div2 = ({ lv }) => {
    const b = ri(2, 9), q = lv > 1 ? ri(21, 99) : ri(11, 30);
    return inputQ('わりざん', `${b * q} ÷ ${b} ＝ ？`, q, `${b} × ${q} ＝ ${b * q} → <b>${q}</b>`);
  };
  M.mul2x2 = ({ lv }) => {
    const a = ri(11, lv > 1 ? 99 : 30), b = ri(11, lv > 1 ? 49 : 20);
    return inputQ('かけざん', `${a} × ${b} ＝ ？`, a * b, `${a} × ${b} ＝ <b>${a * b}</b>`);
  };
  M.areaRect = ({ lv }) => {
    const sq = Math.random() < 0.3;
    const a = ri(2, lv > 1 ? 25 : 12), b = sq ? a : ri(2, lv > 1 ? 20 : 10);
    return inputQ('めんせき', sq ? `1ぺん ${a}cm の 正方形の めんせきは？（cm²）` : `たて ${a}cm、よこ ${b}cm の 長方形の めんせきは？（cm²）`, a * b, `${a} × ${b} ＝ <b>${a * b}cm²</b>`);
  };
  M.decAdd = ({ lv }) => {
    const a = ri(1, lv > 1 ? 99 : 50) / 10, b = ri(1, lv > 1 ? 99 : 40) / 10;
    if (Math.random() < 0.5) return inputQ('しょうすう', `${a} ＋ ${b} ＝ ？`, round(a + b), `<b>${round(a + b)}</b>`);
    const [x, y] = a >= b ? [a, b] : [b, a];
    return inputQ('しょうすう', `${x} − ${y} ＝ ？`, round(x - y), `<b>${round(x - y)}</b>`);
  };
  M.round = ({ lv }) => {
    const n = lv > 1 ? ri(1000, 9999) : ri(100, 999);
    const unit = lv > 1 ? 100 : 10;
    const ans = Math.round(n / unit) * unit;
    return inputQ('がいすう', `${n} を ${unit === 100 ? '百' : '十'}の位までの がい数に（四捨五入）`, ans, `${unit === 100 ? '十' : '一'}の位を 四捨五入 → <b>${ans}</b>`);
  };
  M.fracSame = ({ lv }) => {
    const d = ri(3, lv > 1 ? 12 : 8);
    const a = ri(1, d - 1), b = ri(1, d - a);
    const plus = lv < 2 || Math.random() < 0.6;
    const n = plus ? a + b : Math.max(a, b) - Math.min(a, b);
    const [x, y] = plus ? [a, b] : [Math.max(a, b), Math.min(a, b)];
    if (!plus && n === 0) return M.fracSame({ lv: 1 });
    const correct = { html: fracRaw(n, d), value: `${n}/${d}` };
    const wrong = [{ html: fracRaw(n, d * 2), value: `${n}/${d * 2}` }, { html: fracRaw(n + 1, d), value: `${n + 1}/${d}` }, { html: fracRaw(Math.max(1, n - 1), d), value: `${Math.max(1, n - 1)}/${d}` }, { html: fracRaw(n, d + 1), value: `${n}/${d + 1}` }];
    return {
      subj: 'math', kind: 'ぶんすう',
      prompt: `<span class="formula">${fracRaw(x, d)} ${plus ? '＋' : '−'} ${fracRaw(y, d)} ＝ ？</span>`,
      choices: withDistractors(correct, wrong, 4, (c) => c.value),
      answer: correct.value,
      explain: `分母は そのまま、分子を ${plus ? 'たす' : 'ひく'} → ${fracRaw(n, d)}`,
    };
  };
  M.decMul = ({ lv }) => {
    const a = ri(11, lv > 1 ? 99 : 49) / 10, b = ri(2, 9);
    if (Math.random() < 0.5) return inputQ('しょうすうの かけざん', `${a} × ${b} ＝ ？`, round(a * b), `${Math.round(a * 10)} × ${b} ＝ ${Math.round(a * 10) * b} → <b>${round(a * b)}</b>`);
    const q = ri(11, 49) / 10; const t = round(q * b);
    return inputQ('しょうすうの わりざん', `${t} ÷ ${b} ＝ ？`, q, `<b>${q}</b>`);
  };
  M.percent = ({ lv }) => {
    const r = ri(0, lv > 1 ? 2 : 1);
    if (r === 0) { const base = pick([100, 200, 300, 400, 500, 800, 1000]); const p = pick([10, 20, 25, 30, 50]); return inputQ('わりあい', `${base}円の ${p}% は なん円？`, (base * p) / 100, `${base} × ${p / 100} ＝ <b>${(base * p) / 100}円</b>`); }
    if (r === 1) { const all = pick([20, 40, 50, 80, 100, 200]); const p = pick([10, 20, 25, 50, 75]); const part = (all * p) / 100; if (part % 1) return M.percent({ lv: 1 }); return inputQ('わりあい', `${all}人中 ${part}人は なん%？`, p, `${part} ÷ ${all} ＝ ${p / 100} → <b>${p}%</b>`); }
    const price = pick([500, 1000, 2000, 1500]); const off = pick([10, 20, 30]); return inputQ('わりあい', `${price}円の ${off}%びき は なん円？`, (price * (100 - off)) / 100, `${price} × ${(100 - off) / 100} ＝ <b>${(price * (100 - off)) / 100}円</b>`);
  };
  M.avg = ({ lv }) => {
    const k = lv > 1 ? 5 : 3; const avg = ri(3, 20);
    const nums = Array.from({ length: k - 1 }, () => avg + ri(-3, 3));
    const last = avg * k - nums.reduce((s, x) => s + x, 0);
    if (last <= 0) return M.avg({ lv });
    nums.push(last);
    return inputQ('へいきん', `${shuffle(nums).join('、')} の へいきんは？`, avg, `ごうけい ${avg * k} ÷ ${k} ＝ <b>${avg}</b>`);
  };
  M.triangle = ({ lv }) => {
    const a = ri(2, lv > 1 ? 20 : 10), h = ri(1, 10) * 2;
    if (lv > 1 && Math.random() < 0.4) return inputQ('めんせき', `ていへん ${a}cm、たかさ ${h / 2 + 3}cm の 平行四辺形の めんせきは？`, a * (h / 2 + 3), `ていへん × たかさ ＝ <b>${a * (h / 2 + 3)}cm²</b>`);
    return inputQ('めんせき', `ていへん ${a}cm、たかさ ${h}cm の 三角形の めんせきは？`, (a * h) / 2, `${a} × ${h} ÷ 2 ＝ <b>${(a * h) / 2}cm²</b>`);
  };
  M.volume = ({ lv }) => {
    const a = ri(2, lv > 1 ? 12 : 6), b = ri(2, lv > 1 ? 10 : 5), c = ri(2, lv > 1 ? 10 : 5);
    return inputQ('たいせき', `たて${a}cm、よこ${b}cm、たかさ${c}cm の 直方体の 体積は？（cm³）`, a * b * c, `${a} × ${b} × ${c} ＝ <b>${a * b * c}cm³</b>`);
  };
  M.fracAdd = ({ lv }) => {
    const ds = lv > 1 ? [2, 3, 4, 5, 6, 8, 10] : [2, 3, 4, 6];
    const d1 = pick(ds); let d2 = pick(ds); while (d2 === d1) d2 = pick(ds);
    const n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1);
    const D2 = (d1 * d2) / gcd(d1, d2);
    const N = n1 * (D2 / d1) + n2 * (D2 / d2);
    const correct = frac(N, D2);
    const wrong = [frac(n1 + n2, d1 + d2), frac(N + 1, D2), frac(n1 * n2, d1 * d2), frac(Math.max(1, N - 1), D2), frac(N, D2 * 2)];
    return {
      subj: 'math', kind: 'ぶんすうの たしざん',
      prompt: `<span class="formula">${fracRaw(n1, d1)} ＋ ${fracRaw(n2, d2)} ＝ ？</span>`,
      choices: withDistractors(correct, wrong, 4, (c) => c.value),
      answer: correct.value,
      explain: `通分して ${fracRaw(n1 * (D2 / d1), D2)} ＋ ${fracRaw(n2 * (D2 / d2), D2)} ＝ ${correct.html}`,
    };
  };
  M.fracMulDiv = () => {
    const mul = Math.random() < 0.5;
    let a, b, c, d;
    do { a = ri(1, 5); b = ri(2, 7); } while (gcd(a, b) !== 1 || a === b);
    do { c = ri(1, 5); d = ri(2, 7); } while (gcd(c, d) !== 1 || c === d);
    const N = mul ? a * c : a * d, Dn = mul ? b * d : b * c;
    const correct = frac(N, Dn);
    const common = [frac(N + 1, Dn), frac(N, Dn + 1), frac(N + 2, Dn), frac(N, Dn + 2), frac(Dn, N)];
    const wrong = (mul ? [frac(a * d, b * c), frac(a + c, b + d)] : [frac(a * c, b * d), frac(b * c, a * d)]).concat(common);
    return {
      subj: 'math', kind: mul ? 'ぶんすうの かけざん' : 'ぶんすうの わりざん',
      prompt: `<span class="formula">${fracRaw(a, b)} ${mul ? '×' : '÷'} ${fracRaw(c, d)} ＝ ？</span>`,
      choices: withDistractors(correct, wrong, 4, (x) => x.value),
      answer: correct.value,
      explain: mul ? `分子どうし・分母どうしを かける → ${correct.html}` : `わる数を ひっくりかえして かける：${fracRaw(a, b)} × ${fracRaw(d, c)} ＝ ${correct.html}`,
    };
  };
  M.ratio = () => {
    const a = ri(1, 9), b = ri(1, 9), k = ri(2, 9);
    if (Math.random() < 0.5) return inputQ('ひ', `${a} : ${b} ＝ ${a * k} : □`, b * k, `${a} → ${a * k} は ${k}ばい → ${b} × ${k} ＝ <b>${b * k}</b>`);
    return inputQ('ひ', `${a} : ${b} ＝ □ : ${b * k}`, a * k, `${b} → ${b * k} は ${k}ばい → ${a} × ${k} ＝ <b>${a * k}</b>`);
  };
  M.speed = ({ lv }) => {
    const v = pick([4, 5, 30, 40, 50, 60, 80]), t = ri(2, lv > 1 ? 6 : 3);
    const r = ri(0, 2);
    const unit = 'km';
    if (r === 0) return inputQ('はやさ', `時速${v}km で ${t}時間 すすむと なんkm？`, v * t, `はやさ × じかん ＝ ${v} × ${t} ＝ <b>${v * t}${unit}</b>`);
    if (r === 1) return inputQ('はやさ', `${v * t}km を ${t}時間で すすむ。時速 なんkm？`, v, `きょり ÷ じかん ＝ ${v * t} ÷ ${t} ＝ <b>時速${v}km</b>`);
    return inputQ('はやさ', `${v * t}km を 時速${v}km で すすむと なん時間？`, t, `きょり ÷ はやさ ＝ ${v * t} ÷ ${v} ＝ <b>${t}時間</b>`);
  };
  M.circle = ({ lv }) => {
    const r = ri(1, lv > 1 ? 10 : 5);
    if (lv < 2 || Math.random() < 0.4) return inputQ('えん', `ちょっけい ${r * 2}cm の 円周は？（円周率 3.14）`, round(r * 2 * 3.14), `${r * 2} × 3.14 ＝ <b>${round(r * 2 * 3.14)}cm</b>`);
    return inputQ('えん', `はんけい ${r}cm の 円の めんせきは？（円周率 3.14）`, round(r * r * 3.14), `${r} × ${r} × 3.14 ＝ <b>${round(r * r * 3.14)}cm²</b>`);
  };
  M.proportion = () => {
    const a = ri(2, 9), x1 = ri(1, 5), x2 = ri(6, 12);
    return inputQ('ひれい', `y は x に ひれいする。x＝${x1} のとき y＝${a * x1}。x＝${x2} のとき y は？`, a * x2, `y ＝ ${a} × x → ${a} × ${x2} ＝ <b>${a * x2}</b>`);
  };

  // ---------- がくねん ごとの しゅつだい ----------
  // [ジェネレーター, おもみ]
  const PLAN = {
    0: { en: [[E.listenPic, 5], [E.listenColor, 3], [E.listenShape, 2], [E.listenNumber, 2]], math: [[M.count, 3], [M.more, 2]] },
    1: { en: [[E.listenPic, 5], [E.listenColor, 3], [E.listenShape, 2], [E.listenNumber, 3]], math: [[M.count, 3], [M.more, 2], [M.next, 2]] },
    2: { en: [[E.listenPic, 5], [E.listenColor, 2], [E.listenNumber, 3], [E.listenAlpha, 3], [E.listenShape, 1]], math: [[M.addPic, 3], [M.subPic, 2], [M.next, 2], [M.count, 1], [M.bigger, 1]] },
    3: { en: [[E.listenPic, 4], [E.listenNumber, 3], [E.listenAlpha, 3], [E.alphaMatch, 2], [E.listenColor, 1], [E.greeting, 2]], math: [[M.add20, 3], [M.sub20, 3], [M.clockJa, 1], [M.bigger, 1]] },
    4: { en: [[E.listenPic, 3], [E.picToWord, 3], [E.alphaMatch, 2], [E.alphaOrder, 2], [E.numberWord, 2], [E.greeting, 2], [E.colorWord, 2], [E.listenAlpha, 1]], math: [[M.add2d, 3], [M.sub2d, 3], [M.kuku, 4], [M.length, 1], [M.placeValue, 1], [M.clockJa, 1]] },
    5: { en: [[E.picToWord, 4], [E.wordToJa, 3], [E.howMany, 2], [E.alphaOrder, 1], [E.numberWord, 2], [E.greeting, 2], [E.days, 2], [E.colorWord, 1], [E.qa, 1]], math: [[M.div, 4], [M.mul2x1, 3], [M.add3d, 2], [M.time, 1], [M.kuku, 1]] },
    6: { en: [[E.picToWord, 3], [E.wordToJa, 3], [E.jaToWord, 2], [E.spell, 3], [E.days, 2], [E.clock, 2], [E.mathInEnglish, 2], [E.qa, 2], [E.numberWord, 1], [E.sentence, 1]], math: [[M.div2, 3], [M.mul2x2, 3], [M.areaRect, 2], [M.decAdd, 2], [M.round, 1], [M.fracSame, 2]] },
    7: { en: [[E.wordToJa, 3], [E.jaToWord, 3], [E.spell, 3], [E.months, 2], [E.ordinals, 2], [E.qa, 3], [E.sentence, 2], [E.subjects, 1], [E.clock, 1], [E.mathInEnglish, 1]], math: [[M.decMul, 3], [M.percent, 3], [M.avg, 2], [M.triangle, 2], [M.fracAdd, 3], [M.volume, 1]] },
    8: { en: [[E.jaToWord, 3], [E.wordToJa, 2], [E.spell, 3], [E.qa, 3], [E.sentence, 3], [E.past, 3], [E.wordOrder, 2], [E.country, 2], [E.months, 1], [E.ordinals, 1]], math: [[M.fracMulDiv, 4], [M.ratio, 3], [M.speed, 3], [M.circle, 2], [M.proportion, 2], [M.percent, 1]] },
  };

  function weightedPick(list, avoid) {
    const cand = list.filter(([f]) => f !== avoid);
    const src = cand.length ? cand : list;
    const total = src.reduce((s, [, w]) => s + w, 0);
    let r = Math.random() * total;
    for (const [f, w] of src) { if ((r -= w) < 0) return f; }
    return src[src.length - 1][0];
  }

  let lastGen = null;
  // enRatio: えいごの わりあい（0〜1）
  function next({ g, lvEn, lvMath, enRatio }) {
    const plan = PLAN[g] || PLAN[0];
    const useEn = Math.random() < enRatio;
    const list = useEn ? plan.en : plan.math;
    const gen = weightedPick(list, lastGen);
    lastGen = gen;
    const lv = useEn ? lvEn : lvMath;
    for (let tries = 0; tries < 5; tries++) {
      try {
        const q = gen({ g, lv });
        q.type = q.type || 'choice';
        return q;
      } catch (e) { console.warn(e); }
    }
    return M.count({ g, lv });
  }

  return { next, PLAN, _E: E, _M: M };
})();
