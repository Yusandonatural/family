/* =========================================================
   おてつだい こづかい帳：お手伝いを カレンダーに 記録して 1ヶ月ごとに 集計
   共有データベースが 使えるときは 家族の スマホで 同じ 記録を 見る。
   使えないときは この端末の localStorage に 保存する。
   ========================================================= */
window.Kozukai = (function () {
  'use strict';

  const KEY = 'otetsudai-kozukai-v1';
  const KID_COLORS = 6;
  const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
  const uid = () => Math.random().toString(36).slice(2, 9);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // 最初から 入っている 項目は どの スマホでも 同じ id に なるよう 固定する
  function defaults() {
    const chores = [
      ['お風呂洗い', 10], ['お洗濯たたみ', 20], ['掃除機', 10], ['布団敷き', 20],
      ['食器洗い', 20], ['靴並べ', 10], ['玄関はき', 10], ['食器並べ', 10],
    ].map(([name, price], i) => ({ id: 'c' + (i + 1), name, price }));
    const kids = ['こうたろう', 'かこ', 'そうじろう', 'みちさぶろう']
      .map((name, i) => ({ id: 'k' + (i + 1), name, color: i }));
    return { chores, kids, records: {} };
  }

  // records[YYYY-MM-DD][kidId][choreId] = { n: 名前, p: 記録したときの 金額 }
  // 共有モードでは 表示中の 月の 分だけを 持つ
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)) || defaults(); } catch (e) { state = defaults(); }

  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
  const yen = (n) => n.toLocaleString('ja-JP');
  const kidColor = (k) => `var(--k${k.color % KID_COLORS})`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const now = new Date();
  const view = { y: now.getFullYear(), m: now.getMonth(), kid: 'all' };
  let openDate = null;
  let pendingDelete = null;
  let onChange = () => {};

  // ---------- 保存 ----------
  let db = null;
  let unsubMonth = null;
  const chains = {};
  function saveLocal() { if (!db) try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* 保存できない 端末 */ } }
  function queue(key, fn) {
    const run = (chains[key] || Promise.resolve()).then(fn).catch(onWriteError);
    chains[key] = run;
    return run;
  }
  function onWriteError(e) {
    setSync('err', e && e.code === 'invalid_argument'
      ? '保存できませんでした。持ち主に 共有設定で「Contributor」以上に してもらってください。'
      : '保存できませんでした。電波の 良いところで もう一度 ためしてください。');
  }
  function persistConfig() {
    if (!db) return saveLocal();
    const body = clone({ chores: state.chores, kids: state.kids, adults: state.adults || [] });
    queue('config', () => db.doc('app/config').set(body));
  }
  function persistDay(date) {
    if (!db) return saveLocal();
    const r = state.records[date] ? clone(state.records[date]) : null;
    const ref = db.doc('days/' + date);
    queue('d' + date, () => (r ? ref.set({ m: date.slice(0, 7), r }) : ref.delete()));
  }
  function setSync(kind, text) {
    const el = $('kzSync');
    el.className = 'kz-sync' + (kind ? ' ' + kind : '');
    el.textContent = text;
  }
  function subscribeMonth() {
    if (!db) return;
    if (unsubMonth) unsubMonth();
    const m = `${view.y}-${pad(view.m + 1)}`;
    unsubMonth = db.collection('days').where('m', '==', m).onSnapshot((snap) => {
      const rec = {};
      snap.docs.forEach((d) => { rec[d.id] = clone(d.data().r || {}); });
      state.records = rec;
      render();
    }, () => setSync('err', '共有データを 読み込めませんでした。ページを 開き直してください。'));
  }

  // ---------- 集計 ----------
  const dayEntries = (date, kidId) => Object.values((state.records[date] || {})[kidId] || {});
  const daySum = (date, kidId) => dayEntries(date, kidId).reduce((s, e) => s + e.p, 0);
  function monthDates() {
    const n = new Date(view.y, view.m + 1, 0).getDate();
    return Array.from({ length: n }, (_, i) => ymd(view.y, view.m, i + 1));
  }
  function kidMonth(kidId) {
    let sum = 0, cnt = 0;
    monthDates().forEach((d) => { const e = dayEntries(d, kidId); cnt += e.length; sum += e.reduce((s, x) => s + x.p, 0); });
    return { sum, cnt };
  }
  function monthTotal() {
    return state.kids.reduce((t, k) => {
      const r = kidMonth(k.id);
      return { sum: t.sum + r.sum, cnt: t.cnt + r.cnt };
    }, { sum: 0, cnt: 0 });
  }

  // ---------- 描画 ----------
  const av = (k) => `<span class="kz-av" style="--kc:${kidColor(k)}" aria-hidden="true">${esc(k.name.slice(0, 1))}</span>`;

  function renderKids() {
    const tot = monthTotal();
    $('kzKids').innerHTML =
      `<button class="kz-kid" data-kid="all" aria-pressed="${view.kid === 'all'}"><span class="kz-av" style="--kc:var(--pri)">👪</span><span class="nm">みんな</span><span class="yen num">${yen(tot.sum)}<small>円</small></span></button>` +
      state.kids.map((k) => {
        const r = kidMonth(k.id);
        return `<button class="kz-kid" data-kid="${k.id}" aria-pressed="${view.kid === k.id}">${av(k)}<span class="nm">${esc(k.name)}</span><span class="yen num">${yen(r.sum)}<small>円</small></span></button>`;
      }).join('');
  }

  function renderCalendar() {
    const y = view.y, m = view.m;
    const first = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();
    const todayKey = ymd(now.getFullYear(), now.getMonth(), now.getDate());
    const kids = view.kid === 'all' ? state.kids : state.kids.filter((k) => k.id === view.kid);
    let cells = '';
    for (let i = 0; i < first; i++) cells += '<span class="cal-cell empty"></span>';
    for (let d = 1; d <= days; d++) {
      const k = ymd(y, m, d);
      const wd = (first + d - 1) % 7;
      const sum = kids.reduce((s, kid) => s + daySum(k, kid.id), 0);
      let inner = '';
      if (view.kid === 'all') {
        const dots = kids.filter((kid) => daySum(k, kid.id) > 0).map((kid) => `<b style="--kc:${kidColor(kid)}"></b>`).join('');
        if (dots) inner = `<span class="kz-dots">${dots}</span>`;
      } else {
        const n = dayEntries(k, view.kid).length;
        if (n) inner = `<span class="coin">🪙</span>${n > 1 ? `<b class="lx">×${n}</b>` : ''}`;
      }
      cells += `<button class="cal-cell w${wd} ${k === todayKey ? 'today' : ''} ${sum ? 'has' : ''}" data-date="${k}" aria-label="${m + 1}月${d}日 ${sum}円">
        <i>${d}</i>${inner}${sum ? `<em class="num">${sum}円</em>` : ''}</button>`;
    }
    const who = view.kid === 'all' ? 'みんなで' : esc((state.kids.find((x) => x.id === view.kid) || {}).name || '');
    const t = view.kid === 'all' ? monthTotal() : kidMonth(view.kid);
    $('kzCal').innerHTML = `
      <div class="cal-head">
        <button class="icon-btn kz-prev" aria-label="まえの月">‹</button>
        <h2>${y !== now.getFullYear() ? y + '年 ' : ''}${m + 1}月の おてつだい</h2>
        <button class="icon-btn kz-next" aria-label="つぎの月">›</button>
      </div>
      <p class="cal-sum">${who} <b class="num">${yen(t.sum)}</b>円 ・ おてつだい <b class="num">${t.cnt}</b>回</p>
      <div class="cal-grid">${WEEK.map((w, i) => `<span class="cal-h w${i}">${w}</span>`).join('')}${cells}</div>
      <p class="hint" style="text-align:center">日付を おすと、その日の おてつだいを つけられます</p>`;
  }

  function renderDetail() {
    const rows = new Map();
    const totals = state.kids.map(() => 0);
    monthDates().forEach((date) => state.kids.forEach((k, ki) => {
      Object.entries((state.records[date] || {})[k.id] || {}).forEach(([cid, e]) => {
        if (!rows.has(cid)) rows.set(cid, { name: e.n, per: state.kids.map(() => ({ c: 0, s: 0 })) });
        const r = rows.get(cid).per[ki]; r.c++; r.s += e.p; totals[ki] += e.p;
      });
    }));
    const order = state.chores.map((c) => c.id).filter((id) => rows.has(id))
      .concat([...rows.keys()].filter((id) => !state.chores.some((c) => c.id === id)));
    const head = `<thead><tr><th>おてつだい</th>${state.kids.map((k) => `<th>${esc(k.name)}</th>`).join('')}</tr></thead>`;
    const body = order.length
      ? order.map((id) => { const r = rows.get(id); return `<tr><td>${esc(r.name)}</td>${r.per.map((p) => `<td class="num">${p.c ? `${p.c}回 / ${yen(p.s)}円` : '—'}</td>`).join('')}</tr>`; }).join('')
      : `<tr><td colspan="${state.kids.length + 1}" style="color:var(--sub)">まだ 記録が ありません</td></tr>`;
    const foot = `<tfoot><tr><td>しきゅう額</td>${totals.map((t) => `<td class="num">${yen(t)}円</td>`).join('')}</tr></tfoot>`;
    $('kzDetailTitle').textContent = `${view.m + 1}月の 明細`;
    $('kzDetail').innerHTML = head + `<tbody>${body}</tbody>` + foot;
  }

  // 入力中に ほかの スマホの 変更が 届いても、打っている 欄を 消さない
  const editing = (id) => $(id).contains(document.activeElement) && document.activeElement.tagName === 'INPUT';

  function renderChoreList() {
    if (editing('kzChores')) return;
    $('kzChores').innerHTML = state.chores.map((c) => `
      <div class="kz-row" data-id="${c.id}">
        <input class="kz-in" type="text" id="cn-${c.id}" value="${esc(c.name)}" data-f="name" aria-label="おてつだいの 名前">
        <input class="kz-in price" type="number" id="cp-${c.id}" value="${c.price}" min="0" step="10" data-f="price" aria-label="金額（円）"><span>円</span>
        <button class="btn sm ${pendingDelete === c.id ? 'danger' : 'ghost'}" data-del="${c.id}">${pendingDelete === c.id ? '本当に けす' : 'けす'}</button>
      </div>`).join('');
  }

  function renderKidList() {
    if (editing('kzKidList')) return;
    $('kzKidList').innerHTML = state.kids.map((k) => `
      <div class="kz-row" data-id="${k.id}">
        <span class="kz-av" style="--kc:${kidColor(k)}"></span>
        <input class="kz-in" type="text" id="kn-${k.id}" value="${esc(k.name)}" aria-label="名前">
        <button class="btn sm ${pendingDelete === k.id ? 'danger' : 'ghost'}" data-delkid="${k.id}">${pendingDelete === k.id ? '本当に けす' : 'けす'}</button>
      </div>`).join('');
  }

  function renderSheet() {
    const [y, m, d] = openDate.split('-').map(Number);
    $('kzSheetTitle').textContent = `${m}月${d}日（${WEEK[new Date(y, m - 1, d).getDay()]}）`;
    const kids = view.kid === 'all' ? state.kids : state.kids.filter((k) => k.id === view.kid);
    $('kzSheetBody').innerHTML = kids.map((k) => {
      const rec = (state.records[openDate] || {})[k.id] || {};
      const opts = state.chores.map((c) => {
        const on = !!rec[c.id];
        return `<button class="kz-opt" aria-pressed="${on}" data-kid="${k.id}" data-chore="${c.id}"><span class="n">${esc(c.name)}</span><span class="p num">${on ? rec[c.id].p : c.price}円</span></button>`;
      });
      // 消した おてつだいの 記録も 表示して 外せるように する
      Object.entries(rec).forEach(([cid, e]) => {
        if (!state.chores.some((c) => c.id === cid))
          opts.push(`<button class="kz-opt gone" aria-pressed="true" data-kid="${k.id}" data-chore="${cid}"><span class="n">${esc(e.n)}</span><span class="p num">${e.p}円</span></button>`);
      });
      return `<div class="kz-block" style="--kc:${kidColor(k)}"><div class="kh"><span>${av(k)}${esc(k.name)}</span><span class="num">${daySum(openDate, k.id)}円</span></div><div class="kz-opts">${opts.join('')}</div></div>`;
    }).join('');
  }

  function render() {
    renderKids(); renderCalendar(); renderDetail(); renderChoreList(); renderKidList();
    if (openDate) renderSheet();
    onChange();
  }

  // ---------- 操作 ----------
  function goMonth(y, m) {
    view.y = y; view.m = m;
    if (db) state.records = {};
    render(); subscribeMonth();
  }
  function openSheet(date) { openDate = date; renderSheet(); $('kzSheet').hidden = false; $('kzSheetClose').focus(); }
  function closeSheet() { $('kzSheet').hidden = true; openDate = null; }

  function bind() {
    $('kzKids').addEventListener('click', (e) => {
      const b = e.target.closest('.kz-kid'); if (b) { view.kid = b.dataset.kid; render(); }
    });
    $('kzCal').addEventListener('click', (e) => {
      if (e.target.closest('.kz-prev')) return goMonth(view.m ? view.y : view.y - 1, (view.m + 11) % 12);
      if (e.target.closest('.kz-next')) return goMonth(view.m === 11 ? view.y + 1 : view.y, (view.m + 1) % 12);
      const c = e.target.closest('.cal-cell[data-date]'); if (c) openSheet(c.dataset.date);
    });
    $('kzSheetBody').addEventListener('click', (e) => {
      const b = e.target.closest('.kz-opt'); if (!b) return;
      const { kid, chore } = b.dataset;
      const date = openDate;
      const day = (state.records[date] = state.records[date] || {});
      const rec = (day[kid] = day[kid] || {});
      if (rec[chore]) delete rec[chore];
      else { const c = state.chores.find((x) => x.id === chore); rec[chore] = { n: c.name, p: c.price }; }
      if (!Object.keys(rec).length) delete day[kid];
      if (!Object.keys(day).length) delete state.records[date];
      persistDay(date);
      render();
    });
    $('kzSheetClose').onclick = closeSheet;
    $('kzSheet').addEventListener('click', (e) => { if (e.target === $('kzSheet')) closeSheet(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('kzSheet').hidden) closeSheet(); });

    $('kzChores').addEventListener('change', (e) => {
      const c = state.chores.find((x) => x.id === e.target.closest('.kz-row').dataset.id);
      if (e.target.dataset.f === 'name') c.name = e.target.value.trim() || c.name;
      else c.price = Math.max(0, parseInt(e.target.value, 10) || 0);
      e.target.blur(); persistConfig(); render();
    });
    $('kzChores').addEventListener('click', (e) => {
      const id = e.target.dataset.del; if (!id) return;
      if (pendingDelete !== id) { pendingDelete = id; renderChoreList(); return; }
      state.chores = state.chores.filter((c) => c.id !== id); pendingDelete = null; persistConfig(); render();
    });
    $('kzAddChore').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('kzNewChore').value.trim(); if (!name) return;
      state.chores.push({ id: uid(), name, price: Math.max(0, parseInt($('kzNewPrice').value, 10) || 0) });
      $('kzNewChore').value = ''; persistConfig(); render();
    });
    $('kzKidList').addEventListener('change', (e) => {
      const k = state.kids.find((x) => x.id === e.target.closest('.kz-row').dataset.id);
      k.name = e.target.value.trim() || k.name; e.target.blur(); persistConfig(); render();
    });
    $('kzKidList').addEventListener('click', (e) => {
      const id = e.target.dataset.delkid; if (!id) return;
      if (pendingDelete !== id) { pendingDelete = id; renderKidList(); return; }
      state.kids = state.kids.filter((k) => k.id !== id);
      if (!db) Object.values(state.records).forEach((day) => delete day[id]);
      if (view.kid === id) view.kid = 'all';
      pendingDelete = null; persistConfig(); render();
    });
    $('kzAddKid').addEventListener('submit', (e) => {
      e.preventDefault();
      const name = $('kzNewKid').value.trim(); if (!name) return;
      const used = new Set(state.kids.map((k) => k.color));
      let color = 0; while (used.has(color) && color < KID_COLORS) color++;
      state.kids.push({ id: uid(), name, color: color % KID_COLORS });
      $('kzNewKid').value = ''; persistConfig(); render();
    });

    // バックアップ
    const msg = (t) => { $('kzBackupMsg').textContent = t; };
    $('kzExport').onclick = async () => {
      const out = { chores: state.chores, kids: state.kids, adults: state.adults || [], records: state.records };
      if (db) {
        try {
          const snap = await db.collection('days').get();
          out.records = {};
          snap.docs.forEach((d) => { out.records[d.id] = d.data().r || {}; });
        } catch (err) { msg('記録を 読み込めませんでした。もう一度 ためしてください。'); return; }
      }
      const text = JSON.stringify(out, null, 2);
      const filename = `kozukai-${ymd(now.getFullYear(), now.getMonth(), now.getDate())}.json`;
      const dl = window.claude && window.claude.use ? await window.claude.use('downloads') : null;
      if (dl) {
        try { await dl.save({ filename, data: text }); msg('書き出しました。'); }
        catch (err) { msg(err && err.code === 'declined' ? '書き出しを やめました。' : '書き出せませんでした。'); }
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
      a.download = filename;
      a.click(); URL.revokeObjectURL(a.href);
    };
    $('kzImport').addEventListener('change', async (e) => {
      const f = e.target.files[0]; e.target.value = ''; if (!f) return;
      let data;
      try {
        data = JSON.parse(await f.text());
        if (!Array.isArray(data.chores) || !Array.isArray(data.kids) || typeof data.records !== 'object') throw 0;
      } catch (err) { msg('読み込めませんでした。このアプリで 書き出した ファイルを えらんでください。'); return; }
      state.chores = data.chores; state.kids = data.kids; state.adults = data.adults || []; view.kid = 'all';
      if (db) {
        persistConfig();
        Object.entries(data.records).forEach(([date, r]) => { state.records[date] = r; persistDay(date); });
        await Promise.all(Object.values(chains));
        subscribeMonth();
      } else {
        state.records = data.records; saveLocal();
      }
      render(); msg('読み込みました。');
    });
  }

  // 共有データベースが 使えるときは 家族の スマホで 同じ 記録を 見る
  async function connect() {
    if (!window.claude || !window.claude.use) return;
    db = await window.claude.use('db');
    if (!db) return;
    setSync('on', '家族の スマホと 共有しています');
    $('kzBackupHint').textContent = '記録は 家族みんなで 共有されています。念のため ファイルにも 書き出しておけます。';
    state.records = {};
    db.doc('app/config').onSnapshot((snap) => {
      if (!snap.exists) return;
      const d = snap.data();
      state.chores = clone(d.chores || []);
      state.kids = clone(d.kids || []);
      state.adults = clone(d.adults || []);
      if (view.kid !== 'all' && !state.kids.some((k) => k.id === view.kid)) view.kid = 'all';
      render();
    }, () => setSync('err', '共有データを 読み込めませんでした。ページを 開き直してください。'));
    subscribeMonth();
  }

  function init(opts) {
    onChange = (opts && opts.onChange) || onChange;
    bind(); render(); connect();
  }

  function setKid(id) {
    view.kid = id === 'all' || state.kids.some((k) => k.id === id) ? id : 'all';
    goMonth(now.getFullYear(), now.getMonth());
  }

  return {
    init, monthTotal, setKid,
    kids: () => state.kids.map((k) => ({ id: k.id, name: k.name, birth: k.birth || '', color: kidColor(k), month: kidMonth(k.id) })),
    // うらない 用：おとなは こづかい帳には 出さず、たんじょうびだけ 持つ
    adults: () => (state.adults || []).map((a) => ({ id: a.id, name: a.name, birth: a.birth || '', color: 'var(--sub)' })),
    setBirth(id, birth) {
      const p = state.kids.find((k) => k.id === id) || (state.adults || []).find((a) => a.id === id);
      if (!p) return;
      p.birth = birth; persistConfig(); render();
    },
    addAdult(name, birth) {
      state.adults = state.adults || [];
      state.adults.push({ id: 'a' + uid(), name, birth });
      persistConfig(); render();
    },
    removeAdult(id) {
      state.adults = (state.adults || []).filter((a) => a.id !== id);
      persistConfig(); render();
    },
    month: () => view.m + 1,
  };
})();
