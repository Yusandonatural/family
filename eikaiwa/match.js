/* =========================================================
   こえの はんてい：きこえた えいご（音声認識の 文字）と こたえが にているか
   音声認識は 書き方が ゆれるので、くらべる前に 両方を おなじ形に そろえる
   - ’ ‘ などの アポストロフィ、I'm ↔ I am、don't ↔ do not
   - 300 ↔ three hundred、5th ↔ fifth、2,000 ↔ 2000
   - OK ↔ okay、T-shirt ↔ t shirt、to/too/two・for/four などの 同じ音
   - 人の名前・地名（Ken, Yui, Sora, Natsume Soseki …）は 聞きとりにくいので、いえなくても へらさない
   ========================================================= */
(function (root) {
  'use strict';
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
    'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
  function words(n) {
    n = Math.floor(n);
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ' ' + ONES[n % 10] : '');
    if (n < 1000) return ONES[Math.floor(n / 100)] + ' hundred' + (n % 100 ? ' ' + words(n % 100) : '');
    if (n < 1000000) return words(Math.floor(n / 1000)) + ' thousand' + (n % 1000 ? ' ' + words(n % 1000) : '');
    return String(n);
  }
  function ordinal(n) {
    const w = words(n).split(' ');
    const last = w.pop();
    w.push(ORD[last] || (/y$/.test(last) ? last.replace(/y$/, 'ieth') : last + 'th'));
    return w.join(' ');
  }
  // 年は「twenty twenty」「nineteen ninety」とも よむので、どちらでも 同じに なるよう 数字の まま くらべる
  const NUMWORD = {};
  for (let i = 0; i < 100; i++) NUMWORD[words(i)] = i;
  // 同じ音・同じ いみの ことばは 1つに そろえる
  const SAME = {
    too: 'to', two: 'to', four: 'for', fore: 'for', write: 'right', their: 'there', eye: 'i', u: 'you', ok: 'okay',
    cannot: 'can not', wanna: 'want to', gonna: 'going to', gotta: 'got to', mt: 'mount', mr: 'mister', ms: 'miz', mrs: 'missus',
    hi: 'hi', hey: 'hi', bye: 'goodbye', tshirt: 't shirt', 'thank-you': 'thank you',
  };
  function norm(s) {
    let t = ' ' + String(s).toLowerCase() + ' ';
    t = t.replace(/[’‘`´]/g, "'");
    t = t.replace(/(\d),(\d{3})/g, '$1$2');                 // 2,000 → 2000
    t = t.replace(/\bt-?shirts?\b/g, (m) => 't shirt' + (/s$/.test(m) ? 's' : ''));
    t = t.replace(/(\d+)(st|nd|rd|th)\b/g, (m, d) => ' ' + ordinal(+d) + ' '); // 5th → fifth
    t = t.replace(/(\d+):(\d\d)/g, (m, h, mi) => ' ' + words(+h) + ' ' + (+mi ? words(+mi) : "o'clock") + ' ');
    t = t.replace(/\b(\d{4})\b/g, (m, y) => { const n = +y; return n >= 1100 && n <= 2099 && n % 1000 >= 10 ? ' ' + words(Math.floor(n / 100)) + ' ' + (n % 100 ? (n % 100 < 10 ? 'oh ' + words(n % 100) : words(n % 100)) : 'hundred') + ' ' : ' ' + words(n) + ' '; });
    t = t.replace(/\d+/g, (m) => ' ' + words(+m) + ' ');
    // 短縮形を ひらく（両方に 同じ ことを するので いみが ずれても かまわない）
    t = t.replace(/\bcan't\b/g, 'can not').replace(/\bwon't\b/g, 'will not').replace(/\bain't\b/g, 'is not')
      .replace(/n't\b/g, ' not').replace(/'m\b/g, ' am').replace(/'re\b/g, ' are').replace(/'s\b/g, ' is')
      .replace(/'ll\b/g, ' will').replace(/'ve\b/g, ' have').replace(/'d\b/g, ' would');
    t = t.replace(/\bo'clock\b/g, 'oclock');
    t = t.replace(/[^a-z0-9 ]+/g, ' ');
    // アポストロフィなしで 書かれた 短縮形（im, dont, its …）
    const NOAPO = { im: 'i am', dont: 'do not', doesnt: 'does not', didnt: 'did not', isnt: 'is not', arent: 'are not', wasnt: 'was not',
      cant: 'can not', wont: 'will not', its: 'it is', ive: 'i have', youre: 'you are', theyre: 'they are', whats: 'what is', thats: 'that is',
      lets: 'let us', hes: 'he is', shes: 'she is', ill: 'i will', id: 'i would', wouldnt: 'would not', couldnt: 'could not', shouldnt: 'should not', havent: 'have not', hasnt: 'has not' };
    let out = t.split(/\s+/).filter(Boolean).flatMap((w) => (NOAPO[w] || w).split(' '));
    out = out.flatMap((w) => (SAME[w] || w).split(' '));
    // let's は let us に（'s → is に したのを もどす）
    for (let i = 0; i + 1 < out.length; i++) if (out[i] === 'let' && out[i + 1] === 'is') out[i + 1] = 'us';
    return out;
  }
  // 大文字でも 音声認識が ふつうに 書ける ことば（名前あつかいに しない）
  const COMMON = new Set(('january february march april may june july august september october november december ' +
    'sunday monday tuesday wednesday thursday friday saturday sundays mondays saturdays english japanese chinese french ' +
    'japan america canada italy china korea france australia tokyo osaka kyoto thank nice it this here see come who can let ' +
    'he she what first').split(' '));
  // こたえの 中の 名前（文の とちゅうで 大文字の ことば。I・月・曜日・国 などは のぞく）
  function namesIn(target) {
    const raw = String(target).replace(/[.!?,]/g, ' ').split(/\s+/).filter(Boolean);
    const out = new Set();
    raw.forEach((w, i) => {
      if (i === 0 || w === 'I' || /^I'/.test(w) || !/^[A-Z][a-z]/.test(w) || COMMON.has(w.toLowerCase().replace(/'.*$/, ''))) return;
      norm(w).forEach((x) => out.add(x));
    });
    return out;
  }
  /** きこえなかった ことば（名前は のぞく）と、くらべた ことばの かず */
  function check(said, target) {
    const A = norm(said), B = norm(target), names = namesIn(target);
    const pool = A.slice();
    let miss = 0, n = 0;
    const missed = [];
    B.forEach((w) => {
      const j = pool.indexOf(w);
      if (j >= 0) { n++; pool.splice(j, 1); }
      else if (!names.has(w)) { n++; miss++; missed.push(w); } // 名前が きこえなくても かぞえない
    });
    return { miss, n, missed, heard: A };
  }
  /** いった ことば said と こたえ target の にている わりあい（0〜1） */
  function score(said, target) { const c = check(said, target); return c.n ? (c.n - c.miss) / c.n : 1; }
  /** OK か どうか。3ご までは ぜんぶ、4〜6ごは 1つ、7〜10ごは 2つ、それより ながければ 3つ まで ちがっても OK。
   *  key（その文の だいじな ことば）が あれば、それは きこえないと だめ */
  function ok(said, target, key) {
    const c = check(said, target);
    if (!c.heard.length) return false;
    const allow = c.n <= 3 ? 0 : c.n <= 6 ? 1 : c.n <= 10 ? 2 : 3;
    if (c.miss > allow) return false;
    if (key) { const k = norm(key); if (k.length && k.some((w) => c.missed.includes(w))) return false; }
    return true;
  }
  root.EikMatch = { norm, score, ok, check };
})(typeof window !== 'undefined' ? window : globalThis);
