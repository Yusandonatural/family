/* =========================================================
   きょうの うんせい：星命録（四柱推命の日運・動物占い・西洋占星術）から
   生年月日だけで 出せる ものを こども向けに まとめる
   計算は 星命録 極 家族版と 同じ（日干支・干合/支合/三合/冲/空亡）
   ========================================================= */
window.Uranai = (function () {
  'use strict';

  const STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const SIGNS = ['おひつじ座', 'おうし座', 'ふたご座', 'かに座', 'しし座', 'おとめ座', 'てんびん座', 'さそり座', 'いて座', 'やぎ座', 'みずがめ座', 'うお座'];
  // 60の 日干支 → 動物占いの キャラ（星命録 CHARS60 と 同じ 並び）
  const ANIMAL60 = ['チータ', 'たぬき', '猿', 'コアラ', '黒ひょう', '虎', 'チータ', 'たぬき', '猿', 'コアラ',
    'こじか', 'ゾウ', '狼', 'ひつじ', '猿', 'コアラ', 'こじか', 'ゾウ', '狼', 'ひつじ',
    'ペガサス', 'ペガサス', 'ひつじ', '狼', '狼', 'ひつじ', 'ペガサス', 'ペガサス', 'ひつじ', '狼',
    'ゾウ', 'こじか', 'コアラ', '猿', 'ひつじ', '狼', 'ゾウ', 'こじか', 'コアラ', '猿',
    'たぬき', 'チータ', '虎', '黒ひょう', 'コアラ', '猿', 'たぬき', 'チータ', '虎', '黒ひょう',
    'ライオン', 'ライオン', '黒ひょう', '虎', '虎', '黒ひょう', 'ライオン', 'ライオン', '黒ひょう', '虎'];
  const ANIMAL_EMOJI = { '狼': '🐺', 'こじか': '🦌', '猿': '🐵', 'チータ': '🐆', '黒ひょう': '🐈‍⬛', 'ライオン': '🦁', '虎': '🐯', 'たぬき': '🦝', 'コアラ': '🐨', 'ゾウ': '🐘', 'ひつじ': '🐑', 'ペガサス': '🦄' };
  const ANIMAL_KID = {
    '狼': 'ひとりの時間がすきな、マイペースなオオカミ。自分だけのやり方を見つける天才だよ。',
    'こじか': '人なつっこいこじか。なかよしの友だちには、あまえんぼう。うそがつけない正直ものだよ。',
    '猿': 'あそびの天才、おさるさん。手先がきようで、くふうするのが大とくい。ほめられるとパワーアップ！',
    'チータ': 'はしり出したら、だれよりも速いチーター。あたらしいことに「一番のり」するのがとくいだよ。',
    '黒ひょう': 'かっこいいものが大すきな黒ひょう。あたらしいもの、おしゃれなものを見つける名人だよ。',
    'ライオン': 'どうぶつの王さま、ライオン。ほんとうはがんばりやさんなのに、それをかくして、どうどうとしているよ。',
    '虎': 'たのもしいトラの親分。こまっている子を見ると、ほうっておけないやさしさがあるよ。',
    'たぬき': 'みんなをほっとさせる、たぬきさん。むかしのものや思い出を大切にする、心のあったかい子。',
    'コアラ': 'のんびりやさんに見えて、じつはかしこいコアラ。おひるねの時間は、ぜったいひつよう！',
    'ゾウ': 'こつこつがんばるゾウさん。おぼえる力がすごくて、れんしゅうしたことは、ぜったいわすれない。',
    'ひつじ': 'みんなといっしょがうれしい、ひつじさん。ひとりぼっちの子に気づける、心やさしい子だよ。',
    'ペガサス': '空とぶペガサス。ひらめきがすごくて、自由にさせてもらえるほど、大かつやくするよ。',
  };
  const SCORE_MSG = [null,
    'ていねいに すごす日。まわりの 人に やさしく してみよう',
    'のんびり じゅうでんの 日。むりしないで はやく ねよう',
    'いつもどおりの 一日。コツコツ いこう',
    'いい かぜが ふいてるよ。なんでも うまく いきそう',
    'さいこうの 一日！ やりたかったことに チャレンジしよう'];
  // 日干の 五行 → ラッキーカラー
  const LUCKY = [
    { ja: 'みどり', hex: '#43a047' }, { ja: 'あか', hex: '#e53935' }, { ja: 'きいろ', hex: '#fdd835' },
    { ja: 'しろ・きんいろ', hex: '#ffffff' }, { ja: 'あお・くろ', hex: '#283593' }];

  // ---------- 暦の 計算（星命録と 同じ） ----------
  const mod = (a, n) => ((a % n) + n) % n;
  const rad = (d) => d * Math.PI / 180;
  const norm = (d) => ((d % 360) + 360) % 360;
  function jdn(y, m, d) {
    const a = Math.floor((14 - m) / 12), Y = y + 4800 - a, M = m + 12 * a - 3;
    return d + Math.floor((153 * M + 2) / 5) + 365 * Y + Math.floor(Y / 4) - Math.floor(Y / 100) + Math.floor(Y / 400) - 32045;
  }
  function sunLon(jd) {
    const n = jd - 2451545, L = norm(280.460 + 0.9856474 * n), g = rad(norm(357.528 + 0.9856003 * n));
    return norm(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  }
  const dayIndex = (y, m, d) => mod(jdn(y, m, d) + 49, 60);
  function voidBranches(di) { const g = Math.floor(di / 10); return [mod(10 - 2 * g, 12), mod(11 - 2 * g, 12)]; }
  // 星命録の dayScoreFor と 同じ 判定。メモは こども向けの ことばに
  function dayScore(bdi, di) {
    const s = di % 10, b = di % 12, bs = bdi % 10, bb = bdi % 12;
    let score = 3; const notes = [];
    if (mod(s - bs + 10, 10) === 5) { score++; notes.push('なかよしの日'); }
    if (mod(b + bb, 12) === 1) { score++; notes.push('ぴったり 気が合う日'); }
    if (b % 4 === bb % 4 && b !== bb) { score++; notes.push('おいかぜの日'); }
    if (mod(bb + 6, 12) === b) { score--; notes.push('よていが かわるかも'); }
    if (di === bdi) { score = 5; notes.push('60日に いちどの とくべつな日'); }
    if (voidBranches(bdi).includes(b)) { score = Math.min(score, 2); notes.push('じゅうでんの日'); }
    return { score: Math.max(1, Math.min(5, score)), notes };
  }

  function parseBirth(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || '');
    if (!m) return null;
    const y = +m[1], mo = +m[2], d = +m[3];
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return { y, m: mo, d };
  }

  // その人の きょうの うんせい（たんじょうびが なければ null）
  function fortune(birth, now = new Date()) {
    const b = parseBirth(birth); if (!b) return null;
    const bdi = dayIndex(b.y, b.m, b.d);
    const tdi = dayIndex(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const today = dayScore(bdi, tdi);
    let best = null;
    for (let i = 1; i <= 7; i++) {
      const d = new Date(now); d.setDate(d.getDate() + i);
      const r = dayScore(bdi, dayIndex(d.getFullYear(), d.getMonth() + 1, d.getDate()));
      if (!best || r.score > best.score) best = { score: r.score, date: d };
    }
    const animal = ANIMAL60[bdi];
    const sign = SIGNS[Math.floor(sunLon(jdn(b.y, b.m, b.d) - 0.5 + 3 / 24) / 30)];
    return { ...today, msg: SCORE_MSG[today.score], best, animal, emoji: ANIMAL_EMOJI[animal], animalText: ANIMAL_KID[animal], sign };
  }

  function todayInfo(now = new Date()) {
    const tdi = dayIndex(now.getFullYear(), now.getMonth() + 1, now.getDate());
    return {
      label: `${now.getMonth() + 1}月${now.getDate()}日（${WEEK[now.getDay()]}）`,
      kanshi: STEMS[tdi % 10] + BRANCHES[tdi % 12],
      lucky: LUCKY[Math.floor((tdi % 10) / 2)],
    };
  }

  const stars = (n) => '★'.repeat(n) + `<span class="off">${'★'.repeat(5 - n)}</span>`;
  const dayLabel = (d) => `${d.getMonth() + 1}/${d.getDate()}（${WEEK[d.getDay()]}）`;

  return { fortune, todayInfo, stars, dayLabel, parseBirth };
})();
