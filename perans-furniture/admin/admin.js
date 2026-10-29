/* ==========================================================================
   PERANS — Admin panel logic (vanilla, no build step)
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const LS_ADMIN = 'perans_admin_data';
  const LS_SITE = 'perans_site_data';
  const LS_AUTH = 'perans_admin_auth';
  const LS_SESSION = 'perans_admin_session';
  const LS_ORDERS = 'perans_orders';
  const DEFAULT_PW = 'perans1404';

  /* ذخیره‌سازی مقاوم: اگر مرورگر/iframe اجازه ندهد، در حافظه‌ی همین صفحه نگه می‌داریم */
  const store = (function () {
    let ok = true, mem = {};
    try { localStorage.setItem('__perans_t', '1'); localStorage.removeItem('__perans_t'); } catch (e) { ok = false; }
    return {
      get ok() { return ok; },
      get(k) { try { return ok ? localStorage.getItem(k) : (k in mem ? mem[k] : null); } catch (e) { return mem[k] || null; } },
      set(k, v) { try { if (ok) localStorage.setItem(k, v); else mem[k] = v; } catch (e) { mem[k] = v; } },
      del(k) { try { if (ok) localStorage.removeItem(k); delete mem[k]; } catch (e) { delete mem[k]; } }
    };
  })();

  const ICO = (n) => '<svg aria-hidden="true"><use href="#a-' + n + '"/></svg>';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => (isFinite(n) ? Number(n).toLocaleString('fa-IR') : '۰');
  const money = (n) => num(n) + ' تومان';

  const IMG_LIB = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'hero', 'look1', 'lounge', 'showroom'];
  const imgOf = (v) => (!v ? '../images/p1.jpg' : (/^(data:|https?:|\.\.?\/|images\/)/.test(v) ? v : '../images/' + v + '.jpg'));

  /* ------------------------------------------------------------------ store */
  const FALLBACK = {
    version: 1,
    brand: { name: 'مبل پرنس', en: 'PERANS', phone: '09159598518', phoneRaw: '09159598518', mobile: '09159598518', mobileRaw: '09159598518', address: 'خیابان انقلاب، نبش انقلاب ۳', hours: 'همه‌روزه ۹ تا ۲۱ — جمعه‌ها ۱۶ تا ۲۱', email: '', instagram: 'https://instagram.com/PERANS_FURNITURE', whatsapp: '', telegram: '', since: '۱۳۷۲' },
    hero: { badge: 'PERANS · بیرجند · برای خانه‌ای که امضای شماست', t1: 'خانه‌ات را', t2: 'خاص‌تر بچین؛', t3: 'با امضای پرنس.', lead: 'از نشیمنِ صمیمی تا پذیراییِ چشم‌گیر؛ مدل‌های منتخب مبل، ناهارخوری، اتاق خواب و دکور را کنار هم ببینید و برای فضای خودتان انتخاب کنید.' },
    stats: [], announce: [], categories: [{ id: 'all', name: 'همه محصولات' }], products: [],
    commerce: { shipping: 1200000, threshold: 20000000, coupons: {} }
  };

  function deepClone(o) { return JSON.parse(JSON.stringify(o)); }

  function loadAdmin() {
    const seed = window.PERANS_DATA || window.PERANS_DEFAULTS || FALLBACK;
    try {
      const raw = store.get(LS_ADMIN);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if ((+saved.version || 1) < (+seed.version || 2)) {
            return Object.assign({}, saved, {
              version: seed.version,
              brand: Object.assign({}, saved.brand || {}, seed.brand || {}),
              hero: deepClone(seed.hero || {}),
              stats: deepClone(seed.stats || []),
              announce: deepClone(seed.announce || []),
              quotes: []
            });
          }
          return saved;
        }
      }
    } catch (e) {}
    return deepClone(seed);
  }

  let S = loadAdmin();
  S.ordersStatus = S.ordersStatus || {};
  S.version = Math.max(+S.version || 1, +(window.PERANS_DATA || {}).version || 2);

  function orders() {
    try { return JSON.parse(store.get(LS_ORDERS) || '[]'); } catch (e) { return []; }
  }
  function setOrders(list) {
    store.set(LS_ORDERS, JSON.stringify(list));
  }

  function stamp() {
    const d = new Date();
    S.updatedAt = d.toISOString();
    return d.toLocaleDateString('fa-IR') + ' — ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  }

  function persist(silent) {
    const when = stamp();
    try {
      store.set(LS_ADMIN, JSON.stringify(S));
      // پیش‌نمایش زنده برای سایت (همین مبدأ)
      const payload = deepClone(S);
      delete payload.ordersStatus;
      store.set(LS_SITE, JSON.stringify(payload));
    } catch (e) {
      toast('ذخیره نشد: فضای مرورگر پر است (تصاویر آپلودی زیاد؟)', 'err');
      return;
    }
    $('#lastSaved').textContent = 'آخرین ذخیره: ' + when;
    broadcast();
    if (!silent) toast('تغییرات ذخیره و روی سایت اعمال شد', 'ok');
  }

  /* اعلام تغییر به سایتِ باز در همان مرورگر */
  function broadcast() {
    try { new BroadcastChannel('perans-cms').postMessage({ type: 'save', at: Date.now() }); } catch (e) {}
  }

  /* ------------------------------------------------------------------ toast */
  function toast(msg, kind) {
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || 'ok');
    t.innerHTML = ICO(kind === 'err' ? 'x' : 'check') + '<span>' + esc(msg) + '</span>';
    $('#toasts').appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  /* ------------------------------------------------------------------ auth */
  function simpleHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return 'h' + (h >>> 0).toString(16);
  }
  async function hash(str) {
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
        return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) {}
    return simpleHash(str);
  }
  function authRecord() {
    try { return JSON.parse(store.get(LS_AUTH) || 'null'); } catch (e) { return null; }
  }
  async function ensureAuth() {
    if (authRecord()) return;
    const h = await hash(DEFAULT_PW);
    store.set(LS_AUTH, JSON.stringify({ hash: h, at: Date.now() }));
  }
  function sessionValid() {
    try {
      const s = JSON.parse(store.get(LS_SESSION) || 'null');
      return !!(s && s.exp > Date.now());
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------------ nav */
  const VIEWS = {
    dash: ['داشبورد', 'نمای کلی فروشگاه'],
    products: ['محصولات', 'افزودن، ویرایش و قیمت‌گذاری محصولات'],
    orders: ['سفارش‌ها', 'سفارش‌های ثبت‌شده در سایت'],
    cats: ['دسته‌بندی‌ها', 'ساختار دسته‌های فروشگاه'],
    content: ['محتوای صفحه', 'متن‌های صفحه‌ی اصلی و بخش‌های ثابت'],
    commerce: ['فروش و تخفیف', 'هزینه ارسال، سقف ارسال رایگان و کدهای تخفیف'],
    settings: ['تنظیمات و تماس', 'اطلاعات فروشگاه و رمز عبور پنل'],
    backup: ['پشتیبان‌گیری', 'دریافت و بازگردانی داده‌های سایت']
  };

  let current = 'dash';

  function go(view) {
    current = view;
    $$('.nav__item').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'view-' + view));
    const t = VIEWS[view] || ['', ''];
    $('#pageTitle').textContent = t[0];
    $('#pageSub').textContent = t[1];
    render();
    closeSide();
  }

  function render() {
    $('#navProducts').textContent = num(S.products.length);
    $('#navOrders').textContent = num(orders().length);
    const fn = { dash: renderDash, products: renderProducts, orders: renderOrders, cats: renderCats, content: renderContent, commerce: renderCommerce, settings: renderSettings, backup: renderBackup }[current];
    if (fn) fn();
  }

  /* ------------------------------------------------------------------ dashboard */
  function renderDash() {
    const os = orders();
    const revenue = os.reduce((a, o) => a + (+o.total || 0), 0);
    const newOnes = os.filter((o) => (S.ordersStatus[o.id] || o.status || 'new') === 'new').length;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const cnt = os.filter((o) => (o.date || '').slice(0, 10) === key).length;
      days.push({ label: d.toLocaleDateString('fa-IR', { weekday: 'short' }), n: cnt });
    }
    const max = Math.max(1, ...days.map((d) => d.n));

    const recent = os.slice(0, 5);

    $('#view-dash').innerHTML =
      '<div class="kpis">' +
        kpi('box', 'gold', S.products.length, 'محصول در فروشگاه', 'در ' + num(S.categories.length - 1) + ' دسته', 0) +
        kpi('cart', 'green', os.length, 'سفارش ثبت‌شده', newOnes ? num(newOnes) + ' سفارش جدید' : 'همه بررسی شده', 1) +
        kpi('tag', 'amber', revenue, 'مجموع فروش', 'همه‌ی سفارش‌ها', 2, true) +
      '</div>' +
      '<div class="grid-2">' +
        '<div class="card"><div class="card__head"><div><h3>سفارش‌های هفت روز گذشته</h3><p>تعداد سفارش ثبت‌شده در هر روز</p></div>' +
          '<div class="sp"><button class="btn btn--ghost btn--sm" data-act="seed-orders">' + ICO('plus') + ' سفارش نمونه</button></div></div>' +
          '<div class="card__body"><div class="chart">' +
            days.map((d, i) => '<div class="chart__col"><b>' + (d.n ? num(d.n) : '') + '</b><div class="chart__bar" style="height:' + Math.round((d.n / max) * 100) + '%;--i:' + i + '"></div><small>' + esc(d.label) + '</small></div>').join('') +
          '</div></div></div>' +
        '<div class="card"><div class="card__head"><div><h3>میان‌بُرها</h3><p>کارهای پرکاربرد</p></div></div><div class="card__body" style="display:grid;gap:9px">' +
          '<button class="btn btn--gold" data-act="quick-new">' + ICO('plus') + ' افزودن محصول جدید</button>' +
          '<button class="btn btn--ghost" data-goto="content">' + ICO('edit') + ' ویرایش متن صفحه‌ی اول</button>' +
          '<button class="btn btn--ghost" data-goto="commerce">' + ICO('tag') + ' ساخت کد تخفیف</button>' +
          '<button class="btn btn--ghost" data-goto="backup">' + ICO('down') + ' دریافت فایل داده‌ی سایت</button>' +
        '</div></div>' +
      '</div>' +
      '<div class="card" style="margin-top:14px"><div class="card__head"><div><h3>آخرین سفارش‌ها</h3><p>۵ سفارش اخیر</p></div>' +
        '<div class="sp"><button class="btn btn--ghost btn--sm" data-goto="orders">همه سفارش‌ها</button></div></div>' +
        (recent.length ? ordersTable(recent, true) : '<div class="empty">' + ICO('cart') + '<div>هنوز سفارشی ثبت نشده — با دکمه‌ی «سفارش نمونه» یکی بسازید.</div></div>') +
      '</div>';
  }

  function kpi(ico, cls, value, label, sub, i, isMoney) {
    return '<div class="kpi k-' + cls + '" style="--i:' + i + '"><div class="kpi__top">' +
      '<span class="kpi__ico">' + ICO(ico) + '</span><i class="trend">' + esc(sub) + '</i></div>' +
      '<b class="num">' + (isMoney ? num(Math.round(value / 1000000)) + '<small style="font-size:13px;font-weight:700"> م.ت</small>' : num(value)) + '</b>' +
      '<span class="lbl">' + esc(label) + '</span></div>';
  }

  /* ------------------------------------------------------------------ products */
  let pQuery = '', pCat = 'all';

  function renderProducts() {
    const list = S.products.filter((p) => {
      const okQ = !pQuery || (p.name + ' ' + p.id + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(pQuery.toLowerCase());
      const okC = pCat === 'all' || p.cat === pCat;
      return okQ && okC;
    });

    $('#view-products').innerHTML =
      '<div class="toolbar">' +
        '<div class="search">' + ICO('search') + '<input id="pSearch" placeholder="جستجو در محصولات…" value="' + esc(pQuery) + '"></div>' +
        '<select id="pCat"><option value="all">همه دسته‌ها</option>' +
          S.categories.filter((c) => c.id !== 'all').map((c) => '<option value="' + esc(c.id) + '"' + (pCat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') +
        '</select>' +
        '<button class="btn btn--gold" data-act="quick-new">' + ICO('plus') + ' محصول جدید</button>' +
      '</div>' +
      '<div class="card tablewrap">' +
        (list.length ?
          '<table><thead><tr><th>محصول</th><th>دسته</th><th>قیمت</th><th>تخفیف</th><th>امتیاز</th><th>برچسب</th><th></th></tr></thead><tbody>' +
          list.map((p) =>
            '<tr><td><div class="cellpro"><img class="thumb" src="' + esc(imgOf(p.img)) + '" alt=""><div><b>' + esc(p.name) + '</b><small>' + esc(p.id) + '</small></div></div></td>' +
            '<td><span class="tag b">' + esc(catName(p.cat)) + '</span></td>' +
            '<td>' + num(p.price) + '</td>' +
            '<td>' + (p.old ? '<span class="tag g">' + num(Math.round((1 - p.price / p.old) * 100)) + '٪</span>' : '<span class="muted">—</span>') + '</td>' +
            '<td>' + num(p.rating || 0) + ' <span class="muted" style="font-size:10px">(' + num(p.reviews || 0) + ')</span></td>' +
            '<td>' + (p.badge ? '<span class="tag ' + (p.badgeClass === 'sale' ? 'r' : p.badgeClass === 'new' ? 'g' : 'a') + '">' + esc(p.badge) + '</span>' : '<span class="muted">—</span>') + '</td>' +
            '<td><div class="rowact">' +
              '<button class="mini" data-act="edit-product" data-id="' + esc(p.id) + '" title="ویرایش">' + ICO('edit') + '</button>' +
              '<button class="mini" data-act="dup-product" data-id="' + esc(p.id) + '" title="کپی">' + ICO('copy') + '</button>' +
              '<button class="mini del" data-act="del-product" data-id="' + esc(p.id) + '" title="حذف">' + ICO('trash') + '</button>' +
            '</div></td></tr>').join('') +
          '</tbody></table>'
          : '<div class="empty">' + ICO('box') + '<div>محصولی با این فیلتر پیدا نشد.</div></div>') +
      '</div>';

    const s = $('#pSearch'), c = $('#pCat');
    if (s) s.addEventListener('input', (e) => { pQuery = e.target.value; renderProducts(); $('#pSearch').focus(); });
    if (c) c.addEventListener('change', (e) => { pCat = e.target.value; renderProducts(); });
  }

  function catName(id) { const c = S.categories.find((x) => x.id === id); return c ? c.name : id; }

  function productModal(id) {
    const isNew = !id;
    const p = isNew
      ? { id: 'new-' + Math.random().toString(36).slice(2, 6), name: '', cat: (S.categories[1] || {}).id || 'modern', img: 'p1', price: 0, old: null, rating: 4.8, reviews: 0, badge: '', badgeClass: '', colors: [], desc: '', tags: [], specs: {} }
      : deepClone(S.products.find((x) => x.id === id));

    const specsRows = Object.entries(p.specs || {}).map(([k, v], i) =>
      '<div class="specrow" style="display:grid;grid-template-columns:1fr 1.4fr auto;gap:8px;margin-bottom:8px">' +
        '<input data-spec-k placeholder="عنوان" value="' + esc(k) + '"><input data-spec-v placeholder="مقدار" value="' + esc(v) + '">' +
        '<button class="mini del" type="button" data-act="del-spec">' + ICO('trash') + '</button></div>').join('');

    openModal(
      '<div class="modal__head"><div><h3>' + (isNew ? 'محصول جدید' : 'ویرایش محصول') + '</h3><p style="margin:2px 0 0;font-size:11.5px;color:var(--muted)">شناسه: ' + esc(p.id) + '</p></div>' +
        '<button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button></div>' +
      '<div class="modal__body"><div class="formgrid">' +
        field('نام محصول', '<input data-k="name" value="' + esc(p.name) + '">', 'full') +
        field('دسته', '<select data-k="cat">' + S.categories.filter((c) => c.id !== 'all').map((c) => '<option value="' + esc(c.id) + '"' + (p.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select>') +
        field('تصویر', '<select data-k="img">' + IMG_LIB.map((k) => '<option value="' + k + '"' + (p.img === k ? ' selected' : '') + '>' + k + '.jpg</option>').join('') + '</select><small>یا تصویر جدید آپلود کنید</small><input type="file" accept="image/*" id="imgUp" style="margin-top:6px">') +
        field('قیمت (تومان)', '<input data-k="price" type="number" value="' + (+p.price || 0) + '">') +
        field('قیمت قبل از تخفیف', '<input data-k="old" type="number" value="' + (p.old || '') + '" placeholder="خالی = بدون تخفیف">') +
        field('امتیاز (۰ تا ۵)', '<input data-k="rating" type="number" step="0.1" min="0" max="5" value="' + (+p.rating || 0) + '">') +
        field('تعداد نظر', '<input data-k="reviews" type="number" value="' + (+p.reviews || 0) + '">') +
        field('برچسب', '<input data-k="badge" value="' + esc(p.badge) + '" placeholder="مثلاً پرفروش">') +
        field('رنگ برچسب', '<select data-k="badgeClass"><option value=""' + (!p.badgeClass ? ' selected' : '') + '>طلایی</option><option value="sale"' + (p.badgeClass === 'sale' ? ' selected' : '') + '>قرمز (تخفیف)</option><option value="new"' + (p.badgeClass === 'new' ? ' selected' : '') + '>سبز (جدید)</option></select>') +
        field('توضیحات', '<textarea data-k="desc">' + esc(p.desc) + '</textarea>', 'full') +
        field('تگ‌ها (با کاما جدا کنید)', '<input data-k="tags" value="' + esc((p.tags || []).join('، ')) + '">', 'full') +
        field('رنگ‌ها (کد hex با کاما)', '<input data-k="colors" value="' + esc((p.colors || []).join(', ')) + '" placeholder="#123f34, #b58a5c">', 'full') +
        '<div class="full"><div class="hr"></div><div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px">' +
          '<b style="font-size:12.5px">مشخصات فنی</b><button class="btn btn--ghost btn--sm" type="button" data-act="add-spec">' + ICO('plus') + ' ردیف</button></div>' +
          '<div id="specs">' + specsRows + '</div></div>' +
      '</div></div>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-close>انصراف</button>' +
        '<button class="btn btn--gold" data-act="save-product" data-id="' + esc(p.id) + '" data-new="' + (isNew ? '1' : '') + '">' + ICO('save') + ' ذخیره محصول</button></div>'
    );

    const up = $('#imgUp');
    if (up) up.addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        let sel = $('[data-k="img"]');
        sel.outerHTML = '<input type="hidden" data-k="img" value="' + r.result + '"><div style="margin-top:8px"><img src="' + r.result + '" style="width:100%;max-height:110px;object-fit:cover;border-radius:10px"></div>';
        toast('تصویر بارگذاری شد', 'ok');
      };
      r.readAsDataURL(f);
    });
  }

  function field(label, inner, cls) {
    return '<div class="f ' + (cls || '') + '"><label>' + esc(label) + '</label>' + inner + '</div>';
  }

  function saveProduct(id, isNew) {
    const box = $('#modalBox');
    const get = (k) => { const el = box.querySelector('[data-k="' + k + '"]'); return el ? el.value : ''; };
    const specs = {};
    $$('#specs .specrow', box).forEach((row) => {
      const k = row.querySelector('[data-spec-k]').value.trim();
      const v = row.querySelector('[data-spec-v]').value.trim();
      if (k) specs[k] = v;
    });
    const obj = {
      id,
      name: get('name').trim() || 'محصول بدون نام',
      cat: get('cat'),
      img: get('img') || 'p1',
      price: +get('price') || 0,
      old: +get('old') || null,
      rating: Math.min(5, Math.max(0, +get('rating') || 0)),
      reviews: +get('reviews') || 0,
      badge: get('badge').trim(),
      badgeClass: get('badgeClass'),
      colors: get('colors').split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      desc: get('desc').trim(),
      tags: get('tags').split(/[,،]/).map((s) => s.trim()).filter(Boolean),
      specs
    };
    if (isNew) S.products.unshift(obj);
    else S.products = S.products.map((p) => (p.id === id ? obj : p));
    persist();
    closeModal();
    render();
  }

  /* ------------------------------------------------------------------ orders */
  const STATUS = { new: ['جدید', 'a'], processing: ['در حال آماده‌سازی', 'b'], sent: ['ارسال شده', 'g'], done: ['تحویل شده', 'g'], canceled: ['لغو شده', 'r'] };

  function ordersTable(list, compact) {
    return '<div class="tablewrap"><table><thead><tr><th>شماره</th><th>مشتری</th><th>مبلغ</th><th>تاریخ</th><th>وضعیت</th>' + (compact ? '' : '<th></th>') + '</tr></thead><tbody>' +
      list.map((o) => {
        const st = S.ordersStatus[o.id] || o.status || 'new';
        const s0 = STATUS[st] || STATUS.new;
        return '<tr><td><b>' + esc(o.id) + '</b></td>' +
          '<td><div class="cellpro"><div><b>' + esc(o.name || '—') + '</b><small>' + esc(o.phone || '') + ' · ' + esc(o.city || '') + '</small></div></div></td>' +
          '<td>' + num(o.total || 0) + '</td>' +
          '<td class="muted" style="font-size:11px">' + esc(new Date(o.date || Date.now()).toLocaleDateString('fa-IR')) + '</td>' +
          '<td>' + (compact
            ? '<span class="tag ' + s0[1] + '">' + s0[0] + '</span>'
            : '<select data-act="order-status" data-id="' + esc(o.id) + '">' + Object.keys(STATUS).map((k) => '<option value="' + k + '"' + (st === k ? ' selected' : '') + '>' + STATUS[k][0] + '</option>').join('') + '</select>') +
          '</td>' + (compact ? '' : '<td><div class="rowact"><button class="mini" data-act="order-view" data-id="' + esc(o.id) + '">' + ICO('eye') + '</button><button class="mini del" data-act="order-del" data-id="' + esc(o.id) + '">' + ICO('trash') + '</button></div></td>') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }

  function renderOrders() {
    const os = orders();
    $('#view-orders').innerHTML =
      '<div class="toolbar"><div class="search">' + ICO('search') + '<input id="oS" placeholder="جستجوی شماره یا نام مشتری…"></div>' +
        '<button class="btn btn--ghost btn--sm" data-act="export-orders">' + ICO('down') + ' خروجی CSV</button>' +
        '<button class="btn btn--ghost btn--sm" data-act="seed-orders">' + ICO('plus') + ' سفارش نمونه</button></div>' +
      '<div class="card">' + (os.length ? ordersTable(os) : '<div class="empty">' + ICO('cart') + '<div>هنوز سفارشی در این مرورگر ثبت نشده.</div></div>') + '</div>';
    const s = $('#oS');
    if (s) s.addEventListener('input', () => {
      const q = s.value.toLowerCase();
      const f = os.filter((o) => (o.id + o.name + o.phone).toLowerCase().includes(q));
      $('.card', $('#view-orders')).innerHTML = f.length ? ordersTable(f) : '<div class="empty">' + ICO('cart') + '<div>سفارشی پیدا نشد.</div></div>';
      s.focus();
    });
  }

  /* ------------------------------------------------------------------ categories */
  function renderCats() {
    $('#view-cats').innerHTML =
      '<div class="card"><div class="card__head"><div><h3>دسته‌بندی محصولات</h3><p>شناسه‌ی لاتین برای آدرس‌ها استفاده می‌شود</p></div>' +
        '<div class="sp"><button class="btn btn--gold btn--sm" data-act="add-cat">' + ICO('plus') + ' دسته جدید</button></div></div>' +
      '<div class="card__body" style="display:grid;gap:9px">' +
        S.categories.map((c, i) =>
          '<div style="display:grid;grid-template-columns:1fr 1.2fr auto;gap:10px;align-items:center">' +
            '<input value="' + esc(c.id) + '" data-cat-id="' + i + '"' + (c.id === 'all' ? ' disabled' : '') + ' style="padding:9px 12px;border-radius:11px;border:1px solid var(--line);background:#fffdf9">' +
            '<input value="' + esc(c.name) + '" data-cat-name="' + i + '" style="padding:9px 12px;border-radius:11px;border:1px solid var(--line);background:#fffdf9">' +
            (c.id === 'all'
              ? '<span class="tag b">ثابت</span>'
              : '<button class="mini del" data-act="del-cat" data-id="' + esc(c.id) + '">' + ICO('trash') + '</button>') +
          '</div>').join('') +
      '</div>' +
      '<div class="modal__foot" style="position:static;background:transparent;border-top:1px solid var(--line-soft)">' +
        '<button class="btn btn--gold" data-act="save-cats">' + ICO('save') + ' ذخیره دسته‌بندی‌ها</button></div></div>';
  }

  /* ------------------------------------------------------------------ content */
  function renderContent() {
    const H = S.hero || {}, B = S.brand || {};
    $('#view-content').innerHTML =
      '<div class="sectiongrid">' +
      '<div class="card"><div class="card__head"><div><h3>بخش هیرو (بالای صفحه‌ی اصلی)</h3><p>همان چیزی که مشتری اول می‌بیند</p></div></div><div class="card__body">' +
        '<div class="formgrid">' +
          field('برچسب بالای تیتر', '<input data-bind="hero.badge" value="' + esc(H.badge) + '">', 'full') +
          field('خط اول تیتر', '<input data-bind="hero.t1" value="' + esc(H.t1) + '">') +
          field('خط دوم تیتر', '<input data-bind="hero.t2" value="' + esc(H.t2) + '">') +
          field('خط سوم (طلایی)', '<input data-bind="hero.t3" value="' + esc(H.t3) + '">') +
          field('متن معرفی', '<textarea data-bind="hero.lead">' + esc(H.lead) + '</textarea>', 'full') +
        '</div></div></div>' +

      '<div class="card"><div class="card__head"><div><h3>کارت‌های هیرو</h3><p>چهار دسته‌ای که کنار دکمه‌ها دیده می‌شوند</p></div></div><div class="card__body">' +
        '<div class="formgrid">' + (S.stats || []).map((st, i) =>
          field('عنوان ' + num(i + 1), '<input data-bind="stats.' + i + '.value" value="' + esc(st.value) + '">') +
          field('توضیح ' + num(i + 1), '<input data-bind="stats.' + i + '.label" value="' + esc(st.label) + '">')).join('') + '</div></div></div>' +

      '<div class="card"><div class="card__head"><div><h3>نوار اطلاعیه‌ی بالای سایت</h3><p>به‌ترتیب نمایش داده می‌شوند</p></div>' +
        '<div class="sp"><button class="btn btn--ghost btn--sm" data-act="add-ann">' + ICO('plus') + ' افزودن</button></div></div>' +
        '<div class="card__body" style="display:grid;gap:8px">' + (S.announce || []).map((t, i) =>
          '<div style="display:grid;grid-template-columns:1fr auto;gap:8px"><input data-bind="announce.' + i + '" value="' + esc(t) + '" style="padding:10px 12px;border-radius:11px;border:1px solid var(--line);background:#fffdf9">' +
          '<button class="mini del" data-act="del-ann" data-i="' + i + '">' + ICO('trash') + '</button></div>').join('') + '</div></div>' +

      '<div class="card"><div class="card__head"><div><h3>برند و اطلاعات تماس</h3><p>در فوتر، صفحه‌ی تماس و هدر استفاده می‌شود</p></div></div><div class="card__body"><div class="formgrid">' +
        field('نام فارسی', '<input data-bind="brand.name" value="' + esc(B.name) + '">') +
        field('نام لاتین', '<input data-bind="brand.en" value="' + esc(B.en) + '">') +
        field('تلفن (نمایش)', '<input data-bind="brand.phone" value="' + esc(B.phone) + '">') +
        field('تلفن (لینک)', '<input data-bind="brand.phoneRaw" value="' + esc(B.phoneRaw) + '">') +
        field('موبایل', '<input data-bind="brand.mobile" value="' + esc(B.mobile) + '">') +
        field('ایمیل', '<input data-bind="brand.email" value="' + esc(B.email) + '">') +
        field('نشانی', '<input data-bind="brand.address" value="' + esc(B.address) + '" class="full">', 'full') +
        field('ساعات کاری', '<input data-bind="brand.hours" value="' + esc(B.hours) + '">', 'full') +
      '</div></div></div>' +

      '<div style="display:flex;gap:10px;justify-content:flex-end">' +
        '<button class="btn btn--ghost" data-act="reload-content">بازخوانی</button>' +
        '<button class="btn btn--gold" data-act="save-content">' + ICO('save') + ' ذخیره محتوا</button></div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ commerce */
  function renderCommerce() {
    const C = S.commerce || {};
    $('#view-commerce').innerHTML =
      '<div class="sectiongrid">' +
      '<div class="card"><div class="card__head"><div><h3>ارسال و نصب</h3><p>در محاسبه‌ی سبد خرید استفاده می‌شود</p></div></div><div class="card__body"><div class="formgrid">' +
        field('هزینه‌ی ارسال (تومان)', '<input data-bind="commerce.shipping" type="number" value="' + (+C.shipping || 0) + '">') +
        field('سقف ارسال رایگان (تومان)', '<input data-bind="commerce.threshold" type="number" value="' + (+C.threshold || 0) + '">') +
      '</div><div style="margin-top:14px"><button class="btn btn--gold" data-act="save-commerce">' + ICO('save') + ' ذخیره</button></div></div></div>' +

      '<div class="card"><div class="card__head"><div><h3>کدهای تخفیف</h3><p>درصد تخفیف روی جمع سبد</p></div>' +
        '<div class="sp"><button class="btn btn--gold btn--sm" data-act="add-coupon">' + ICO('plus') + ' کد جدید</button></div></div>' +
        '<div class="card__body"><div class="tablewrap"><table><thead><tr><th>کد</th><th>درصد</th><th></th></tr></thead><tbody>' +
          (Object.entries(C.coupons || {}).map(([code, pct]) =>
            '<tr><td><b style="letter-spacing:.08em">' + esc(code) + '</b></td><td><span class="tag g">' + num(Math.round(pct * 100)) + '٪</span></td>' +
            '<td><div class="rowact"><button class="mini del" data-act="del-coupon" data-code="' + esc(code) + '">' + ICO('trash') + '</button></div></td></tr>').join('') ||
          '<tr><td colspan="3"><div class="empty">کد تخفیفی ندارید.</div></td></tr>') +
        '</tbody></table></div></div></div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ settings */
  function renderSettings() {
    $('#view-settings').innerHTML =
      '<div class="sectiongrid">' +
      '<div class="card"><div class="card__head"><div><h3>شبکه‌های اجتماعی</h3><p>لینک‌های فوتر</p></div></div><div class="card__body"><div class="formgrid">' +
        field('اینستاگرام (تنها شبکه‌ی اجتماعی)', '<input data-bind="brand.instagram" value="' + esc(S.brand.instagram || '') + '" placeholder="https://instagram.com/PERANS_FURNITURE">') +
        field('واتس‌اپ', '<input data-bind="brand.whatsapp" value="' + esc(S.brand.whatsapp || '') + '">') +
        field('تلگرام', '<input data-bind="brand.telegram" value="' + esc(S.brand.telegram || '') + '">') +
        field('سال شروع فعالیت', '<input data-bind="brand.since" value="' + esc(S.brand.since || '') + '">') +
      '</div><div style="margin-top:14px"><button class="btn btn--gold" data-act="save-brand">' + ICO('save') + ' ذخیره</button></div></div></div>' +

      '<div class="card"><div class="card__head"><div><h3>رمز عبور پنل</h3><p>رمز پیش‌فرض: ' + DEFAULT_PW + ' — همین حالا عوضش کنید</p></div></div>' +
        '<div class="card__body"><div class="formgrid">' +
          field('رمز فعلی', '<input type="password" id="pwOld" placeholder="••••••••">') +
          field('رمز جدید', '<input type="password" id="pwNew" placeholder="حداقل ۶ کاراکتر">') +
          field('تکرار رمز جدید', '<input type="password" id="pwNew2" placeholder="••••••••">') +
        '</div><div style="margin-top:14px"><button class="btn btn--dark" data-act="change-pw">' + ICO('lock') + ' تغییر رمز</button></div></div></div>' +

      '<div class="card"><div class="card__head"><div><h3>وضعیت اتصال به سایت</h3><p>پنل و سایت باید از یک دامنه باز شوند</p></div></div>' +
        '<div class="card__body" style="display:grid;gap:10px">' +
        '<div class="switchrow"><div><b style="font-size:12.5px">' + (store.ok ? 'ذخیره‌سازی مرورگر فعال است' : 'ذخیره‌سازی مرورگر بسته است') + '</b>' +
        '<div class="muted" style="font-size:11px">' + (store.ok
          ? 'با هر ذخیره، سایتِ باز در همین مرورگر فوراً به‌روز می‌شود (بدون رفرش).'
          : 'این حالت معمولاً وقتی است که فایل داخل iframe یا حالت ناشناس باز شده. فایل‌ها را روی سرور یا مستقیماً در مرورگر باز کنید.') + '</div></div>' +
        '<label class="switch"><input type="checkbox"' + (store.ok ? ' checked' : '') + ' disabled><i></i></label></div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' +
          '<a class="btn btn--ghost btn--sm" href="../index.html" target="_blank">' + ICO('eye') + ' باز کردن سایت</a>' +
          '<button class="btn btn--ghost btn--sm" data-goto="backup">' + ICO('down') + ' دریافت data.js</button>' +
        '</div></div></div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ backup */
  function renderBackup() {
    $('#view-backup').innerHTML =
      '<div class="sectiongrid">' +
      '<div class="card"><div class="card__head"><div><h3>دریافت داده‌ها</h3><p>فایل data.js را کنار index.html بگذارید تا تغییرات برای همه اعمال شود</p></div></div>' +
        '<div class="card__body" style="display:grid;gap:10px">' +
          '<button class="btn btn--gold" data-act="export-js">' + ICO('down') + ' دریافت فایل data.js (انتشار روی سایت)</button>' +
          '<button class="btn btn--ghost" data-act="export-json">' + ICO('down') + ' دریافت نسخه‌ی پشتیبان JSON</button>' +
          '<button class="btn btn--ghost" data-act="copy-js">' + ICO('copy') + ' کپی محتوای data.js در کلیپ‌بورد</button>' +
        '</div></div>' +
      '<div class="card"><div class="card__head"><div><h3>بازگردانی</h3><p>فایل پشتیبان را انتخاب کنید</p></div></div>' +
        '<div class="card__body" style="display:grid;gap:10px">' +
          '<button class="btn btn--ghost" data-act="import">' + ICO('up') + ' بارگذاری فایل JSON</button>' +
          '<button class="btn btn--danger" data-act="reset">' + ICO('trash') + ' بازگشت به داده‌های اولیه‌ی سایت</button>' +
        '</div></div>' +
      '<div class="card"><div class="card__head"><div><h3>راهنما</h3></div></div><div class="card__body muted" style="font-size:12.5px;line-height:2">' +
        '۱. هر تغییری که در پنل ذخیره کنید، همان لحظه در مرورگر خودتان روی سایت اعمال می‌شود.<br>' +
        '۲. برای اینکه همه‌ی بازدیدکننده‌ها تغییر را ببینند، «دریافت data.js» را بزنید و فایل را در ریشه‌ی سایت (کنار index.html) جایگزین کنید.<br>' +
        '۳. پیش از هر تغییر بزرگ، یک نسخه‌ی JSON بگیرید — با «بارگذاری فایل JSON» همه‌چیز برمی‌گردد.' +
      '</div></div></div>';
  }

  /* ------------------------------------------------------------------ modal */
  function openModal(html) {
    $('#modalBox').innerHTML = html;
    $('#modal').classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#modal').classList.remove('on');
    document.body.style.overflow = '';
  }

  /* ------------------------------------------------------------------ helpers for bindings */
  function setDeep(path, value) {
    const parts = path.split('.');
    let o = S;
    for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }
  function saveBound(scope) {
    $$('[data-bind]', scope).forEach((el) => {
      let v = el.value;
      if (el.type === 'number') v = +v || 0;
      setDeep(el.getAttribute('data-bind'), v);
    });
  }

  /* ------------------------------------------------------------------ demo orders */
  function seedOrders() {
    const list = orders();
    const names = ['سارا محمدی', 'رضا اکبری', 'فاطمه رضایی'];
    const cities = ['بیرجند', 'قائن', 'نهبندان'];
    for (let i = 0; i < 3; i++) {
      const p = S.products[i % S.products.length] || { id: 'royal', name: 'مبل رویال', price: 84500000 };
      const d = new Date(); d.setDate(d.getDate() - i);
      list.unshift({
        id: 'PERANS-' + Math.floor(100000 + Math.random() * 899999),
        date: d.toISOString(), status: 'new',
        name: names[i], phone: '0915000' + (1000 + i), city: cities[i], address: 'خیابان شهدا',
        pay: 'online', total: (+p.price || 1000000) + 1200000,
        items: [{ id: p.id, name: p.name, qty: 1, price: +p.price || 1000000 }]
      });
    }
    setOrders(list);
    toast('۳ سفارش نمونه ساخته شد', 'ok');
    render();
  }

  /* ------------------------------------------------------------------ export */
  function download(name, text, type) {
    const blob = new Blob([text], { type: type || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 3000);
  }
  function dataJs() {
    const payload = deepClone(S);
    delete payload.ordersStatus;
    payload.updatedAt = new Date().toISOString();
    return '/* PERANS — site data · ویرایش‌شده در پنل مدیریت */\nwindow.PERANS_DATA = ' + JSON.stringify(payload, null, 2) + ';\n';
  }

  /* ------------------------------------------------------------------ events */
  document.addEventListener('click', (e) => {
    const navBtn = e.target.closest('[data-view]');
    if (navBtn) { go(navBtn.dataset.view); return; }
    const goBtn = e.target.closest('[data-goto]');
    if (goBtn) { go(goBtn.dataset.goto); return; }
    if (e.target.closest('[data-close]')) { closeModal(); return; }

    const btn = e.target.closest('[data-act]');
    if (!btn) {
      if (e.target.id === 'modal') closeModal();
      return;
    }
    const act = btn.dataset.act;
    const id = btn.dataset.id;

    switch (act) {
      case 'quick-new': productModal(null); break;
      case 'edit-product': productModal(id); break;
      case 'dup-product': {
        const src = S.products.find((p) => p.id === id);
        if (!src) break;
        const copy = deepClone(src);
        copy.id = src.id + '-copy-' + Math.random().toString(36).slice(2, 5);
        copy.name = src.name + ' (کپی)';
        S.products.unshift(copy); persist(); render();
        break;
      }
      case 'del-product':
        if (confirm('این محصول حذف شود؟')) { S.products = S.products.filter((p) => p.id !== id); persist(); render(); }
        break;
      case 'save-product': saveProduct(id, btn.dataset.new === '1'); break;
      case 'add-spec': {
        const wrap = $('#specs');
        const row = document.createElement('div');
        row.className = 'specrow';
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1.4fr auto;gap:8px;margin-bottom:8px';
        row.innerHTML = '<input data-spec-k placeholder="عنوان"><input data-spec-v placeholder="مقدار"><button class="mini del" type="button" data-act="del-spec">' + ICO('trash') + '</button>';
        wrap.appendChild(row);
        break;
      }
      case 'del-spec': btn.closest('.specrow').remove(); break;

      case 'order-status':
        S.ordersStatus[id] = btn.value; persist(true); toast('وضعیت سفارش به‌روز شد', 'ok');
        break;
      case 'order-del':
        if (confirm('این سفارش حذف شود؟')) { setOrders(orders().filter((o) => o.id !== id)); render(); }
        break;
      case 'order-view': {
        const o = orders().find((x) => x.id === id);
        if (!o) break;
        openModal('<div class="modal__head"><div><h3>' + esc(o.id) + '</h3><p style="margin:2px 0 0;font-size:11.5px;color:var(--muted)">' + esc(new Date(o.date).toLocaleString('fa-IR')) + '</p></div>' +
          '<button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button></div>' +
          '<div class="modal__body"><div class="formgrid">' +
            field('مشتری', '<input value="' + esc(o.name) + '" disabled>') +
            field('تلفن', '<input value="' + esc(o.phone) + '" disabled>') +
            field('شهر', '<input value="' + esc(o.city) + '" disabled>') +
            field('روش پرداخت', '<input value="' + esc(o.pay) + '" disabled>') +
            field('نشانی', '<input value="' + esc(o.address) + '" disabled>', 'full') +
          '</div><div class="hr"></div><b style="font-size:12.5px">اقلام سفارش</b>' +
          (o.items || []).map((it) => '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line-soft);font-size:12.5px"><span>' + esc(it.name) + ' × ' + num(it.qty) + '</span><b>' + num(it.price * it.qty) + '</b></div>').join('') +
          '<div style="display:flex;justify-content:space-between;margin-top:12px;font-size:14px"><b>مبلغ کل</b><b>' + money(o.total) + '</b></div>' +
          '</div>');
        break;
      }
      case 'seed-orders': seedOrders(); break;
      case 'export-orders': {
        const rows = [['شماره', 'تاریخ', 'مشتری', 'تلفن', 'شهر', 'مبلغ', 'وضعیت']].concat(
          orders().map((o) => [o.id, new Date(o.date).toLocaleDateString('fa-IR'), o.name, o.phone, o.city, o.total, (STATUS[S.ordersStatus[o.id] || o.status || 'new'] || STATUS.new)[0]]));
        download('perans-orders.csv', '\ufeff' + rows.map((r) => r.join(',')).join('\n'), 'text/csv;charset=utf-8');
        break;
      }

      case 'add-cat': {
        const idd = prompt('شناسه‌ی لاتین دسته (مثلاً outdoor):');
        if (!idd) break;
        const nm = prompt('نام فارسی دسته:') || idd;
        S.categories.push({ id: idd.trim(), name: nm.trim() });
        persist(); render();
        break;
      }
      case 'del-cat':
        if (confirm('این دسته حذف شود؟ محصولاتش بدون تغییر می‌مانند.')) { S.categories = S.categories.filter((c) => c.id !== id); persist(); render(); }
        break;
      case 'save-cats':
        S.categories = S.categories.map((c, i) => {
          const idEl = $('[data-cat-id="' + i + '"]'), nmEl = $('[data-cat-name="' + i + '"]');
          return { id: (idEl && idEl.value.trim()) || c.id, name: (nmEl && nmEl.value.trim()) || c.name };
        });
        persist(); render();
        break;

      case 'save-content': {
        const v = $('#view-content');
        saveBound(v);
        persist(); renderContent(); toast('محتوای صفحه ذخیره شد', 'ok');
        break;
      }
      case 'reload-content': renderContent(); break;
      case 'add-ann': S.announce.push('اطلاعیه‌ی جدید…'); persist(); renderContent(); break;
      case 'del-ann': S.announce.splice(+btn.dataset.i, 1); persist(); renderContent(); break;

      case 'save-commerce': saveBound($('#view-commerce')); persist(); render(); break;
      case 'add-coupon': {
        const code = (prompt('کد تخفیف (انگلیسی، مثلاً PERANS20):') || '').trim().toUpperCase();
        if (!code) break;
        const pct = +prompt('درصد تخفیف (۱ تا ۹۰):') || 10;
        S.commerce.coupons = S.commerce.coupons || {};
        S.commerce.coupons[code] = Math.min(0.9, Math.max(0.01, pct / 100));
        persist(); render();
        break;
      }
      case 'del-coupon': delete S.commerce.coupons[btn.dataset.code]; persist(); render(); break;

      case 'save-brand': saveBound($('#view-settings')); persist(); render(); break;
      case 'change-pw': changePw(); break;

      case 'export-js': download('data.js', dataJs(), 'application/javascript;charset=utf-8'); toast('data.js آماده شد', 'ok'); break;
      case 'export-json': download('perans-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(S, null, 2), 'application/json'); break;
      case 'copy-js':
        navigator.clipboard && navigator.clipboard.writeText(dataJs()).then(() => toast('کپی شد', 'ok'), () => toast('کپی نشد', 'err'));
        break;
      case 'import': $('#filePick').click(); break;
      case 'reset':
        if (confirm('همه‌ی تغییرات پاک و داده‌های اولیه بازگردانی شود؟')) {
          store.del(LS_ADMIN);
          S = deepClone(window.PERANS_DATA || window.PERANS_DEFAULTS || FALLBACK);
          S.ordersStatus = {};
          persist(); render(); toast('به حالت اولیه برگشت', 'ok');
        }
        break;
    }
  });

  document.addEventListener('change', (e) => {
    const sel = e.target.closest('[data-act="order-status"]');
    if (sel) { S.ordersStatus[sel.dataset.id] = sel.value; persist(true); toast('وضعیت سفارش به‌روز شد', 'ok'); }
  });

  $('#filePick').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const data = JSON.parse(String(r.result));
        if (!data || !Array.isArray(data.products)) throw new Error('bad');
        S = data; S.ordersStatus = S.ordersStatus || {};
        persist(); render(); toast('پشتیبان بازگردانی شد', 'ok');
      } catch (err) { toast('فایل معتبر نیست', 'err'); }
    };
    r.readAsText(f);
    e.target.value = '';
  });


  /* ------------------------------------------------------------------ login flow */
  const loginEl = $('#login'), appEl = $('#app');

  function showApp() {
    loginEl.classList.add('leave');
    setTimeout(() => { loginEl.style.display = 'none'; }, 700);
    appEl.classList.add('on');
    $('#lastSaved').textContent = S.updatedAt ? 'آخرین ذخیره: ' + new Date(S.updatedAt).toLocaleDateString('fa-IR') : '—';
    go('dash');
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const pw = $('#pw').value;
    const rec = authRecord();
    const btn = $('#loginBtn');
    btn.disabled = true; btn.innerHTML = 'در حال بررسی…';
    const h = await hash(pw);
    await new Promise((r) => setTimeout(r, 420));
    if (rec ? h === rec.hash : pw === DEFAULT_PW) {
      $('#loginErr').textContent = '';
      const dur = $('#remember').checked ? 12 * 3600e3 : 2 * 3600e3;
      store.set(LS_SESSION, JSON.stringify({ exp: Date.now() + dur }));
      showApp();
    } else {
      $('#loginCardShake') || loginEl.querySelector('.login__card').classList.add('shake');
      setTimeout(() => loginEl.querySelector('.login__card').classList.remove('shake'), 600);
      $('#loginErr').textContent = 'رمز عبور اشتباه است';
      btn.disabled = false; btn.innerHTML = 'ورود به پنل <svg><use href="#a-out"/></svg>';
      $('#pw').select();
    }
  });

  $('#eye').addEventListener('click', () => {
    const inp = $('#pw');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    $('#eye').style.color = inp.type === 'text' ? 'var(--gold-dp)' : '';
  });

  $('#logout').addEventListener('click', () => {
    store.del(LS_SESSION);
    location.reload();
  });

  /* top bar */
  $('#saveAll').addEventListener('click', () => persist());
  $('#globalSearch').addEventListener('input', (e) => {
    pQuery = e.target.value;
    if (current !== 'products') go('products'); else renderProducts();
  });
  $('#sideOpen').addEventListener('click', () => $('#side').classList.add('on'));
  $('#sideClose').addEventListener('click', closeSide);
  function closeSide() { $('#side').classList.remove('on'); }

  /* keyboard */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') { e.preventDefault(); persist(); }
  });

  /* ------------------------------------------------------------------ boot */
  (async function boot() {
    await ensureAuth();
    const mq = window.matchMedia('(max-width:900px)');
    if (mq.matches) $('#sideOpen').style.display = 'grid';
    mq.addEventListener('change', (m) => { $('#sideOpen').style.display = m.matches ? 'grid' : 'none'; });

    if (sessionValid()) showApp();
    else setTimeout(() => $('#pw').focus(), 500);
  })();

  window.PERANS_ADMIN = { get state() { return S; }, persist: () => persist() };
})();
