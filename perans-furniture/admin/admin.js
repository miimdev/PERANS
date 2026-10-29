/* ==========================================================================
   PERANS — Executive Cloud Admin Command Center (Supabase PostgreSQL)
   ========================================================================== */
(function () {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const DB = window.PERANS_DB;

  const LS_TOKEN = 'perans_cloud_session_v1';
  const LS_THEME = 'perans_admin_theme_v1';
  const LS_SITE = 'perans_site_data';

  const BUILTIN_IMGS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'hero', 'look1', 'lounge', 'showroom'];
  const PRESET_COLORS = ['#123f34', '#c2a35c', '#efe7d8', '#5a3d2b', '#3a3733', '#b9b4ad', '#ddcbb0', '#274d3f'];

  const ORDER_STATUS = {
    new: { label: 'جدید (در انتظار تایید)', cls: 'a' },
    confirmed: { label: 'تأیید شده', cls: 'info' },
    processing: { label: 'در حال آماده‌سازی', cls: 'b' },
    sent: { label: 'ارسال شده', cls: 'g' },
    done: { label: 'تحویل شده', cls: 'g' },
    canceled: { label: 'لغو شده', cls: 'r' }
  };

  const MSG_STATUS = {
    unread: { label: 'خوانده‌نشده', cls: 'a' },
    in_progress: { label: 'در حال پیگیری', cls: 'info' },
    resolved: { label: 'پاسخ داده‌شده', cls: 'g' },
    archived: { label: 'بایگانی', cls: '' }
  };

  const TOPIC_MAP = {
    advice: 'مشاوره چیدمان',
    visit: 'بازدید حضوری',
    track: 'پیگیری سفارش',
    returns: 'مرجوعی و گارانتی',
    partner: 'همکاری و نمایندگی',
    newsletter: 'عضویت خبرنامه'
  };

  const PAY_MAP = {
    phone_consult: 'هماهنگی تلفنی کارشناس',
    showroom_visit: 'مراجعه حضوری نمایشگاه',
    installment_plan: 'درخواست شرایط اقساطی',
    installment: 'اقساطی (بدون سود)',
    cod: 'تسویه حضوری / هنگام تحویل',
    online: 'ثبت اینترنتی سایت'
  };

  const COLOR_MAP_FA = {
    '#123f34': 'سبز زمردی',
    '#274d3f': 'یشمی تیره',
    '#1d4c3d': 'سبز جنگلی',
    '#c2a35c': 'طلایی کهربایی',
    '#c9a85c': 'طلایی گرم',
    '#efe7d8': 'کرم عاجی',
    '#f3ece0': 'شیری روشن',
    '#ddcbb0': 'بژ شنی',
    '#d8c8b0': 'کرم شنی',
    '#5a3d2b': 'قهوه‌ای گردویی',
    '#6b4a35': 'فندقی',
    '#3a3733': 'ذغالی تیره',
    '#23201e': 'مشکی مات',
    '#b9b4ad': 'طوسی گرم',
    '#8e8a84': 'طوسی فیلی'
  };
  const colorNameFa = (hex, fallbackName) => {
    if (fallbackName && fallbackName.trim()) return fallbackName.trim();
    if (!hex) return '';
    return COLOR_MAP_FA[String(hex).trim().toLowerCase()] || String(hex).toUpperCase();
  };

  const VIEWS = {
    dash: ['داشبورد تحلیلی', 'نمای زنده سفارش‌ها، موجودی انبار و پیام‌های مشتریان از دیتابیس Supabase'],
    products: ['محصولات و انبار', 'مدیریت کاتالوگ، قیمت‌گذاری تکی و گروهی، موجودی و تصاویر'],
    orders: ['سفارش‌ها و فاکتور', 'بررسی سفارش‌های سایت، ارسال به بله، ثبت سفارش حضوری/تلفنی و چاپ فاکتور رسمی'],
    messages: ['پیام‌ها و مشاوره چیدمان', 'درخواست‌های مشاوره، رزرو بازدید و اعضای خبرنامه'],
    cats: ['دسته‌بندی‌ها', 'ساختار و ترتیب نمایش دسته‌های فروشگاه'],
    content: ['محتوا و ویترین سایت', 'ویرایش زنده تیترهای هیرو، کارت‌های معرفی، نوار اطلاعیه و برند'],
    commerce: ['تخفیف‌ها و ارسال', 'هزینه ارسال، سقف ارسال رایگان و مدیریت کدهای تخفیف'],
    media: ['کتابخانه رسانه ابری', 'آپلود با فشرده‌سازی خودکار WebP و مدیریت تصاویر محصولات در Supabase'],
    bale: ['ربات پیام‌رسان بله', 'ارسال خودکار عکس مبلمان، مشخصات سفارش و اطلاعات مشتری به بله مالک'],
    settings: ['تنظیمات و امنیت', 'شبکه‌های اجتماعی، وضعیت دیتابیس و تغییر نام کاربری یا رمز عبور'],
    audit: ['گزارش فعالیت و پشتیبان', 'لاگ عملیات مدیران در دیتابیس و پشتیبان‌گیری / بازگردانی ابری']
  };

  /* ------------------------------------------------------------------ State */
  let SESSION_TOKEN = null;
  let currentView = 'dash';
  let chartRangeDays = 7;

  // Product filters
  let pQuery = '';
  let pCat = 'all';
  let pFilter = 'all';
  let pSort = 'default';
  let pLayout = 'table';

  // Order & Message filters
  let oQuery = '';
  let oStatus = 'all';
  let mStatus = 'all';

  let STATE = {
    admin: { username: 'adminwwe', display_name: 'مدیر ارشد پرنس', role: 'superadmin' },
    config: {
      version: 3,
      brand: {},
      hero: {},
      stats: [],
      announce: [],
      commerce: { shipping: 1200000, threshold: 20000000, coupons: {} }
    },
    bot_settings: {
      bale_enabled: true,
      has_token: false,
      masked_token: '',
      bale_chat_id: '',
      bale_bot_username: '',
      bale_bot_name: '',
      notify_on_order: true,
      notify_on_message: true,
      site_base_url: 'https://miimdev.github.io/PERANS',
      last_test_at: null,
      last_error: null
    },
    categories: [{ id: 'all', name: 'همه محصولات' }],
    products: [],
    orders: [],
    messages: [],
    media: [],
    audit_logs: [],
    active_sessions: 1
  };

  /* ------------------------------------------------------------------ Helpers */
  const ICO = (n) => '<svg aria-hidden="true"><use href="#a-' + n + '"/></svg>';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const num = (n) => (isFinite(+n) ? Number(n).toLocaleString('fa-IR') : '۰');
  const money = (n) => num(n) + ' تومان';
  const toEn = (s) => String(s == null ? '' : s)
    .replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d))
    .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));

  function faDate(iso, withTime) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return withTime
      ? d.toLocaleDateString('fa-IR') + ' · ' + d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString('fa-IR');
  }

  function resolveImg(key) {
    if (!key) return '../images/p1.jpg';
    if (key.indexOf('media:') === 0) {
      const id = key.slice(6);
      const m = STATE.media.find((x) => x.id === id);
      if (m && m.data_url) return m.data_url;
      return '../images/p1.jpg';
    }
    if (/^(data:|https?:|\.\.?\/)/.test(key)) return key;
    if (key.indexOf('images/') === 0) return '../' + key;
    const ext = key === 'LOGO' ? 'PNG' : 'jpg';
    return '../images/' + key + '.' + ext;
  }

  function catName(id) {
    const c = STATE.categories.find((x) => x.id === id);
    return c ? c.name : id;
  }

  function toast(msg, kind = 'ok') {
    const box = $('#toasts');
    if (!box) return;
    const t = document.createElement('div');
    t.className = 'toast ' + kind;
    t.innerHTML = ICO(kind === 'err' ? 'x' : 'check') + '<span>' + esc(msg) + '</span>';
    box.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 350); }, 3100);
  }

  function saveLocalToken(token, expiresAt) {
    SESSION_TOKEN = token;
    try { localStorage.setItem(LS_TOKEN, JSON.stringify({ token, expiresAt })); } catch (e) {}
  }

  function readLocalToken() {
    try {
      const raw = JSON.parse(localStorage.getItem(LS_TOKEN) || 'null');
      if (!raw || !raw.token) return null;
      if (raw.expiresAt && new Date(raw.expiresAt).getTime() <= Date.now()) {
        localStorage.removeItem(LS_TOKEN);
        return null;
      }
      return raw.token;
    } catch (e) { return null; }
  }

  function clearLocalToken() {
    SESSION_TOKEN = null;
    try { localStorage.removeItem(LS_TOKEN); } catch (e) {}
  }

  /* همگام‌سازی فوری کش محلی مرورگر تا تب بازِ سایت در همین لحظه به‌روز شود */
  function broadcastStorefrontMirror() {
    try {
      const activeProducts = STATE.products
        .filter((p) => p.is_active !== false)
        .map((p) => ({
          id: p.id,
          name: p.name,
          cat: p.cat,
          img: p.resolvedImg || resolveImg(p.img).replace(/^\.\.\//, ''),
          price: +p.price || 0,
          old: p.old ? +p.old : null,
          stock: p.stock,
          rating: +p.rating || 4.8,
          reviews: +p.reviews || 0,
          badge: p.badge || null,
          badgeClass: p.badgeClass || '',
          colors: p.colors || [],
          tags: p.tags || [],
          specs: p.specs || {},
          desc: p.desc || ''
        }));

      const payload = {
        version: (STATE.config && STATE.config.version) || 3,
        updatedAt: new Date().toISOString(),
        brand: STATE.config.brand || {},
        hero: STATE.config.hero || {},
        stats: STATE.config.stats || [],
        announce: STATE.config.announce || [],
        commerce: STATE.config.commerce || {},
        categories: STATE.categories.map((c) => ({ id: c.id, name: c.name })),
        products: activeProducts
      };
      localStorage.setItem(LS_SITE, JSON.stringify(payload));
      new BroadcastChannel('perans-cms').postMessage({ type: 'save', at: Date.now() });
    } catch (e) {}
  }

  /* ------------------------------------------------------------------ Cloud Sync */
  function updateCloudIndicator() {
    const badge = $('#cloudBadge');
    const txt = $('#cloudText');
    if (!badge || !txt || !DB) return;
    if (DB.online) {
      badge.classList.remove('offline');
      txt.textContent = DB.latencyMs ? ('ابری · ' + num(DB.latencyMs) + 'ms') : 'متصل به Supabase';
    } else {
      badge.classList.add('offline');
      txt.textContent = 'عدم اتصال';
    }
  }
  if (DB) DB.onStatus(updateCloudIndicator);

  async function refreshFromCloud(silent) {
    if (!SESSION_TOKEN) return false;
    const syncBtn = $('#syncBtn');
    if (syncBtn) syncBtn.classList.add('spinning');
    try {
      const data = await DB.bootstrap(SESSION_TOKEN);
      STATE.admin = data.admin || STATE.admin;
      STATE.config = data.config || STATE.config;
      STATE.bot_settings = data.bot_settings || STATE.bot_settings;
      STATE.categories = Array.isArray(data.categories) && data.categories.length ? data.categories : STATE.categories;
      STATE.products = Array.isArray(data.products) ? data.products : [];
      STATE.orders = Array.isArray(data.orders) ? data.orders : [];
      STATE.messages = Array.isArray(data.messages) ? data.messages : [];
      STATE.media = Array.isArray(data.media) ? data.media : [];
      STATE.audit_logs = Array.isArray(data.audit_logs) ? data.audit_logs : [];
      STATE.active_sessions = data.active_sessions || 1;

      updateAdminSidebar();
      broadcastStorefrontMirror();
      render();
      if (!silent) toast('اطلاعات با دیتابیس Supabase همگام‌سازی شد');
      return true;
    } catch (err) {
      if (err && (err.code === '42501' || /نشست/.test(err.message))) {
        clearLocalToken();
        toast('نشست شما منقضی شده است؛ دوباره وارد شوید.', 'err');
        setTimeout(() => location.reload(), 900);
        return false;
      }
      if (!silent) toast(err.message || 'خطا در ارتباط با دیتابیس', 'err');
      return false;
    } finally {
      if (syncBtn) syncBtn.classList.remove('spinning');
      updateCloudIndicator();
    }
  }

  function updateAdminSidebar() {
    const a = STATE.admin || {};
    const dName = a.display_name || 'مدیر ارشد پرنس';
    $('#adminDisplayName').textContent = dName;
    $('#adminUsername').textContent = '@' + (a.username || 'adminwwe');
    $('#adminAvatar').textContent = dName.trim().charAt(0) || 'پ';
  }

  function updateNavBadges() {
    const newOrders = STATE.orders.filter((o) => o.status === 'new').length;
    const unreadMsgs = STATE.messages.filter((m) => m.status === 'unread').length;
    $('#navProducts').textContent = num(STATE.products.length);
    $('#navOrders').textContent = num(newOrders || STATE.orders.length);
    $('#navOrders').classList.toggle('nav__badge--alert', newOrders > 0);
    $('#navMessages').textContent = num(unreadMsgs);
    $('#navMedia').textContent = num(STATE.media.length + BUILTIN_IMGS.length);
    const nb = $('#navBale');
    if (nb) {
      const ready = !!(STATE.bot_settings && STATE.bot_settings.bale_enabled && STATE.bot_settings.has_token && STATE.bot_settings.bale_chat_id);
      nb.textContent = ready ? 'فعال' : 'تنظیم';
      nb.className = 'nav__badge ' + (ready ? '' : 'nav__badge--gold');
    }
  }

  /* ------------------------------------------------------------------ Navigation */
  function go(view) {
    if (!VIEWS[view]) view = 'dash';
    currentView = view;
    $$('.nav__item').forEach((b) => b.classList.toggle('on', b.dataset.view === view));
    $$('.view').forEach((v) => v.classList.toggle('on', v.id === 'view-' + view));
    $('#pageTitle').textContent = VIEWS[view][0];
    $('#pageSub').textContent = VIEWS[view][1];
    closeSide();
    render();
  }

  function render() {
    updateNavBadges();
    const map = {
      dash: renderDash,
      products: renderProducts,
      orders: renderOrders,
      messages: renderMessages,
      cats: renderCats,
      content: renderContent,
      commerce: renderCommerce,
      media: renderMedia,
      bale: renderBale,
      settings: renderSettings,
      audit: renderAudit
    };
    if (map[currentView]) map[currentView]();
  }

  /* ------------------------------------------------------------------ 1. Dashboard */
  function renderDash() {
    const validOrders = STATE.orders.filter((o) => o.status !== 'canceled');
    const totalRevenue = validOrders.reduce((s, o) => s + (+o.total || 0), 0);
    const avgOrder = validOrders.length ? Math.round(totalRevenue / validOrders.length) : 0;
    const pendingOrders = STATE.orders.filter((o) => o.status === 'new' || o.status === 'confirmed' || o.status === 'processing').length;
    const activeProds = STATE.products.filter((p) => p.is_active !== false).length;
    const lowStock = STATE.products.filter((p) => (+p.stock || 0) <= 3).length;
    const unreadMsgs = STATE.messages.filter((m) => m.status === 'unread').length;

    // Chart data
    const days = [];
    for (let i = chartRangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const dayOrders = validOrders.filter((o) => String(o.created_at || '').slice(0, 10) === key);
      const rev = dayOrders.reduce((s, o) => s + (+o.total || 0), 0);
      days.push({
        label: chartRangeDays <= 7
          ? d.toLocaleDateString('fa-IR', { weekday: 'short' })
          : d.toLocaleDateString('fa-IR', { day: 'numeric', month: 'numeric' }),
        count: dayOrders.length,
        rev
      });
    }
    const maxRev = Math.max(1, ...days.map((d) => d.rev));
    const displayDays = chartRangeDays > 14 ? days.filter((_, idx) => idx % 2 === 0 || idx === days.length - 1) : days;

    // Status funnel
    const totalOrdCount = Math.max(1, STATE.orders.length);
    const statusFunnel = Object.entries(ORDER_STATUS).map(([k, meta]) => {
      const cnt = STATE.orders.filter((o) => o.status === k).length;
      const pct = Math.round((cnt / totalOrdCount) * 100);
      return '<div class="funnel-row">' +
        '<div class="funnel-row__top"><span>' + esc(meta.label) + '</span><b>' + num(cnt) + ' (' + num(pct) + '٪)</b></div>' +
        '<div class="funnel-track"><div class="funnel-fill" style="width:' + Math.max(cnt ? 6 : 0, pct) + '%"></div></div>' +
      '</div>';
    }).join('');

    const recentOrders = STATE.orders.slice(0, 5);
    const recentMsgs = STATE.messages.slice(0, 4);

    const todayStr = new Date().toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    $('#view-dash').innerHTML =
      '<div class="hero-strip">' +
        '<div>' +
          '<h3>خوش آمدید، ' + esc(STATE.admin.display_name || 'مدیر پرنس') + ' 👋</h3>' +
          '<p>امروز ' + esc(todayStr) + ' · تمام داده‌ها به‌صورت زنده به دیتابیس ابری <b>Supabase</b> متصل هستند.</p>' +
        '</div>' +
        '<div class="hero-strip__acts">' +
          '<button class="btn btn--gold btn--sm" data-act="new-product">' + ICO('plus') + ' محصول جدید</button>' +
          '<button class="btn btn--dark btn--sm" data-act="new-order-modal">' + ICO('cart') + ' ثبت سفارش حضوری/تلفنی</button>' +
          '<button class="btn btn--ghost btn--sm" data-goto="bale">' + ICO('send') + ' ' + ((STATE.bot_settings && STATE.bot_settings.has_token && STATE.bot_settings.bale_chat_id) ? 'ربات بله (فعال)' : 'اتصال ربات بله') + '</button>' +
          '<button class="btn btn--ghost btn--sm" data-act="bulk-modal">' + ICO('percent') + ' تغییر گروهی قیمت‌ها</button>' +
        '</div>' +
      '</div>' +

      '<div class="kpis">' +
        kpiCard('tag', 'gold', num(Math.round(totalRevenue / 1000000)) + ' م.ت', 'مجموع فروش خالص', 'میانگین سبد: ' + num(Math.round(avgOrder / 1000000)) + ' م.ت') +
        kpiCard('cart', 'green', num(STATE.orders.length), 'کل سفارش‌های ثبت‌شده', pendingOrders ? (num(pendingOrders) + ' در انتظار اقدام') : 'همه تکمیل شده') +
        kpiCard('box', 'amber', num(activeProds) + ' / ' + num(STATE.products.length), 'محصولات فعال در ویترین', lowStock ? (num(lowStock) + ' کالا کم‌موجود') : 'موجودی انبار کامل') +
        kpiCard('msg', 'blue', num(STATE.messages.length), 'درخواست مشاوره و خبرنامه', unreadMsgs ? (num(unreadMsgs) + ' پیام خوانده‌نشده') : 'بدون پیام جدید') +
      '</div>' +

      '<div class="grid-2">' +
        '<div class="card">' +
          '<div class="card__head">' +
            '<div><h3>روند فروش و سفارش‌ها</h3><p>بر اساس مبالغ ثبت‌شده در دیتابیس (میلیون تومان)</p></div>' +
            '<div class="sp">' +
              '<button class="btn ' + (chartRangeDays === 7 ? 'btn--gold' : 'btn--ghost') + ' btn--sm" data-act="chart-range" data-days="7">۷ روز</button>' +
              '<button class="btn ' + (chartRangeDays === 30 ? 'btn--gold' : 'btn--ghost') + ' btn--sm" data-act="chart-range" data-days="30">۳۰ روز</button>' +
            '</div>' +
          '</div>' +
          '<div class="card__body">' +
            '<div class="chart">' +
              displayDays.map((d) =>
                '<div class="chart__col" title="' + num(d.count) + ' سفارش · ' + money(d.rev) + '">' +
                  '<b>' + (d.rev ? num(Math.round(d.rev / 1000000)) : '') + '</b>' +
                  '<div class="chart__bar" style="height:' + Math.max(5, Math.round((d.rev / maxRev) * 100)) + '%"></div>' +
                  '<small>' + esc(d.label) + '</small>' +
                '</div>'
              ).join('') +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card__head"><div><h3>قیف وضعیت سفارش‌ها</h3><p>تفکیک لحظه‌ای سفارش‌ها</p></div></div>' +
          '<div class="card__body"><div class="funnel-list">' + statusFunnel + '</div></div>' +
        '</div>' +
      '</div>' +

      '<div class="grid-equal">' +
        '<div class="card">' +
          '<div class="card__head"><div><h3>آخرین سفارش‌ها</h3><p>۵ سفارش اخیر مشتریان</p></div>' +
            '<div class="sp"><button class="btn btn--ghost btn--sm" data-goto="orders">همه سفارش‌ها</button></div></div>' +
          (recentOrders.length ? renderOrdersTableHTML(recentOrders, true) : '<div class="empty">' + ICO('cart') + '<div>هنوز سفارشی ثبت نشده است.</div></div>') +
        '</div>' +

        '<div class="card">' +
          '<div class="card__head"><div><h3>آخرین پیام‌ها و درخواست‌های مشاوره</h3><p>ارسال‌شده از فرم تماس و خبرنامه</p></div>' +
            '<div class="sp"><button class="btn btn--ghost btn--sm" data-goto="messages">صندوق پیام‌ها</button></div></div>' +
          '<div class="card__body" style="display:grid;gap:10px">' +
            (recentMsgs.length ? recentMsgs.map((m) => {
              const st = MSG_STATUS[m.status] || MSG_STATUS.unread;
              return '<div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;padding:11px 13px;border-radius:13px;background:var(--surface-2);border:1px solid var(--line-soft)">' +
                '<div style="min-width:0">' +
                  '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap"><b>' + esc(m.name || m.email || 'کاربر خبرنامه') + '</b><span class="tag info">' + esc(TOPIC_MAP[m.topic] || m.topic) + '</span></div>' +
                  '<div class="muted" style="font-size:11.5px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:340px">' + esc(m.message || m.phone || m.email || '') + '</div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:6px;flex:none">' +
                  '<span class="tag ' + st.cls + '">' + st.label + '</span>' +
                  '<button class="mini" data-act="view-msg" data-id="' + esc(m.id) + '" title="مشاهده">' + ICO('eye') + '</button>' +
                '</div>' +
              '</div>';
            }).join('') : '<div class="empty">پیامی ثبت نشده است.</div>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function kpiCard(ico, cls, val, lbl, sub) {
    return '<div class="kpi k-' + cls + '">' +
      '<div class="kpi__top"><span class="kpi__ico">' + ICO(ico) + '</span><i class="trend">' + esc(sub) + '</i></div>' +
      '<b class="num">' + esc(val) + '</b>' +
      '<span class="lbl">' + esc(lbl) + '</span>' +
    '</div>';
  }

  /* ------------------------------------------------------------------ 2. Products & Inventory */
  function filteredProducts() {
    let list = STATE.products.filter((p) => {
      const q = pQuery.trim().toLowerCase();
      const okQ = !q || (p.name + ' ' + p.id + ' ' + (p.tags || []).join(' ')).toLowerCase().includes(q);
      const okC = pCat === 'all' || p.cat === pCat;
      let okF = true;
      if (pFilter === 'active') okF = p.is_active !== false;
      else if (pFilter === 'hidden') okF = p.is_active === false;
      else if (pFilter === 'low') okF = (+p.stock || 0) <= 3;
      else if (pFilter === 'sale') okF = !!(p.old && +p.old > +p.price);
      return okQ && okC && okF;
    });

    if (pSort === 'expensive') list.sort((a, b) => (+b.price || 0) - (+a.price || 0));
    else if (pSort === 'cheap') list.sort((a, b) => (+a.price || 0) - (+b.price || 0));
    else if (pSort === 'stock') list.sort((a, b) => (+a.stock || 0) - (+b.stock || 0));
    return list;
  }

  function renderProducts() {
    const list = filteredProducts();

    const bodyHTML = !list.length
      ? '<div class="card"><div class="empty">' + ICO('box') + '<div>محصولی با این فیلتر یافت نشد.</div></div></div>'
      : pLayout === 'grid'
        ? '<div class="pgrid">' + list.map((p) => {
            const off = p.old && +p.old > +p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
            return '<div class="pcard ' + (p.is_active === false ? 'is-hidden' : '') + '">' +
              '<div class="pcard__media">' +
                '<img src="' + esc(resolveImg(p.resolvedImg || p.img)) + '" alt="">' +
                '<div class="pcard__badges">' +
                  '<span class="tag b">' + esc(catName(p.cat)) + '</span>' +
                  (off ? '<span class="tag r">' + num(off) + '٪ تخفیف</span>' : '') +
                '</div>' +
              '</div>' +
              '<div class="pcard__body">' +
                '<b>' + esc(p.name) + '</b>' +
                '<div class="pcard__price">' + money(p.price) + '</div>' +
                '<div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--muted)">' +
                  '<span>کد: ' + esc(p.id) + '</span>' +
                  '<span>موجودی: <b>' + num(p.stock != null ? p.stock : 0) + '</b></span>' +
                '</div>' +
              '</div>' +
              '<div class="pcard__foot">' +
                '<label class="switch" title="نمایش در سایت"><input type="checkbox" data-act="toggle-prod-active" data-id="' + esc(p.id) + '"' + (p.is_active !== false ? ' checked' : '') + '><i></i></label>' +
                '<div class="rowact">' +
                  '<button class="mini" data-act="edit-product" data-id="' + esc(p.id) + '" title="ویرایش">' + ICO('edit') + '</button>' +
                  '<button class="mini" data-act="dup-product" data-id="' + esc(p.id) + '" title="کپی">' + ICO('copy') + '</button>' +
                  '<button class="mini del" data-act="del-product" data-id="' + esc(p.id) + '" title="حذف">' + ICO('trash') + '</button>' +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('') + '</div>'
        : '<div class="card tablewrap"><table><thead><tr>' +
            '<th>محصول</th><th>دسته‌بندی</th><th>قیمت فروش</th><th>تخفیف</th><th>موجودی انبار</th><th>برچسب</th><th>وضعیت نمایش</th><th>عملیات</th>' +
          '</tr></thead><tbody>' +
            list.map((p) => {
              const off = p.old && +p.old > +p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
              const st = +p.stock || 0;
              const stockBadge = st === 0 ? '<span class="tag r">ناموجود (۰)</span>' : st <= 3 ? '<span class="tag a">کم‌موجود (' + num(st) + ')</span>' : '<span class="tag g">' + num(st) + ' عدد</span>';
              return '<tr>' +
                '<td><div class="cellpro"><img class="thumb" src="' + esc(resolveImg(p.resolvedImg || p.img)) + '" alt=""><div><b>' + esc(p.name) + '</b><small dir="ltr">' + esc(p.id) + '</small></div></div></td>' +
                '<td><span class="tag b">' + esc(catName(p.cat)) + '</span></td>' +
                '<td><b>' + num(p.price) + '</b> <small class="muted">تومان</small>' + (p.old ? '<div class="muted" style="font-size:10.5px;text-decoration:line-through">' + num(p.old) + '</div>' : '') + '</td>' +
                '<td>' + (off ? '<span class="tag r">' + num(off) + '٪</span>' : '<span class="muted">—</span>') + '</td>' +
                '<td>' + stockBadge + '</td>' +
                '<td>' + (p.badge ? '<span class="tag ' + (p.badgeClass === 'sale' ? 'r' : p.badgeClass === 'new' ? 'g' : 'b') + '">' + esc(p.badge) + '</span>' : '<span class="muted">—</span>') + '</td>' +
                '<td><label class="switch" title="فعال/مخفی در سایت"><input type="checkbox" data-act="toggle-prod-active" data-id="' + esc(p.id) + '"' + (p.is_active !== false ? ' checked' : '') + '><i></i></label></td>' +
                '<td><div class="rowact">' +
                  '<button class="mini" data-act="edit-product" data-id="' + esc(p.id) + '" title="ویرایش">' + ICO('edit') + '</button>' +
                  '<button class="mini" data-act="dup-product" data-id="' + esc(p.id) + '" title="کپی محصول">' + ICO('copy') + '</button>' +
                  '<button class="mini del" data-act="del-product" data-id="' + esc(p.id) + '" title="حذف">' + ICO('trash') + '</button>' +
                '</div></td>' +
              '</tr>';
            }).join('') +
          '</tbody></table></div>';

    $('#view-products').innerHTML =
      '<div class="toolbar">' +
        '<div class="search">' + ICO('search') + '<input id="pSearch" placeholder="جستجوی نام، شناسه یا تگ محصول…" value="' + esc(pQuery) + '"></div>' +
        '<select id="pCat"><option value="all">همه دسته‌ها</option>' +
          STATE.categories.filter((c) => c.id !== 'all').map((c) => '<option value="' + esc(c.id) + '"' + (pCat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') +
        '</select>' +
        '<select id="pFilter">' +
          '<option value="all"' + (pFilter === 'all' ? ' selected' : '') + '>همه وضعیت‌ها</option>' +
          '<option value="active"' + (pFilter === 'active' ? ' selected' : '') + '>فعال در سایت</option>' +
          '<option value="hidden"' + (pFilter === 'hidden' ? ' selected' : '') + '>مخفی‌شده</option>' +
          '<option value="low"' + (pFilter === 'low' ? ' selected' : '') + '>کم‌موجود (≤۳)</option>' +
          '<option value="sale"' + (pFilter === 'sale' ? ' selected' : '') + '>دارای تخفیف</option>' +
        '</select>' +
        '<select id="pSort">' +
          '<option value="default"' + (pSort === 'default' ? ' selected' : '') + '>ترتیب پیش‌فرض</option>' +
          '<option value="expensive"' + (pSort === 'expensive' ? ' selected' : '') + '>گران‌ترین</option>' +
          '<option value="cheap"' + (pSort === 'cheap' ? ' selected' : '') + '>ارزان‌ترین</option>' +
          '<option value="stock"' + (pSort === 'stock' ? ' selected' : '') + '>کم‌ترین موجودی</option>' +
        '</select>' +
        '<button class="iconbtn" data-act="toggle-p-layout" title="تغییر نمای جدول / گالری">' + ICO(pLayout === 'grid' ? 'list' : 'grid') + '</button>' +
        '<button class="btn btn--ghost" data-act="bulk-modal">' + ICO('percent') + ' عملیات گروهی</button>' +
        '<button class="btn btn--gold" data-act="new-product">' + ICO('plus') + ' محصول جدید</button>' +
      '</div>' +
      bodyHTML;

    $('#pSearch').addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      pQuery = e.target.value;
      renderProducts();
      const inp = $('#pSearch');
      if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (err) {} }
    });
    $('#pCat').addEventListener('change', (e) => { pCat = e.target.value; renderProducts(); });
    $('#pFilter').addEventListener('change', (e) => { pFilter = e.target.value; renderProducts(); });
    $('#pSort').addEventListener('change', (e) => { pSort = e.target.value; renderProducts(); });
  }

  function openProductModal(id) {
    const isNew = !id;
    const base = isNew
      ? {
          id: 'model-' + Math.random().toString(36).slice(2, 6),
          name: '',
          cat: (STATE.categories.find((c) => c.id !== 'all') || { id: 'modern' }).id,
          img: 'p1',
          price: 45000000,
          old: null,
          stock: 6,
          is_active: true,
          is_featured: false,
          rating: 4.8,
          reviews: 12,
          badge: '',
          badgeClass: '',
          colors: ['#123f34', '#efe7d8'],
          tags: [],
          specs: { 'ابعاد': '', 'جنس بدنه': '', 'پارچه': '', 'ضمانت': '۵ سال', 'زمان ارسال': '۲ تا ۴ روز کاری' },
          desc: ''
        }
      : JSON.parse(JSON.stringify(STATE.products.find((x) => x.id === id)));

    let selectedImg = base.img || 'p1';
    let colors = Array.isArray(base.colors) ? base.colors.slice() : [];

    const allMediaChoices = [
      ...STATE.media.map((m) => ({ key: 'media:' + m.id, src: m.data_url, label: m.title || 'آپلودی' })),
      ...BUILTIN_IMGS.map((k) => ({ key: k, src: resolveImg(k), label: k }))
    ];

    const specsHTML = Object.entries(base.specs || {}).map(([k, v]) =>
      '<div class="specrow" style="display:grid;grid-template-columns:1fr 1.5fr auto;gap:8px;margin-bottom:8px">' +
        '<input data-spec-k placeholder="ویژگی (مثلاً ابعاد)" value="' + esc(k) + '">' +
        '<input data-spec-v placeholder="مقدار" value="' + esc(v) + '">' +
        '<button class="mini del" type="button" data-act="del-spec">' + ICO('trash') + '</button>' +
      '</div>'
    ).join('');

    openModal(
      '<div class="modal__head">' +
        '<div><h3>' + (isNew ? 'افزودن محصول جدید به کاتالوگ ابری' : 'ویرایش محصول: ' + esc(base.name)) + '</h3>' +
        '<p class="muted" style="margin:2px 0 0;font-size:11.5px">ذخیره مستقیم در جدول <code>perans_products</code> سوپابیس</p></div>' +
        '<button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button>' +
      '</div>' +
      '<div class="modal__body">' +
        '<div class="formgrid">' +
          fieldHTML('نام محصول *', '<input data-k="name" value="' + esc(base.name) + '" placeholder="مثلاً مبل راحتی رویال زمردی">') +
          fieldHTML('شناسه یکتا (انگلیسی)', '<input data-k="id" dir="ltr" value="' + esc(base.id) + '"' + (isNew ? '' : ' disabled') + '>') +
          fieldHTML('دسته‌بندی', '<select data-k="cat">' + STATE.categories.filter((c) => c.id !== 'all').map((c) => '<option value="' + esc(c.id) + '"' + (base.cat === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>').join('') + '</select>') +
          fieldHTML('موجودی انبار (عدد)', '<input data-k="stock" type="number" min="0" value="' + (+base.stock || 0) + '">') +
          fieldHTML('قیمت فروش (تومان) *', '<input data-k="price" id="pmPrice" type="number" step="100000" value="' + (+base.price || 0) + '"><small id="pmPriceFa">' + money(base.price || 0) + '</small>') +
          fieldHTML('قیمت قبل از تخفیف (اختیاری)', '<input data-k="old" id="pmOld" type="number" step="100000" value="' + (base.old || '') + '" placeholder="خالی = بدون تخفیف"><small id="pmOffFa">—</small>') +
          fieldHTML('برچسب روی کارت', '<input data-k="badge" value="' + esc(base.badge || '') + '" placeholder="مثلاً پرفروش، جدید، ویژه">') +
          fieldHTML('رنگ برچسب', '<select data-k="badgeClass"><option value=""' + (!base.badgeClass ? ' selected' : '') + '>طلایی کلاسیک</option><option value="sale"' + (base.badgeClass === 'sale' ? ' selected' : '') + '>قرمز (حراج / تخفیف)</option><option value="new"' + (base.badgeClass === 'new' ? ' selected' : '') + '>سبز زمردی (جدید)</option></select>') +
          fieldHTML('امتیاز (۰ تا ۵)', '<input data-k="rating" type="number" step="0.1" min="0" max="5" value="' + (+base.rating || 4.8) + '">') +
          fieldHTML('تعداد دیدگاه', '<input data-k="reviews" type="number" min="0" value="' + (+base.reviews || 0) + '">') +

          '<div class="f full">' +
            '<div style="display:flex;gap:18px;flex-wrap:wrap;padding:10px 14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-soft)">' +
              '<label style="display:flex;align-items:center;gap:10px;cursor:pointer"><span class="switch"><input type="checkbox" data-k="is_active"' + (base.is_active !== false ? ' checked' : '') + '><i></i></span><b style="font-size:12.5px">نمایش فعال در وب‌سایت</b></label>' +
              '<label style="display:flex;align-items:center;gap:10px;cursor:pointer"><span class="switch"><input type="checkbox" data-k="is_featured"' + (base.is_featured ? ' checked' : '') + '><i></i></span><b style="font-size:12.5px">محصول منتخب ویترین اول</b></label>' +
            '</div>' +
          '</div>' +

          '<div class="f full">' +
            '<label><span>تصویر محصول</span><button type="button" class="btn btn--ghost btn--sm" id="pmUploadBtn">' + ICO('up') + ' آپلود تصویر جدید به ابر</button></label>' +
            '<input type="file" id="pmFileInp" accept="image/*" style="display:none">' +
            '<div class="img-picker-grid" id="pmImgGrid">' +
              allMediaChoices.map((it) =>
                '<div class="img-pick-item ' + (selectedImg === it.key ? 'on' : '') + '" data-img-key="' + esc(it.key) + '">' +
                  '<img src="' + esc(it.src) + '" alt=""><span>' + esc(it.label) + '</span>' +
                '</div>'
              ).join('') +
            '</div>' +
          '</div>' +

          '<div class="f full">' +
            '<label><span>رنگ‌بندی قابل سفارش</span></label>' +
            '<div class="swatch-list" id="pmSwatches"></div>' +
            '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px">' +
              '<input type="color" id="pmColorPick" value="#123f34" style="width:42px;height:34px;padding:2px;cursor:pointer">' +
              '<button type="button" class="btn btn--ghost btn--sm" id="pmAddColor">' + ICO('plus') + ' افزودن رنگ انتخابی</button>' +
              '<span class="muted" style="font-size:11px">یا انتخاب سریع:</span>' +
              PRESET_COLORS.map((hex) => '<button type="button" data-preset-color="' + hex + '" title="' + hex + '" style="width:22px;height:22px;border-radius:50%;border:1.5px solid rgba(255,255,255,.35);background:' + hex + ';cursor:pointer"></button>').join('') +
            '</div>' +
          '</div>' +

          fieldHTML('تگ‌های کلیدی (با ویرگول جدا کنید)', '<input data-k="tags" value="' + esc((base.tags || []).join('، ')) + '" placeholder="مخمل ضدلکه، پایه برنج، ۳ نفره">', 'full') +
          fieldHTML('توضیحات کامل محصول', '<textarea data-k="desc">' + esc(base.desc || '') + '</textarea>', 'full') +

          '<div class="full"><div class="hr"></div>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
              '<b style="font-size:13px">جدول مشخصات فنی</b>' +
              '<button class="btn btn--ghost btn--sm" type="button" data-act="add-spec">' + ICO('plus') + ' افزودن ویژگی</button>' +
            '</div>' +
            '<div id="specs">' + specsHTML + '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal__foot">' +
        '<button class="btn btn--ghost" data-close>انصراف</button>' +
        '<button class="btn btn--gold" id="pmSaveBtn">' + ICO('save') + ' ذخیره در دیتابیس ابری</button>' +
      '</div>'
    );

    const drawSwatches = () => {
      $('#pmSwatches').innerHTML = colors.length
        ? colors.map((c, idx) => '<span class="swatch-chip"><i style="background:' + esc(c) + '"></i>' + esc(c) + '<button type="button" data-rm-color="' + idx + '">×</button></span>').join('')
        : '<span class="muted" style="font-size:11.5px">رنگی ثبت نشده است.</span>';
    };
    drawSwatches();

    const updatePriceHelper = () => {
      const pr = +$('#pmPrice').value || 0;
      const ol = +$('#pmOld').value || 0;
      $('#pmPriceFa').textContent = money(pr);
      $('#pmOffFa').textContent = ol > pr && pr > 0 ? ('تخفیف محاسبه‌شده: ' + num(Math.round((1 - pr / ol) * 100)) + '٪') : 'بدون تخفیف';
    };
    updatePriceHelper();
    $('#pmPrice').addEventListener('input', updatePriceHelper);
    $('#pmOld').addEventListener('input', updatePriceHelper);

    $('#modalBox').addEventListener('click', (ev) => {
      const pick = ev.target.closest('[data-img-key]');
      if (pick) {
        selectedImg = pick.dataset.imgKey;
        $$('#pmImgGrid .img-pick-item').forEach((el) => el.classList.toggle('on', el.dataset.imgKey === selectedImg));
      }
      const preset = ev.target.closest('[data-preset-color]');
      if (preset && !colors.includes(preset.dataset.presetColor)) {
        colors.push(preset.dataset.presetColor);
        drawSwatches();
      }
      const rm = ev.target.closest('[data-rm-color]');
      if (rm) {
        colors.splice(+rm.dataset.rmColor, 1);
        drawSwatches();
      }
    });

    $('#pmAddColor').addEventListener('click', () => {
      const hex = $('#pmColorPick').value;
      if (hex && !colors.includes(hex)) { colors.push(hex); drawSwatches(); }
    });

    $('#pmUploadBtn').addEventListener('click', () => $('#pmFileInp').click());
    $('#pmFileInp').addEventListener('change', async (ev) => {
      const file = ev.target.files && ev.target.files[0];
      if (!file) return;
      $('#pmUploadBtn').disabled = true;
      $('#pmUploadBtn').textContent = 'در حال فشرده‌سازی و آپلود…';
      try {
        const compressed = await DB.compressImageFile(file);
        const saved = await DB.uploadMedia(SESSION_TOKEN, compressed);
        STATE.media.unshift(saved);
        selectedImg = 'media:' + saved.id;
        const div = document.createElement('div');
        div.className = 'img-pick-item on';
        div.dataset.imgKey = selectedImg;
        div.innerHTML = '<img src="' + esc(saved.data_url) + '" alt=""><span>' + esc(saved.title) + '</span>';
        $$('#pmImgGrid .img-pick-item').forEach((el) => el.classList.remove('on'));
        $('#pmImgGrid').prepend(div);
        toast('تصویر با موفقیت در فضای ابری ذخیره شد');
      } catch (err) {
        toast(err.message || 'خطا در آپلود تصویر', 'err');
      } finally {
        $('#pmUploadBtn').disabled = false;
        $('#pmUploadBtn').innerHTML = ICO('up') + ' آپلود تصویر جدید به ابر';
      }
    });

    $('#pmSaveBtn').addEventListener('click', async () => {
      const box = $('#modalBox');
      const getVal = (k) => { const el = box.querySelector('[data-k="' + k + '"]'); return el ? el.value : ''; };
      const specs = {};
      $$('#specs .specrow', box).forEach((r) => {
        const k = r.querySelector('[data-spec-k]').value.trim();
        const v = r.querySelector('[data-spec-v]').value.trim();
        if (k) specs[k] = v;
      });
      const cleanId = toEn(getVal('id')).trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-') || base.id;
      const productPayload = {
        id: isNew ? cleanId : base.id,
        name: getVal('name').trim() || 'محصول جدید',
        cat: getVal('cat'),
        img: selectedImg,
        price: +getVal('price') || 0,
        old: +getVal('old') > 0 ? +getVal('old') : null,
        stock: Math.max(0, +getVal('stock') || 0),
        is_active: !!box.querySelector('[data-k="is_active"]').checked,
        is_featured: !!box.querySelector('[data-k="is_featured"]').checked,
        rating: +getVal('rating') || 4.8,
        reviews: +getVal('reviews') || 0,
        badge: getVal('badge').trim(),
        badgeClass: getVal('badgeClass'),
        colors,
        tags: getVal('tags').split(/[,،]/).map((s) => s.trim()).filter(Boolean),
        specs,
        desc: getVal('desc').trim(),
        sort_order: base.sort_order || 0
      };

      const btn = $('#pmSaveBtn');
      btn.disabled = true;
      btn.textContent = 'در حال ذخیره در Supabase…';
      try {
        await DB.upsertProduct(SESSION_TOKEN, productPayload);
        closeModal();
        await refreshFromCloud(true);
        toast('محصول در دیتابیس ابری ذخیره و در سایت منتشر شد');
      } catch (err) {
        btn.disabled = false;
        btn.innerHTML = ICO('save') + ' ذخیره در دیتابیس ابری';
        toast(err.message || 'خطا در ذخیره محصول', 'err');
      }
    });
  }

  function openBulkModal() {
    openModal(
      '<div class="modal__head"><div><h3>عملیات گروهی قیمت و موجودی انبار</h3><p class="muted" style="margin:2px 0 0;font-size:11.5px">اعمال مستقیم روی دیتابیس با رند شدن خودکار قیمت‌ها به ۱۰۰ هزار تومان</p></div>' +
        '<button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button></div>' +
      '<div class="modal__body"><div class="formgrid">' +
        fieldHTML('انتخاب دسته هدف', '<select id="bkCat"><option value="all">همه محصولات سایت</option>' + STATE.categories.filter((c) => c.id !== 'all').map((c) => '<option value="' + esc(c.id) + '">' + esc(c.name) + '</option>').join('') + '</select>', 'full') +
        fieldHTML('نوع عملیات', '<select id="bkAct"><option value="price_percent">افزایش / کاهش درصدی قیمت‌ها (مثلاً +10 یا -5)</option><option value="restock">تنظیم موجودی انبار روی عدد مشخص</option><option value="activate_all">فعال‌سازی نمایش همه محصولات دسته</option></select>', 'full') +
        fieldHTML('مقدار (درصد یا تعداد موجودی)', '<input id="bkVal" type="number" step="1" value="10" placeholder="مثلاً 10 برای ۱۰٪ افزایش یا -10 برای ۱۰٪ کاهش">', 'full') +
      '</div></div>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-close>انصراف</button>' +
        '<button class="btn btn--gold" id="bkRunBtn">' + ICO('bolt') + ' اجرای عملیات در دیتابیس</button></div>'
    );

    $('#bkRunBtn').addEventListener('click', async () => {
      const act = $('#bkAct').value;
      const cat = $('#bkCat').value;
      const val = +$('#bkVal').value || 0;
      const btn = $('#bkRunBtn');
      btn.disabled = true; btn.textContent = 'در حال اعمال…';
      try {
        const res = await DB.bulkProducts(SESSION_TOKEN, act, cat, val);
        closeModal();
        await refreshFromCloud(true);
        toast('عملیات گروهی روی ' + num(res.affected || 0) + ' محصول اعمال شد');
      } catch (err) {
        btn.disabled = false; btn.textContent = 'اجرای عملیات در دیتابیس';
        toast(err.message || 'خطا در عملیات گروهی', 'err');
      }
    });
  }

  /* ------------------------------------------------------------------ 3. Orders & Invoice */
  function renderOrdersTableHTML(list, compact) {
    return '<div class="tablewrap"><table><thead><tr>' +
      '<th>کد پیگیری</th><th>مشتری</th><th>اقلام</th><th>مبلغ سفارش</th><th>نحوه هماهنگی</th>' + (compact ? '' : '<th>بله</th>') + '<th>تاریخ</th><th>وضعیت</th>' + (compact ? '' : '<th>عملیات</th>') +
    '</tr></thead><tbody>' +
      list.map((o) => {
        const st = ORDER_STATUS[o.status] || ORDER_STATUS.new;
        const itemsCount = Array.isArray(o.items) ? o.items.reduce((s, i) => s + (+i.qty || 1), 0) : 0;
        const bBadge = o.bale_notified_at
          ? '<span class="tag g" title="ارسال شده به پیام‌رسان بله">ارسال شد</span>'
          : o.bale_notify_status === 'failed'
            ? '<span class="tag r" title="' + esc(o.bale_notify_error || '') + '">خطا</span>'
            : '<span class="tag">ارسال نشده</span>';
        return '<tr>' +
          '<td><b dir="ltr">' + esc(o.order_code) + '</b></td>' +
          '<td><div class="cellpro"><div><b>' + esc(o.customer_name) + '</b><small>' + esc(o.customer_phone) + ' · ' + esc(o.city || '') + '</small></div></div></td>' +
          '<td>' + num(itemsCount) + ' قلم</td>' +
          '<td><b>' + money(o.total || 0) + '</b></td>' +
          '<td><span class="tag">' + esc(PAY_MAP[o.payment_method] || o.payment_method) + '</span></td>' +
          (compact ? '' : '<td>' + bBadge + '</td>') +
          '<td class="muted" style="font-size:11.5px">' + esc(faDate(o.created_at, true)) + '</td>' +
          '<td>' + (compact
            ? '<span class="tag ' + st.cls + '">' + esc(st.label) + '</span>'
            : '<select data-act="quick-order-status" data-id="' + esc(o.id) + '">' +
                Object.entries(ORDER_STATUS).map(([k, m]) => '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + esc(m.label) + '</option>').join('') +
              '</select>') +
          '</td>' +
          (compact ? '' :
            '<td><div class="rowact">' +
              '<button class="mini" data-act="view-order" data-id="' + esc(o.id) + '" title="جزئیات و یادداشت">' + ICO('eye') + '</button>' +
              '<button class="mini" data-act="resend-bale" data-id="' + esc(o.id) + '" title="ارسال عکس و مشخصات به بله">' + ICO('send') + '</button>' +
              '<button class="mini" data-act="print-order" data-id="' + esc(o.id) + '" title="چاپ فاکتور رسمی">' + ICO('print') + '</button>' +
              '<button class="mini del" data-act="del-order" data-id="' + esc(o.id) + '" title="حذف سفارش">' + ICO('trash') + '</button>' +
            '</div></td>') +
        '</tr>';
      }).join('') +
    '</tbody></table></div>';
  }

  function renderOrders() {
    const counts = { all: STATE.orders.length };
    Object.keys(ORDER_STATUS).forEach((k) => { counts[k] = STATE.orders.filter((o) => o.status === k).length; });

    const list = STATE.orders.filter((o) => {
      const okS = oStatus === 'all' || o.status === oStatus;
      const q = oQuery.trim().toLowerCase();
      const okQ = !q || (o.order_code + ' ' + o.customer_name + ' ' + o.customer_phone + ' ' + (o.city || '')).toLowerCase().includes(q);
      return okS && okQ;
    });

    $('#view-orders').innerHTML =
      '<div class="pill-tabs">' +
        '<button class="pill-tab ' + (oStatus === 'all' ? 'on' : '') + '" data-ostatus="all">همه سفارش‌ها <span>' + num(counts.all) + '</span></button>' +
        Object.entries(ORDER_STATUS).map(([k, m]) =>
          '<button class="pill-tab ' + (oStatus === k ? 'on' : '') + '" data-ostatus="' + k + '">' + esc(m.label) + ' <span>' + num(counts[k] || 0) + '</span></button>'
        ).join('') +
      '</div>' +
      '<div class="toolbar">' +
        '<div class="search">' + ICO('search') + '<input id="oSearch" placeholder="جستجوی شماره سفارش، نام مشتری، موبایل یا شهر…" value="' + esc(oQuery) + '"></div>' +
        '<button class="btn btn--ghost" data-act="export-orders-csv">' + ICO('down') + ' خروجی CSV اکسل</button>' +
        '<button class="btn btn--gold" data-act="new-order-modal">' + ICO('plus') + ' ثبت سفارش تلفنی / حضوری</button>' +
      '</div>' +
      '<div class="card">' +
        (list.length ? renderOrdersTableHTML(list, false) : '<div class="empty">' + ICO('cart') + '<div>سفارشی در این وضعیت یافت نشد.</div></div>') +
      '</div>';

    $('#oSearch').addEventListener('input', (e) => {
      const pos = e.target.selectionStart;
      oQuery = e.target.value;
      renderOrders();
      const inp = $('#oSearch');
      if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (err) {} }
    });
  }

  function openOrderInspectModal(id) {
    const o = STATE.orders.find((x) => x.id === id);
    if (!o) return;
    openModal(
      '<div class="modal__head">' +
        '<div><h3>پرونده سفارش <span dir="ltr">' + esc(o.order_code) + '</span></h3><p class="muted" style="margin:2px 0 0;font-size:11.5px">ثبت‌شده در ' + esc(faDate(o.created_at, true)) + '</p></div>' +
        '<button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button>' +
      '</div>' +
      '<div class="modal__body">' +
        '<div class="formgrid">' +
          fieldHTML('نام خریدار', '<input value="' + esc(o.customer_name) + '" disabled>') +
          fieldHTML('تلفن تماس', '<div style="display:flex;gap:8px"><input dir="ltr" value="' + esc(o.customer_phone) + '" disabled><a class="btn btn--dark btn--sm" href="tel:' + esc(o.customer_phone) + '">' + ICO('phone') + ' تماس</a></div>') +
          fieldHTML('شهر و کد پستی', '<input value="' + esc((o.city || '') + (o.postal_code ? ' · کد پستی: ' + o.postal_code : '')) + '" disabled>') +
          fieldHTML('نحوه هماهنگی انتخابی', '<input value="' + esc(PAY_MAP[o.payment_method] || o.payment_method) + '" disabled>') +
          fieldHTML('نشانی تحویل', '<input value="' + esc(o.address || '—') + '" disabled>', 'full') +
          (o.customer_note ? fieldHTML('توضیحات مشتری هنگام ثبت سفارش', '<input value="' + esc(o.customer_note) + '" disabled>', 'full') : '') +
          fieldHTML('وضعیت سفارش', '<select id="omStatus">' + Object.entries(ORDER_STATUS).map(([k, m]) => '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + esc(m.label) + '</option>').join('') + '</select>') +
          fieldHTML('وضعیت ارسال به بله', '<input value="' + esc(o.bale_notified_at ? ('ارسال شده در ' + faDate(o.bale_notified_at, true)) : (o.bale_notify_error || 'هنوز ارسال نشده')) + '" disabled>') +
          fieldHTML('یادداشت داخلی مدیر (محرمانه)', '<textarea id="omAdminNote" placeholder="مثلاً با مشتری هماهنگ شد؛ ارسال شنبه صبح با وانت شعبه…">' + esc(o.admin_note || '') + '</textarea>', 'full') +
        '</div>' +
        '<div class="hr"></div>' +
        '<b style="font-size:13px;display:block;margin-bottom:8px">اقلام سفارش (همراه تصویر و رنگ انتخابی)</b>' +
        (o.items || []).map((it) => {
          const prodRef = STATE.products.find((x) => x.id === it.id);
          const imgSrc = resolveImg(it.img || (prodRef && (prodRef.resolvedImg || prodRef.img)) || 'p1');
          const cLbl = colorNameFa(it.color, it.color_name);
          return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 12px;margin-bottom:6px;border-radius:12px;background:var(--surface-2);font-size:12.5px">' +
            '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
              '<img src="' + esc(imgSrc) + '" alt="" style="width:46px;height:46px;border-radius:10px;object-fit:cover;border:1px solid var(--line-soft);flex:none">' +
              '<div style="min-width:0">' +
                '<div><b>' + esc(it.name) + '</b> × ' + num(it.qty) + '</div>' +
                (cLbl ? '<div class="muted" style="font-size:11px;display:flex;align-items:center;gap:5px"><i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + esc(it.color || '#123f34') + ';border:1px solid rgba(255,255,255,.3)"></i> رنگ: ' + esc(cLbl) + '</div>' : '') +
              '</div>' +
            '</div>' +
            '<b style="flex:none">' + money((+it.price || 0) * (+it.qty || 1)) + '</b>' +
          '</div>';
        }).join('') +
        '<div style="display:grid;gap:5px;margin-top:12px;padding:12px;border-radius:12px;background:var(--surface-2);font-size:12.5px">' +
          '<div style="display:flex;justify-content:space-between"><span>جمع اقلام:</span><span>' + money(o.subtotal || o.total) + '</span></div>' +
          (o.discount ? '<div style="display:flex;justify-content:space-between;color:var(--green)"><span>تخفیف:</span><span>− ' + money(o.discount) + '</span></div>' : '') +
          '<div style="display:flex;justify-content:space-between"><span>ارسال و نصب:</span><span>' + (o.shipping ? money(o.shipping) : 'رایگان / طبق هماهنگی') + '</span></div>' +
          '<div style="display:flex;justify-content:space-between;font-size:14.5px;padding-top:6px;border-top:1px solid var(--line-soft)"><b>مبلغ نهایی فاکتور:</b><b>' + money(o.total) + '</b></div>' +
        '</div>' +
      '</div>' +
      '<div class="modal__foot">' +
        '<button class="btn btn--dark" data-act="resend-bale" data-id="' + esc(o.id) + '">' + ICO('send') + ' ارسال عکس و مشخصات به بله</button>' +
        '<button class="btn btn--ghost" data-act="print-order" data-id="' + esc(o.id) + '">' + ICO('print') + ' چاپ فاکتور رسمی</button>' +
        '<button class="btn btn--gold" id="omSaveBtn">' + ICO('save') + ' ذخیره وضعیت و یادداشت</button>' +
      '</div>'
    );

    $('#omSaveBtn').addEventListener('click', async () => {
      const btn = $('#omSaveBtn');
      btn.disabled = true; btn.textContent = 'در حال ذخیره…';
      try {
        await DB.updateOrder(SESSION_TOKEN, o.id, $('#omStatus').value, $('#omAdminNote').value.trim());
        closeModal();
        await refreshFromCloud(true);
        toast('پرونده سفارش به‌روزرسانی شد');
      } catch (err) {
        btn.disabled = false; btn.textContent = 'ذخیره وضعیت و یادداشت';
        toast(err.message || 'خطا در ذخیره سفارش', 'err');
      }
    });
  }

  function openNewOrderModal() {
    openModal(
      '<div class="modal__head"><div><h3>ثبت سفارش حضوری / تلفنی جدید</h3><p class="muted" style="margin:2px 0 0;font-size:11.5px">ثبت مستقیم فاکتور فروشگاهی در دیتابیس و کسر خودکار از موجودی انبار</p></div>' +
        '<button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button></div>' +
      '<div class="modal__body"><div class="formgrid">' +
        fieldHTML('نام و نام خانوادگی مشتری *', '<input id="noName" placeholder="مثلاً علی رضایی">') +
        fieldHTML('شماره موبایل *', '<input id="noPhone" dir="ltr" placeholder="0915...">') +
        fieldHTML('شهر', '<input id="noCity" value="بیرجند">') +
        fieldHTML('نحوه هماهنگی / تسویه', '<select id="noPay"><option value="phone_consult">هماهنگی تلفنی کارشناس</option><option value="showroom_visit">سفارش حضوری نمایشگاه</option><option value="installment_plan">شرایط اقساطی (چک صیادی)</option><option value="cod">بیعانه / تسویه هنگام تحویل</option></select>') +
        fieldHTML('نشانی کامل مشتری', '<input id="noAddr" placeholder="خیابان، کوچه، پلاک">', 'full') +
        fieldHTML('انتخاب محصول از کاتالوگ', '<select id="noProd">' + STATE.products.map((p) => '<option value="' + esc(p.id) + '">' + esc(p.name) + ' — ' + money(p.price) + '</option>').join('') + '</select>') +
        fieldHTML('تعداد', '<input id="noQty" type="number" min="1" value="1">') +
        fieldHTML('هزینه ارسال (تومان)', '<input id="noShip" type="number" step="100000" value="0">') +
        fieldHTML('تخفیف توافقی (تومان)', '<input id="noDisc" type="number" step="100000" value="0">') +
        fieldHTML('وضعیت اولیه سفارش', '<select id="noStatus">' + Object.entries(ORDER_STATUS).map(([k, m]) => '<option value="' + k + '"' + (k === 'confirmed' ? ' selected' : '') + '>' + esc(m.label) + '</option>').join('') + '</select>') +
        fieldHTML('یادداشت فاکتور', '<input id="noNote" placeholder="رنگ پارچه، تاریخ تحویل توافق‌شده…">') +
      '</div></div>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-close>انصراف</button>' +
        '<button class="btn btn--gold" id="noSaveBtn">' + ICO('save') + ' ثبت سفارش و صدور کد</button></div>'
    );

    $('#noSaveBtn').addEventListener('click', async () => {
      const name = $('#noName').value.trim();
      const phone = toEn($('#noPhone').value).trim();
      if (name.length < 2 || phone.length < 8) { toast('نام و شماره موبایل مشتری را کامل وارد کنید', 'err'); return; }
      const p = STATE.products.find((x) => x.id === $('#noProd').value) || STATE.products[0];
      const qty = Math.max(1, +$('#noQty').value || 1);
      const subtotal = (+p.price || 0) * qty;
      const shipping = Math.max(0, +$('#noShip').value || 0);
      const discount = Math.max(0, +$('#noDisc').value || 0);
      const total = Math.max(0, subtotal - discount + shipping);

      const btn = $('#noSaveBtn');
      btn.disabled = true; btn.textContent = 'در حال ثبت…';
      try {
        const res = await DB.createOrder(SESSION_TOKEN, {
          name,
          phone,
          city: $('#noCity').value.trim() || 'بیرجند',
          address: $('#noAddr').value.trim() || 'تحویل حضوری از شعبه مرکزی',
          pay: $('#noPay').value,
          status: $('#noStatus').value,
          admin_note: $('#noNote').value.trim(),
          subtotal,
          discount,
          shipping,
          total,
          items: [{
            id: p.id,
            name: p.name,
            cat: p.cat || '',
            img: p.img || 'p1',
            qty,
            price: +p.price || 0,
            color: (p.colors && p.colors[0]) || '',
            color_name: colorNameFa((p.colors && p.colors[0]) || '', ''),
            specs: p.specs || {}
          }]
        });
        closeModal();
        await refreshFromCloud(true);
        toast('سفارش ' + (res.order_code || '') + ' با موفقیت ثبت شد');
      } catch (err) {
        btn.disabled = false; btn.textContent = 'ثبت سفارش و صدور کد';
        toast(err.message || 'خطا در ثبت سفارش', 'err');
      }
    });
  }

  function printOrderInvoice(id) {
    const o = STATE.orders.find((x) => x.id === id);
    if (!o) return;
    const B = STATE.config.brand || {};
    const w = window.open('', '_blank', 'width=860,height=920');
    if (!w) { toast('لطفاً باز شدن پنجره پاپ‌آپ را برای چاپ فاکتور مجاز کنید', 'err'); return; }
    const html = '<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>فاکتور ' + esc(o.order_code) + '</title>' +
      '<style>' +
        'body{font-family:Tahoma,Vazirmatn,sans-serif;padding:34px;color:#14110f;line-height:1.8;max-width:780px;margin:0 auto}' +
        '.head{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #123f34;padding-bottom:16px;margin-bottom:22px}' +
        '.brand h1{margin:0;font-size:22px;color:#123f34}.brand small{color:#666}' +
        '.meta{text-align:left;font-size:13px}' +
        '.box{background:#f8f5ee;border:1px solid #e2dacb;border-radius:12px;padding:14px 18px;margin-bottom:18px;font-size:13px;display:grid;grid-template-columns:1fr 1fr;gap:8px}' +
        'table{width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px}' +
        'th,td{border:1px solid #ddd;padding:10px 12px;text-align:right}th{background:#123f34;color:#fff}' +
        '.totals{margin-right:auto;width:280px;font-size:13.5px}.totals div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}' +
        '.totals .grand{font-weight:bold;font-size:15px;color:#123f34;border-top:2px solid #123f34;border-bottom:0;padding-top:10px}' +
        '.sign{display:flex;justify-content:space-between;margin-top:46px;font-size:12.5px;color:#555}' +
        '@media print{.noprint{display:none}}' +
      '</style></head><body>' +
      '<div class="noprint" style="margin-bottom:16px;text-align:left"><button onclick="window.print()" style="padding:8px 18px;background:#123f34;color:#fff;border:0;border-radius:8px;cursor:pointer;font-family:inherit">چاپ / ذخیره PDF</button></div>' +
      '<div class="head"><div class="brand"><h1>' + esc(B.name || 'فروشگاه مبلمان پرنس (PERANS)') + '</h1><small>' + esc(B.address || 'بیرجند، خیابان انقلاب، نبش انقلاب ۳') + ' · تلفن: ' + esc(B.phone || '09159598518') + '</small></div>' +
      '<div class="meta"><b>شماره فاکتور: ' + esc(o.order_code) + '</b><br>تاریخ: ' + esc(faDate(o.created_at, true)) + '</div></div>' +
      '<div class="box"><div><b>خریدار:</b> ' + esc(o.customer_name) + '</div><div><b>تلفن:</b> ' + esc(o.customer_phone) + '</div>' +
      '<div><b>شهر:</b> ' + esc(o.city || 'بیرجند') + '</div><div><b>روش تسویه:</b> ' + esc(PAY_MAP[o.payment_method] || o.payment_method) + '</div>' +
      '<div style="grid-column:1/-1"><b>نشانی تحویل:</b> ' + esc(o.address || '—') + '</div></div>' +
      '<table><thead><tr><th>ردیف</th><th>شرح کالا / مدل</th><th>تعداد</th><th>فی واحد (تومان)</th><th>مبلغ کل (تومان)</th></tr></thead><tbody>' +
      (o.items || []).map((it, i) => '<tr><td>' + num(i + 1) + '</td><td>' + esc(it.name) + '</td><td>' + num(it.qty) + '</td><td>' + num(it.price) + '</td><td>' + num((+it.price || 0) * (+it.qty || 1)) + '</td></tr>').join('') +
      '</tbody></table>' +
      '<div class="totals">' +
        '<div><span>جمع اقلام:</span><span>' + money(o.subtotal || o.total) + '</span></div>' +
        (o.discount ? '<div><span>تخفیف:</span><span>− ' + money(o.discount) + '</span></div>' : '') +
        '<div><span>ارسال و نصب:</span><span>' + (o.shipping ? money(o.shipping) : 'رایگان') + '</span></div>' +
        '<div class="grand"><span>مبلغ قابل پرداخت:</span><span>' + money(o.total) + '</span></div>' +
      '</div>' +
      '<div class="sign"><div>مهر و امضای فروشگاه مبلمان پرنس</div><div>امضای تحویل‌گیرنده</div></div>' +
      '</body></html>';
    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  /* ------------------------------------------------------------------ 4. Messages & CRM */
  function renderMessages() {
    const counts = {
      all: STATE.messages.length,
      unread: STATE.messages.filter((m) => m.status === 'unread').length,
      in_progress: STATE.messages.filter((m) => m.status === 'in_progress').length,
      resolved: STATE.messages.filter((m) => m.status === 'resolved').length,
      newsletter: STATE.messages.filter((m) => m.kind === 'newsletter').length
    };

    const list = STATE.messages.filter((m) => {
      if (mStatus === 'all') return true;
      if (mStatus === 'newsletter') return m.kind === 'newsletter';
      return m.status === mStatus;
    });

    $('#view-messages').innerHTML =
      '<div class="pill-tabs">' +
        '<button class="pill-tab ' + (mStatus === 'all' ? 'on' : '') + '" data-mstatus="all">همه پیام‌ها <span>' + num(counts.all) + '</span></button>' +
        '<button class="pill-tab ' + (mStatus === 'unread' ? 'on' : '') + '" data-mstatus="unread">خوانده‌نشده <span>' + num(counts.unread) + '</span></button>' +
        '<button class="pill-tab ' + (mStatus === 'in_progress' ? 'on' : '') + '" data-mstatus="in_progress">در حال پیگیری <span>' + num(counts.in_progress) + '</span></button>' +
        '<button class="pill-tab ' + (mStatus === 'resolved' ? 'on' : '') + '" data-mstatus="resolved">پاسخ داده‌شده <span>' + num(counts.resolved) + '</span></button>' +
        '<button class="pill-tab ' + (mStatus === 'newsletter' ? 'on' : '') + '" data-mstatus="newsletter">اعضای خبرنامه <span>' + num(counts.newsletter) + '</span></button>' +
      '</div>' +
      '<div class="card tablewrap">' +
        (list.length ?
          '<table><thead><tr><th>فرستنده</th><th>تماس / ایمیل</th><th>موضوع</th><th>خلاصه پیام</th><th>تاریخ</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>' +
          list.map((m) => {
            const st = MSG_STATUS[m.status] || MSG_STATUS.unread;
            return '<tr>' +
              '<td><b>' + esc(m.name || 'عضو خبرنامه') + '</b>' + (m.city ? '<div class="muted" style="font-size:10.5px">' + esc(m.city) + '</div>' : '') + '</td>' +
              '<td dir="ltr">' + esc(m.phone || m.email || '—') + '</td>' +
              '<td><span class="tag info">' + esc(TOPIC_MAP[m.topic] || m.topic) + '</span></td>' +
              '<td style="max-width:300px;overflow:hidden;text-overflow:ellipsis">' + esc(m.message || '—') + '</td>' +
              '<td class="muted" style="font-size:11.5px">' + esc(faDate(m.created_at, true)) + '</td>' +
              '<td><span class="tag ' + st.cls + '">' + esc(st.label) + '</span></td>' +
              '<td><div class="rowact">' +
                '<button class="mini" data-act="view-msg" data-id="' + esc(m.id) + '" title="بررسی و یادداشت">' + ICO('eye') + '</button>' +
                '<button class="mini del" data-act="del-msg" data-id="' + esc(m.id) + '" title="حذف">' + ICO('trash') + '</button>' +
              '</div></td>' +
            '</tr>';
          }).join('') + '</tbody></table>'
          : '<div class="empty">' + ICO('msg') + '<div>پیامی در این بخش وجود ندارد.</div></div>') +
      '</div>';
  }

  function openMessageModal(id) {
    const m = STATE.messages.find((x) => x.id === id);
    if (!m) return;
    openModal(
      '<div class="modal__head"><div><h3>جزئیات درخواست مشتری</h3><p class="muted" style="margin:2px 0 0;font-size:11.5px">' + esc(faDate(m.created_at, true)) + '</p></div>' +
        '<button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button></div>' +
      '<div class="modal__body"><div class="formgrid">' +
        fieldHTML('نام مشتری', '<input value="' + esc(m.name || 'عضو خبرنامه') + '" disabled>') +
        fieldHTML('شماره تماس / ایمیل', '<div style="display:flex;gap:8px"><input dir="ltr" value="' + esc(m.phone || m.email || '') + '" disabled>' + (m.phone ? '<a class="btn btn--dark btn--sm" href="tel:' + esc(m.phone) + '">' + ICO('phone') + ' تماس</a>' : '') + '</div>') +
        fieldHTML('موضوع', '<input value="' + esc(TOPIC_MAP[m.topic] || m.topic) + '" disabled>') +
        fieldHTML('شهر', '<input value="' + esc(m.city || '—') + '" disabled>') +
        fieldHTML('متن کامل پیام مشتری', '<textarea disabled>' + esc(m.message || 'بدون توضیح متنی') + '</textarea>', 'full') +
        fieldHTML('وضعیت پیگیری', '<select id="mmStatus">' + Object.entries(MSG_STATUS).map(([k, v]) => '<option value="' + k + '"' + (m.status === k ? ' selected' : '') + '>' + esc(v.label) + '</option>').join('') + '</select>', 'full') +
        fieldHTML('نتیجه تماس / یادداشت همکاران فروش', '<textarea id="mmNote" placeholder="مثلاً عکس نشیمن مشتری در واتس‌اپ دریافت شد و مدل نُبل پیشنهاد گردید…">' + esc(m.admin_note || '') + '</textarea>', 'full') +
      '</div></div>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-close>بستن</button>' +
        '<button class="btn btn--gold" id="mmSaveBtn">' + ICO('save') + ' ذخیره نتیجه پیگیری</button></div>'
    );

    $('#mmSaveBtn').addEventListener('click', async () => {
      const btn = $('#mmSaveBtn');
      btn.disabled = true; btn.textContent = 'در حال ذخیره…';
      try {
        await DB.updateMessage(SESSION_TOKEN, m.id, $('#mmStatus').value, $('#mmNote').value.trim());
        closeModal();
        await refreshFromCloud(true);
        toast('وضعیت پیام به‌روزرسانی شد');
      } catch (err) {
        btn.disabled = false; btn.textContent = 'ذخیره نتیجه پیگیری';
        toast(err.message || 'خطا در ذخیره پیام', 'err');
      }
    });
  }

  /* ------------------------------------------------------------------ 5. Categories */
  function renderCats() {
    $('#view-cats').innerHTML =
      '<div class="card">' +
        '<div class="card__head"><div><h3>مدیریت دسته‌بندی‌های فروشگاه</h3><p>ترتیب قرارگیری دسته‌ها در منوی سایت و فیلترها را مشخص کنید</p></div>' +
          '<div class="sp"><button class="btn btn--gold btn--sm" data-act="add-cat">' + ICO('plus') + ' دسته جدید</button></div></div>' +
        '<div class="card__body" style="display:grid;gap:10px">' +
          STATE.categories.map((c, idx) => {
            const prodCount = c.id === 'all' ? STATE.products.length : STATE.products.filter((p) => p.cat === c.id).length;
            return '<div style="display:grid;grid-template-columns:1fr 1.4fr auto auto;gap:10px;align-items:center;padding:10px 12px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-soft)">' +
              '<input dir="ltr" value="' + esc(c.id) + '" data-cat-id="' + idx + '"' + (c.id === 'all' ? ' disabled' : '') + ' style="padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--input-bg)">' +
              '<input value="' + esc(c.name) + '" data-cat-name="' + idx + '" style="padding:9px 12px;border-radius:10px;border:1px solid var(--line);background:var(--input-bg)">' +
              '<span class="tag b">' + num(prodCount) + ' محصول</span>' +
              '<div class="rowact">' +
                (idx > 1 ? '<button class="mini" data-act="move-cat" data-idx="' + idx + '" data-dir="-1" title="بالاتر">' + ICO('chev-up') + '</button>' : '') +
                (idx > 0 && idx < STATE.categories.length - 1 ? '<button class="mini" data-act="move-cat" data-idx="' + idx + '" data-dir="1" title="پایین‌تر">' + ICO('chev-down') + '</button>' : '') +
                (c.id === 'all' ? '<span class="tag">پیش‌فرض</span>' : '<button class="mini del" data-act="del-cat" data-idx="' + idx + '">' + ICO('trash') + '</button>') +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
        '<div class="modal__foot" style="position:static">' +
          '<button class="btn btn--gold" data-act="save-cats">' + ICO('save') + ' ذخیره دسته‌بندی‌ها در دیتابیس</button>' +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ 6. Storefront Content */
  function renderContent() {
    const H = STATE.config.hero || {};
    const B = STATE.config.brand || {};
    const stats = Array.isArray(STATE.config.stats) ? STATE.config.stats : [];
    const anns = Array.isArray(STATE.config.announce) ? STATE.config.announce : [];

    $('#view-content').innerHTML =
      '<div class="sectiongrid">' +
        '<div class="card"><div class="card__head"><div><h3>بخش هیرو (ویترین بالای صفحه اول)</h3><p>اولین پیام و تیترهایی که بازدیدکنندگان سایت می‌بینند</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            fieldHTML('برچسب بالای تیتر', '<input id="cHeroBadge" value="' + esc(H.badge || '') + '">', 'full') +
            fieldHTML('خط اول تیتر اصلی', '<input id="cHeroT1" value="' + esc(H.t1 || '') + '">') +
            fieldHTML('خط دوم تیتر اصلی', '<input id="cHeroT2" value="' + esc(H.t2 || '') + '">') +
            fieldHTML('خط سوم (طلایی)', '<input id="cHeroT3" value="' + esc(H.t3 || '') + '">', 'full') +
            fieldHTML('متن توضیح زیر تیتر', '<textarea id="cHeroLead">' + esc(H.lead || '') + '</textarea>', 'full') +
          '</div></div></div>' +

        '<div class="card"><div class="card__head"><div><h3>چهار کارت معرفی زیر هیرو</h3><p>کارت‌های خلاصه دسته‌ها در صفحه نخست</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            stats.map((st, i) =>
              fieldHTML('عنوان کارت ' + num(i + 1), '<input data-stat-v="' + i + '" value="' + esc(st.value || '') + '">') +
              fieldHTML('زیرنویس کارت ' + num(i + 1), '<input data-stat-l="' + i + '" value="' + esc(st.label || '') + '">')
            ).join('') +
          '</div></div></div>' +

        '<div class="card"><div class="card__head"><div><h3>نوار اطلاعیه بالای سایت</h3><p>جمله‌های چرخشی نوار اعلان</p></div>' +
          '<div class="sp"><button class="btn btn--ghost btn--sm" data-act="add-ann">' + ICO('plus') + ' افزودن پیام</button></div></div>' +
          '<div class="card__body" style="display:grid;gap:8px" id="annList">' +
            anns.map((t, i) =>
              '<div style="display:grid;grid-template-columns:1fr auto;gap:8px">' +
                '<input data-ann-idx="' + i + '" value="' + esc(t) + '" style="padding:10px 12px;border-radius:11px;border:1px solid var(--line);background:var(--input-bg)">' +
                '<button class="mini del" data-act="del-ann" data-idx="' + i + '">' + ICO('trash') + '</button>' +
              '</div>'
            ).join('') +
          '</div></div>' +

        '<div class="card"><div class="card__head"><div><h3>اطلاعات برند، آدرس و تماس شعبه</h3><p>در هدر، فوتر و صفحه تماس نمایش داده می‌شود</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            fieldHTML('نام فارسی برند', '<input id="cBrandName" value="' + esc(B.name || '') + '">') +
            fieldHTML('نام لاتین برند', '<input id="cBrandEn" dir="ltr" value="' + esc(B.en || '') + '">') +
            fieldHTML('تلفن نمایش داده‌شده', '<input id="cBrandPhone" dir="ltr" value="' + esc(B.phone || '') + '">') +
            fieldHTML('شماره تماس لینک (بدون فاصله)', '<input id="cBrandPhoneRaw" dir="ltr" value="' + esc(B.phoneRaw || '') + '">') +
            fieldHTML('شماره موبایل پشتیبانی', '<input id="cBrandMobile" dir="ltr" value="' + esc(B.mobile || '') + '">') +
            fieldHTML('ایمیل فروشگاه', '<input id="cBrandEmail" dir="ltr" value="' + esc(B.email || '') + '">') +
            fieldHTML('نشانی دقیق شعبه مرکزی', '<input id="cBrandAddr" value="' + esc(B.address || '') + '">', 'full') +
            fieldHTML('ساعات کاری فروشگاه', '<input id="cBrandHours" value="' + esc(B.hours || '') + '">', 'full') +
          '</div></div></div>' +

        '<div style="display:flex;justify-content:flex-end;gap:10px">' +
          '<button class="btn btn--gold" data-act="save-content">' + ICO('save') + ' ذخیره و انتشار فوری در سایت</button>' +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ 7. Commerce & Coupons */
  function renderCommerce() {
    const C = STATE.config.commerce || { shipping: 1200000, threshold: 20000000, coupons: {} };
    const coupons = Object.entries(C.coupons || {});

    $('#view-commerce').innerHTML =
      '<div class="sectiongrid">' +
        '<div class="card"><div class="card__head"><div><h3>تعرفه ارسال و سقف ارسال رایگان</h3><p>به‌صورت خودکار در سبد خرید مشتریان محاسبه می‌شود</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            fieldHTML('هزینه پایه ارسال و نصب (تومان)', '<input id="cmShip" type="number" step="100000" value="' + (+C.shipping || 0) + '"><small>عدد ۰ = ارسال رایگان برای همه سفارش‌ها</small>') +
            fieldHTML('سقف خرید برای ارسال رایگان (تومان)', '<input id="cmThresh" type="number" step="1000000" value="' + (+C.threshold || 0) + '"><small>فعلی: ' + money(C.threshold || 0) + '</small>') +
          '</div><div style="margin-top:14px"><button class="btn btn--gold" data-act="save-commerce">' + ICO('save') + ' ذخیره تعرفه ارسال</button></div></div></div>' +

        '<div class="card"><div class="card__head"><div><h3>کدهای تخفیف فعال</h3><p>مشتریان در سبد خرید می‌توانند این کدها را وارد کنند</p></div>' +
          '<div class="sp"><button class="btn btn--gold btn--sm" data-act="add-coupon-modal">' + ICO('plus') + ' ساخت کد تخفیف جدید</button></div></div>' +
          '<div class="card__body">' +
            (coupons.length
              ? '<div class="tablewrap"><table><thead><tr><th>کد تخفیف</th><th>میزان تخفیف</th><th>کپی سریع</th><th>حذف</th></tr></thead><tbody>' +
                coupons.map(([code, ratio]) =>
                  '<tr>' +
                    '<td><b dir="ltr" style="font-family:monospace;font-size:14px;letter-spacing:.08em">' + esc(code) + '</b></td>' +
                    '<td><span class="tag g">' + num(Math.round((+ratio || 0) * 100)) + '٪ تخفیف روی کل سبد</span></td>' +
                    '<td><button class="btn btn--ghost btn--sm" data-act="copy-text" data-text="' + esc(code) + '">' + ICO('copy') + ' کپی کد</button></td>' +
                    '<td><button class="mini del" data-act="del-coupon" data-code="' + esc(code) + '">' + ICO('trash') + '</button></td>' +
                  '</tr>'
                ).join('') + '</tbody></table></div>'
              : '<div class="empty">هیچ کد تخفیفی ثبت نشده است.</div>') +
          '</div></div>' +
      '</div>';
  }

  function openAddCouponModal() {
    openModal(
      '<div class="modal__head"><div><h3>ساخت کد تخفیف جدید</h3></div><button class="x" data-close style="margin-inline-start:auto">' + ICO('x') + '</button></div>' +
      '<div class="modal__body"><div class="formgrid">' +
        fieldHTML('کد تخفیف (حروف لاتین/اعداد)', '<input id="cpCode" dir="ltr" placeholder="مثلاً NOROUZ20">') +
        fieldHTML('درصد تخفیف (۱ تا ۹۰ درصد)', '<input id="cpPct" type="number" min="1" max="90" value="15">') +
      '</div></div>' +
      '<div class="modal__foot"><button class="btn btn--ghost" data-close>انصراف</button><button class="btn btn--gold" id="cpSaveBtn">' + ICO('save') + ' ثبت کد تخفیف</button></div>'
    );
    $('#cpSaveBtn').addEventListener('click', async () => {
      const code = toEn($('#cpCode').value).trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
      const pct = Math.min(90, Math.max(1, +$('#cpPct').value || 10));
      if (code.length < 3) { toast('کد تخفیف باید حداقل ۳ کاراکتر انگلیسی باشد', 'err'); return; }
      STATE.config.commerce = STATE.config.commerce || { shipping: 1200000, threshold: 20000000, coupons: {} };
      STATE.config.commerce.coupons = STATE.config.commerce.coupons || {};
      STATE.config.commerce.coupons[code] = +(pct / 100).toFixed(2);
      $('#cpSaveBtn').disabled = true;
      try {
        await DB.saveConfig(SESSION_TOKEN, { commerce: STATE.config.commerce, note: 'افزودن کد تخفیف ' + code });
        closeModal();
        await refreshFromCloud(true);
        toast('کد تخفیف ' + code + ' فعال شد');
      } catch (err) {
        $('#cpSaveBtn').disabled = false;
        toast(err.message || 'خطا در ثبت کد تخفیف', 'err');
      }
    });
  }

  /* ------------------------------------------------------------------ 8. Media Library */
  function renderMedia() {
    $('#view-media').innerHTML =
      '<div class="sectiongrid">' +
        '<div class="dropzone" id="mediaDrop">' +
          ICO('image') +
          '<h3 style="margin:4px 0;font-size:15px">تصاویر محصول را اینجا بکشید و رها کنید یا کلیک کنید</h3>' +
          '<p class="muted" style="margin:0;font-size:12px">تصاویر به‌طور خودکار به فرمت کم‌حجم WebP بهینه‌سازی و در دیتابیس ابری Supabase ذخیره می‌شوند.</p>' +
        '</div>' +

        '<div class="card"><div class="card__head"><div><h3>تصاویر آپلودشده در فضای ابری (' + num(STATE.media.length) + ')</h3><p>قابل انتخاب مستقیم در فرم ویرایش محصول</p></div></div>' +
          '<div class="card__body">' +
            (STATE.media.length
              ? '<div class="media-grid">' + STATE.media.map((m) =>
                  '<div class="media-card">' +
                    '<img src="' + esc(m.data_url) + '" alt="' + esc(m.title) + '">' +
                    '<div class="media-card__meta">' +
                      '<div style="min-width:0"><b>' + esc(m.title) + '</b><div class="muted" style="font-size:10px">' + num(Math.round((m.size_bytes || 0) / 1024)) + ' KB</div></div>' +
                      '<button class="mini del" data-act="del-media" data-id="' + esc(m.id) + '" title="حذف">' + ICO('trash') + '</button>' +
                    '</div>' +
                  '</div>'
                ).join('') + '</div>'
              : '<div class="empty">هنوز تصویر اختصاصی در فضای ابری آپلود نکرده‌اید.</div>') +
          '</div></div>' +

        '<div class="card"><div class="card__head"><div><h3>تصاویر پایه نمایشگاه (' + num(BUILTIN_IMGS.length) + ')</h3><p>موجود در پوشه images سایت</p></div></div>' +
          '<div class="card__body"><div class="media-grid">' +
            BUILTIN_IMGS.map((k) =>
              '<div class="media-card"><img src="' + esc(resolveImg(k)) + '" alt=""><div class="media-card__meta"><b dir="ltr">' + esc(k) + '.jpg</b><span class="tag">داخلی</span></div></div>'
            ).join('') +
          '</div></div></div>' +
      '</div>';

    const dz = $('#mediaDrop');
    dz.addEventListener('click', () => $('#mediaPick').click());
    dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('drag'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
    dz.addEventListener('drop', async (e) => {
      e.preventDefault();
      dz.classList.remove('drag');
      if (e.dataTransfer && e.dataTransfer.files) await handleMediaFiles(e.dataTransfer.files);
    });
  }

  async function handleMediaFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    toast('در حال بهینه‌سازی و آپلود ' + num(files.length) + ' تصویر…');
    let okCount = 0;
    for (const f of files) {
      try {
        const comp = await DB.compressImageFile(f);
        await DB.uploadMedia(SESSION_TOKEN, comp);
        okCount++;
      } catch (err) {
        toast((f.name || '') + ': ' + (err.message || 'خطا'), 'err');
      }
    }
    if (okCount) {
      await refreshFromCloud(true);
      toast(num(okCount) + ' تصویر با موفقیت در Supabase ذخیره شد');
    }
  }

  /* ------------------------------------------------------------------ 8.5. Bale Messenger Bot */
  function renderBale() {
    const BS = STATE.bot_settings || {};
    const isReady = !!(BS.bale_enabled && BS.has_token && BS.bale_chat_id);

    $('#view-bale').innerHTML =
      '<div class="sectiongrid">' +
        '<div class="hero-strip">' +
          '<div>' +
            '<h3>اتصال زنده به ربات پیام‌رسان «بله» (اعلان آنی سفارش با عکس)</h3>' +
            '<p>به محض ثبت سفارش توسط مشتری، <b>تصاویر مبلمان انتخابی + مشخصات کامل مدل و رنگ + اطلاعات کامل ثبت‌کننده و آدرس</b> به پیام‌رسان بله شما ارسال می‌شود.</p>' +
          '</div>' +
          '<div class="hero-strip__acts">' +
            '<span class="tag ' + (isReady ? 'g' : 'a') + '" style="padding:7px 14px;font-size:12px">' +
              (isReady ? ('متصل و فعال' + (BS.bale_bot_username ? ' · @' + esc(BS.bale_bot_username) : '')) : 'در انتظار تکمیل توکن / آیدی چت') +
            '</span>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card__head"><div><h3>راهنمای ۳ مرحله‌ای راه‌اندازی سریع در بله</h3><p>کمتر از ۱ دقیقه زمان می‌برد و بدون نیاز به دانش فنی است</p></div></div>' +
          '<div class="card__body" style="display:grid;gap:10px;font-size:12.5px">' +
            '<div style="padding:11px 14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-soft)"><b>گام ۱:</b> در پیام‌رسان بله وارد ربات رسمی <b dir="ltr">@BotFather</b> شوید، با دستور <code dir="ltr">/newbot</code> یک ربات بسازید و <b>توکن (Token)</b> دریافتی را در کادر زیر قرار دهید.</div>' +
            '<div style="padding:11px 14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-soft)"><b>گام ۲:</b> وارد ربات تازه ساخته‌شده خود در بله شوید و یک بار دکمه <b>شروع (<code dir="ltr">/start</code>)</b> را بزنید یا یک پیام دلخواه بفرستید.</div>' +
            '<div style="padding:11px 14px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-soft)"><b>گام ۳:</b> روی دکمه <b>«شناسایی خودکار آیدی چت من»</b> در پایین کلیک کنید تا شماره چت شما خودکار پر شود؛ سپس دکمه <b>«ذخیره و ارسال عکس تست به بله»</b> را بزنید!</div>' +
          '</div>' +
        '</div>' +

        '<div class="card">' +
          '<div class="card__head"><div><h3>پیکربندی امن ربات در سرور ابری</h3><p>توکن ربات در جدول محافظت‌شده دیتابیس نگهداری شده و هرگز در کدهای عمومی سایت لو نمی‌رود</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            '<div class="f full">' +
              '<div style="display:flex;gap:22px;flex-wrap:wrap;padding:12px 16px;border-radius:12px;background:var(--surface-2);border:1px solid var(--line-soft)">' +
                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer"><span class="switch"><input type="checkbox" id="baleEnabled"' + (BS.bale_enabled !== false ? ' checked' : '') + '><i></i></span><b style="font-size:12.5px">فعال بودن ربات بله</b></label>' +
                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer"><span class="switch"><input type="checkbox" id="baleOnOrder"' + (BS.notify_on_order !== false ? ' checked' : '') + '><i></i></span><b style="font-size:12.5px">ارسال خودکار عکس و مشخصات هر سفارش جدید</b></label>' +
                '<label style="display:flex;align-items:center;gap:10px;cursor:pointer"><span class="switch"><input type="checkbox" id="baleOnMsg"' + (BS.notify_on_message !== false ? ' checked' : '') + '><i></i></span><b style="font-size:12.5px">ارسال اعلان فرم مشاوره چیدمان</b></label>' +
              '</div>' +
            '</div>' +

            fieldHTML(
              'توکن ربات بله (Bot Token از @BotFather) *',
              '<input id="baleToken" dir="ltr" placeholder="' + (BS.has_token ? ('ذخیره شده: ' + esc(BS.masked_token) + ' — برای تغییر، توکن جدید وارد کنید') : 'مثلاً 1234567890:ABCDEF...') + '">' +
              (BS.has_token ? '<small style="color:var(--green)">✓ توکن در سرور ذخیره شده است (' + esc(BS.masked_token) + '). اگر قصد تغییر ندارید خالی بگذارید.</small>' : '<small>توکن دریافتی از @BotFather در بله را دقیقاً اینجا جای‌گذاری کنید.</small>'),
              'full'
            ) +

            '<div class="f full">' +
              '<label><span>شناسه عددی چت یا کانال مالک (Chat ID) *</span></label>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap">' +
                '<input id="baleChatId" dir="ltr" style="flex:1;min-width:200px" value="' + esc(BS.bale_chat_id || '') + '" placeholder="مثلاً 148291034">' +
                '<button type="button" class="btn btn--dark" data-act="bale-detect-chat" id="baleDetectBtn">' + ICO('search') + ' شناسایی خودکار آیدی چت من از بله</button>' +
              '</div>' +
              '<small>اگر آیدی عددی چت خود را نمی‌دانید، کافی است در بله یک پیام به رباتتان بدهید و دکمه بالا را بزنید.</small>' +
              '<div id="baleDetectedChats" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px"></div>' +
            '</div>' +

            fieldHTML('آدرس عمومی سایت (جهت بارگذاری تصاویر نمایشگاه)', '<input id="baleSiteUrl" dir="ltr" value="' + esc(BS.site_base_url || 'https://miimdev.github.io/PERANS') + '">', 'full') +

            (BS.last_test_at || BS.last_error
              ? '<div class="f full"><div style="padding:11px 14px;border-radius:12px;background:var(--surface-2);font-size:12px">' +
                  (BS.last_test_at ? '<div style="color:var(--green)">✓ آخرین تست موفق اتصال: ' + esc(faDate(BS.last_test_at, true)) + '</div>' : '') +
                  (BS.last_error ? '<div style="color:var(--red);margin-top:4px">⚠ آخرین خطای ثبت‌شده: ' + esc(BS.last_error) + '</div>' : '') +
                '</div></div>'
              : '') +
          '</div>' +

          '<div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:18px">' +
            '<button class="btn btn--gold" data-act="bale-test" id="baleTestBtn">' + ICO('send') + ' ذخیره و ارسال عکس + سفارش تست به بله</button>' +
            '<button class="btn btn--ghost" data-act="bale-save" id="baleSaveBtn">' + ICO('save') + ' فقط ذخیره تنظیمات</button>' +
          '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ 9. Settings & Security */
  function renderSettings() {
    const B = STATE.config.brand || {};
    const A = STATE.admin || {};

    $('#view-settings').innerHTML =
      '<div class="sectiongrid">' +
        '<div class="card"><div class="card__head"><div><h3>وضعیت اتصال دیتابیس ابری Supabase</h3><p>مشخصات سرور و امنیت نشست</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            fieldHTML('پروژه دیتابیس', '<input dir="ltr" value="Supabase PostgreSQL 17 · ' + esc(DB.projectRef) + '" disabled>') +
            fieldHTML('نشست‌های فعال مدیران', '<input value="' + num(STATE.active_sessions) + ' نشست فعال · تعداد ورودها: ' + num(A.login_count || 1) + '" disabled>') +
          '</div></div></div>' +

        '<div class="card"><div class="card__head"><div><h3>شبکه‌های اجتماعی و لینک‌های برند</h3><p>لینک‌های رسمی فروشگاه در فوتر و صفحه تماس</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            fieldHTML('آدرس صفحه اینستاگرام', '<input id="stIg" dir="ltr" value="' + esc(B.instagram || '') + '" placeholder="https://instagram.com/PERANS_FURNITURE">') +
            fieldHTML('لینک واتس‌اپ', '<input id="stWa" dir="ltr" value="' + esc(B.whatsapp || '') + '">') +
            fieldHTML('لینک تلگرام', '<input id="stTg" dir="ltr" value="' + esc(B.telegram || '') + '">') +
            fieldHTML('سال تأسیس (نمایشی)', '<input id="stSince" value="' + esc(B.since || '۱۳۷۲') + '">') +
          '</div><div style="margin-top:14px"><button class="btn btn--gold" data-act="save-socials">' + ICO('save') + ' ذخیره شبکه‌های اجتماعی</button></div></div></div>' +

        '<div class="card"><div class="card__head"><div><h3>امنیت حساب مدیر (تغییر نام کاربری و رمز عبور)</h3><p>رمز عبور با الگوریتم Bcrypt در دیتابیس PostgreSQL هش و محافظت می‌شود</p></div></div>' +
          '<div class="card__body"><div class="formgrid">' +
            fieldHTML('نام نمایشی مدیر', '<input id="secDisplay" value="' + esc(A.display_name || '') + '">') +
            fieldHTML('نام کاربری ورود', '<input id="secUser" dir="ltr" value="' + esc(A.username || '') + '">') +
            fieldHTML('رمز عبور فعلی (الزامی برای تأیید هویت) *', '<input id="secOldPw" type="password" dir="ltr" placeholder="رمز عبور فعلی را وارد کنید">', 'full') +
            fieldHTML('رمز عبور جدید (در صورت تمایل به تغییر)', '<input id="secNewPw" type="password" dir="ltr" placeholder="خالی بگذارید اگر فقط نام کاربری را عوض می‌کنید">') +
            fieldHTML('تکرار رمز عبور جدید', '<input id="secNewPw2" type="password" dir="ltr" placeholder="تکرار رمز جدید">') +
          '</div><div style="margin-top:14px"><button class="btn btn--dark" data-act="update-creds">' + ICO('shield') + ' ذخیره اطلاعات امنیتی در سرور</button></div></div></div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ 10. Audit Logs & Cloud Backup */
  function renderAudit() {
    $('#view-audit').innerHTML =
      '<div class="sectiongrid">' +
        '<div class="card"><div class="card__head"><div><h3>پشتیبان‌گیری ابری و خروجی فایل</h3><p>تهیه نسخه پشتیبان کامل از دیتابیس یا بازگردانی آنی</p></div></div>' +
          '<div class="card__body" style="display:flex;flex-wrap:wrap;gap:10px">' +
            '<button class="btn btn--gold" data-act="export-json">' + ICO('down') + ' دانلود پشتیبان کامل ابری (JSON)</button>' +
            '<button class="btn btn--ghost" data-act="export-datajs">' + ICO('down') + ' دانلود فایل استاتیک data.js</button>' +
            '<button class="btn btn--dark" data-act="import-json">' + ICO('up') + ' بازگردانی پشتیبان JSON به دیتابیس</button>' +
          '</div></div>' +

        '<div class="card"><div class="card__head"><div><h3>گزارش فعالیت‌های مدیران (Audit Log)</h3><p>۶۰ رویداد اخیر ثبت‌شده در جدول <code>perans_audit_logs</code></p></div></div>' +
          '<div class="tablewrap">' +
            (STATE.audit_logs.length
              ? '<table><thead><tr><th>زمان</th><th>مدیر</th><th>عملیات</th><th>بخش / شناسه</th><th>جزئیات</th></tr></thead><tbody>' +
                STATE.audit_logs.map((l) =>
                  '<tr>' +
                    '<td class="muted" style="font-size:11.5px">' + esc(faDate(l.created_at, true)) + '</td>' +
                    '<td><span class="tag b" dir="ltr">@' + esc(l.admin_username) + '</span></td>' +
                    '<td><b>' + esc(l.action) + '</b></td>' +
                    '<td dir="ltr" class="muted">' + esc(l.entity || '—') + '</td>' +
                    '<td>' + esc(l.detail || '—') + '</td>' +
                  '</tr>'
                ).join('') + '</tbody></table>'
              : '<div class="empty">هنوز گزارشی ثبت نشده است.</div>') +
          '</div></div>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ Modal & Form Utils */
  function fieldHTML(label, inner, cls) {
    return '<div class="f ' + (cls || '') + '"><label>' + esc(label) + '</label>' + inner + '</div>';
  }
  function openModal(html) {
    $('#modalBox').innerHTML = html;
    $('#modal').classList.add('on');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#modal').classList.remove('on');
    document.body.style.overflow = '';
  }

  function downloadFile(name, text, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2500);
  }

  /* ------------------------------------------------------------------ Global Event Delegation */
  document.addEventListener('click', async (e) => {
    const navBtn = e.target.closest('[data-view]');
    if (navBtn) { go(navBtn.dataset.view); return; }

    const gotoBtn = e.target.closest('[data-goto]');
    if (gotoBtn) { go(gotoBtn.dataset.goto); return; }

    const oTab = e.target.closest('[data-ostatus]');
    if (oTab) { oStatus = oTab.dataset.ostatus; renderOrders(); return; }

    const mTab = e.target.closest('[data-mstatus]');
    if (mTab) { mStatus = mTab.dataset.mstatus; renderMessages(); return; }

    if (e.target.closest('[data-close]') || e.target.id === 'modal') { closeModal(); return; }

    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    const id = btn.dataset.id;

    switch (act) {
      case 'chart-range':
        chartRangeDays = +btn.dataset.days || 7;
        renderDash();
        break;

      case 'toggle-p-layout':
        pLayout = pLayout === 'table' ? 'grid' : 'table';
        renderProducts();
        break;

      case 'new-product': openProductModal(null); break;
      case 'edit-product': openProductModal(id); break;
      case 'bulk-modal': openBulkModal(); break;

      case 'dup-product': {
        const src = STATE.products.find((x) => x.id === id);
        if (!src) break;
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = src.id + '-' + Math.random().toString(36).slice(2, 5);
        copy.name = src.name + ' (کپی)';
        try {
          await DB.upsertProduct(SESSION_TOKEN, copy);
          await refreshFromCloud(true);
          toast('کپی محصول در دیتابیس ایجاد شد');
        } catch (err) { toast(err.message, 'err'); }
        break;
      }

      case 'del-product':
        if (confirm('آیا از حذف دائمی این محصول از دیتابیس مطمئن هستید؟')) {
          try {
            await DB.deleteProduct(SESSION_TOKEN, id);
            await refreshFromCloud(true);
            toast('محصول حذف شد');
          } catch (err) { toast(err.message, 'err'); }
        }
        break;

      case 'add-spec': {
        const wrap = $('#specs');
        if (!wrap) break;
        const row = document.createElement('div');
        row.className = 'specrow';
        row.style.cssText = 'display:grid;grid-template-columns:1fr 1.5fr auto;gap:8px;margin-bottom:8px';
        row.innerHTML = '<input data-spec-k placeholder="ویژگی"><input data-spec-v placeholder="مقدار"><button class="mini del" type="button" data-act="del-spec">' + ICO('trash') + '</button>';
        wrap.appendChild(row);
        break;
      }
      case 'del-spec':
        btn.closest('.specrow').remove();
        break;

      case 'new-order-modal': openNewOrderModal(); break;
      case 'view-order': openOrderInspectModal(id); break;
      case 'print-order': printOrderInvoice(id); break;
      case 'resend-bale': {
        btn.disabled = true;
        toast('در حال ارسال عکس و مشخصات سفارش به پیام‌رسان بله…');
        try {
          await DB.resendOrderToBale(SESSION_TOKEN, id);
          await refreshFromCloud(true);
          toast('تصاویر و مشخصات سفارش با موفقیت به بله ارسال شد');
        } catch (err) {
          toast(err.message || 'خطا در ارسال به بله', 'err');
        } finally {
          btn.disabled = false;
        }
        break;
      }
      case 'del-order':
        if (confirm('این سفارش از دیتابیس حذف شود؟')) {
          try {
            await DB.deleteOrder(SESSION_TOKEN, id);
            await refreshFromCloud(true);
            toast('سفارش حذف شد');
          } catch (err) { toast(err.message, 'err'); }
        }
        break;

      case 'export-orders-csv': {
        const header = ['شماره سفارش', 'تاریخ', 'نام مشتری', 'تلفن', 'شهر', 'نشانی', 'شیوه پرداخت', 'مبلغ کل', 'وضعیت'];
        const rows = STATE.orders.map((o) => [
          o.order_code,
          faDate(o.created_at, true),
          '"' + String(o.customer_name || '').replace(/"/g, '""') + '"',
          o.customer_phone,
          o.city || '',
          '"' + String(o.address || '').replace(/"/g, '""') + '"',
          PAY_MAP[o.payment_method] || o.payment_method,
          o.total,
          (ORDER_STATUS[o.status] || ORDER_STATUS.new).label
        ]);
        downloadFile('perans-orders-' + new Date().toISOString().slice(0, 10) + '.csv', '\ufeff' + [header].concat(rows).map((r) => r.join(',')).join('\n'), 'text/csv;charset=utf-8');
        toast('فایل اکسل سفارش‌ها دانلود شد');
        break;
      }

      case 'view-msg': openMessageModal(id); break;
      case 'del-msg':
        if (confirm('این پیام حذف شود؟')) {
          try {
            await DB.deleteMessage(SESSION_TOKEN, id);
            await refreshFromCloud(true);
            toast('پیام حذف شد');
          } catch (err) { toast(err.message, 'err'); }
        }
        break;

      case 'add-cat': {
        const slug = toEn(prompt('شناسه انگلیسی دسته جدید (مثلاً outdoor):') || '').trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
        if (!slug) break;
        const title = (prompt('نام فارسی دسته:') || slug).trim();
        STATE.categories.push({ id: slug, name: title });
        renderCats();
        break;
      }
      case 'move-cat': {
        const idx = +btn.dataset.idx;
        const dir = +btn.dataset.dir;
        const target = idx + dir;
        if (target >= 1 && target < STATE.categories.length) {
          const tmp = STATE.categories[idx];
          STATE.categories[idx] = STATE.categories[target];
          STATE.categories[target] = tmp;
          renderCats();
        }
        break;
      }
      case 'del-cat': {
        const idx = +btn.dataset.idx;
        if (confirm('این دسته حذف شود؟')) {
          STATE.categories.splice(idx, 1);
          renderCats();
        }
        break;
      }
      case 'save-cats': {
        const nextCats = STATE.categories.map((c, i) => ({
          id: ($('[data-cat-id="' + i + '"]') && $('[data-cat-id="' + i + '"]').value.trim()) || c.id,
          name: ($('[data-cat-name="' + i + '"]') && $('[data-cat-name="' + i + '"]').value.trim()) || c.name
        }));
        btn.disabled = true;
        try {
          await DB.saveCategories(SESSION_TOKEN, nextCats);
          await refreshFromCloud(true);
          toast('دسته‌بندی‌ها در دیتابیس ذخیره شد');
        } catch (err) { toast(err.message, 'err'); }
        btn.disabled = false;
        break;
      }

      case 'add-ann':
        STATE.config.announce = STATE.config.announce || [];
        STATE.config.announce.push('پیام اطلاع‌رسانی جدید…');
        renderContent();
        break;
      case 'del-ann':
        STATE.config.announce.splice(+btn.dataset.idx, 1);
        renderContent();
        break;

      case 'save-content': {
        const hero = {
          badge: $('#cHeroBadge').value.trim(),
          t1: $('#cHeroT1').value.trim(),
          t2: $('#cHeroT2').value.trim(),
          t3: $('#cHeroT3').value.trim(),
          lead: $('#cHeroLead').value.trim()
        };
        const stats = (STATE.config.stats || []).map((st, i) => ({
          value: ($('[data-stat-v="' + i + '"]') && $('[data-stat-v="' + i + '"]').value.trim()) || st.value,
          label: ($('[data-stat-l="' + i + '"]') && $('[data-stat-l="' + i + '"]').value.trim()) || st.label
        }));
        const announce = $$('[data-ann-idx]').map((el) => el.value.trim()).filter(Boolean);
        const brand = Object.assign({}, STATE.config.brand || {}, {
          name: $('#cBrandName').value.trim(),
          en: $('#cBrandEn').value.trim(),
          phone: $('#cBrandPhone').value.trim(),
          phoneRaw: toEn($('#cBrandPhoneRaw').value).trim(),
          mobile: $('#cBrandMobile').value.trim(),
          mobileRaw: toEn($('#cBrandMobile').value).trim(),
          email: $('#cBrandEmail').value.trim(),
          address: $('#cBrandAddr').value.trim(),
          hours: $('#cBrandHours').value.trim()
        });
        btn.disabled = true; btn.textContent = 'در حال انتشار…';
        try {
          await DB.saveConfig(SESSION_TOKEN, { hero, stats, announce, brand, note: 'ویرایش محتوای ویترین و اطلاعات تماس' });
          await refreshFromCloud(true);
          toast('محتوای سایت در دیتابیس ذخیره و برای همه بازدیدکنندگان منتشر شد');
        } catch (err) { toast(err.message, 'err'); }
        btn.disabled = false; btn.innerHTML = ICO('save') + ' ذخیره و انتشار فوری در سایت';
        break;
      }

      case 'save-commerce': {
        const nextCommerce = Object.assign({}, STATE.config.commerce || {}, {
          shipping: Math.max(0, +$('#cmShip').value || 0),
          threshold: Math.max(0, +$('#cmThresh').value || 0)
        });
        btn.disabled = true;
        try {
          await DB.saveConfig(SESSION_TOKEN, { commerce: nextCommerce, note: 'تغییر تعرفه ارسال' });
          await refreshFromCloud(true);
          toast('تعرفه ارسال ذخیره شد');
        } catch (err) { toast(err.message, 'err'); }
        btn.disabled = false;
        break;
      }
      case 'add-coupon-modal': openAddCouponModal(); break;
      case 'del-coupon': {
        const code = btn.dataset.code;
        if (STATE.config.commerce && STATE.config.commerce.coupons) {
          delete STATE.config.commerce.coupons[code];
          try {
            await DB.saveConfig(SESSION_TOKEN, { commerce: STATE.config.commerce, note: 'حذف کد تخفیف ' + code });
            await refreshFromCloud(true);
            toast('کد تخفیف حذف شد');
          } catch (err) { toast(err.message, 'err'); }
        }
        break;
      }
      case 'copy-text':
        if (navigator.clipboard) navigator.clipboard.writeText(btn.dataset.text || '').then(() => toast('در کلیپ‌بورد کپی شد'));
        break;

      case 'del-media':
        if (confirm('این تصویر از فضای ابری حذف شود؟')) {
          try {
            await DB.deleteMedia(SESSION_TOKEN, id);
            await refreshFromCloud(true);
            toast('تصویر حذف شد');
          } catch (err) { toast(err.message, 'err'); }
        }
        break;

      case 'bale-pick-chat': {
        const inp = $('#baleChatId');
        if (inp) inp.value = btn.dataset.chatId || '';
        toast('شناسه چت ' + (btn.dataset.chatId || '') + ' انتخاب شد');
        break;
      }

      case 'bale-detect-chat': {
        const tok = ($('#baleToken') && $('#baleToken').value.trim()) || '';
        btn.disabled = true;
        btn.textContent = 'در حال استعلام از سرور بله…';
        try {
          const res = await DB.detectBaleChat(SESSION_TOKEN, tok);
          const box = $('#baleDetectedChats');
          if (res.chats && res.chats.length) {
            if ($('#baleChatId') && !$('#baleChatId').value.trim()) {
              $('#baleChatId').value = res.chats[0].chat_id;
            }
            if (box) {
              box.innerHTML = res.chats.map((ch) =>
                '<button type="button" class="btn btn--ghost btn--sm" data-act="bale-pick-chat" data-chat-id="' + esc(ch.chat_id) + '">' +
                  esc(ch.title) + ' (' + esc(ch.chat_id) + ')' +
                '</button>'
              ).join('');
            }
            toast('ربات @' + ((res.bot && res.bot.username) || '') + ' تأیید و چت شما شناسایی شد!');
          } else {
            toast('ربات تأیید شد، اما هنوز پیامی به ربات نداده‌اید. در بله به ربات خود /start بزنید و دوباره تلاش کنید.', 'err');
          }
        } catch (err) {
          toast(err.message || 'خطا در اتصال به ربات بله', 'err');
        } finally {
          btn.disabled = false;
          btn.innerHTML = ICO('search') + ' شناسایی خودکار آیدی چت من از بله';
        }
        break;
      }

      case 'bale-save':
      case 'bale-test': {
        const tok = ($('#baleToken') && $('#baleToken').value.trim()) || '';
        const chatId = toEn(($('#baleChatId') && $('#baleChatId').value.trim()) || '');
        const siteUrl = ($('#baleSiteUrl') && $('#baleSiteUrl').value.trim()) || 'https://miimdev.github.io/PERANS';
        const payload = {
          bale_enabled: !!(($('#baleEnabled') && $('#baleEnabled').checked)),
          notify_on_order: !!(($('#baleOnOrder') && $('#baleOnOrder').checked)),
          notify_on_message: !!(($('#baleOnMsg') && $('#baleOnMsg').checked)),
          bale_chat_id: chatId,
          site_base_url: siteUrl
        };
        if (tok) payload.bale_bot_token = tok;

        btn.disabled = true;
        const origHtml = btn.innerHTML;
        btn.textContent = act === 'bale-test' ? 'در حال ذخیره و ارسال عکس تست به بله…' : 'در حال ذخیره…';
        try {
          await DB.saveBotSettings(SESSION_TOKEN, payload);
          if (act === 'bale-test') {
            await DB.testBaleBot(SESSION_TOKEN, tok, chatId);
            await refreshFromCloud(true);
            toast('عالی! تصویر مبل و نمونه سفارش با موفقیت به پیام‌رسان بله شما ارسال شد!');
          } else {
            await refreshFromCloud(true);
            toast('تنظیمات ربات بله در سرور ذخیره شد');
          }
        } catch (err) {
          toast(err.message || 'خطا در ذخیره یا تست ربات بله', 'err');
        } finally {
          btn.disabled = false;
          btn.innerHTML = origHtml;
        }
        break;
      }

      case 'save-socials': {
        const brand = Object.assign({}, STATE.config.brand || {}, {
          instagram: $('#stIg').value.trim(),
          whatsapp: $('#stWa').value.trim(),
          telegram: $('#stTg').value.trim(),
          since: $('#stSince').value.trim()
        });
        btn.disabled = true;
        try {
          await DB.saveConfig(SESSION_TOKEN, { brand, note: 'ویرایش شبکه‌های اجتماعی' });
          await refreshFromCloud(true);
          toast('شبکه‌های اجتماعی ذخیره شد');
        } catch (err) { toast(err.message, 'err'); }
        btn.disabled = false;
        break;
      }

      case 'update-creds': {
        const oldPw = $('#secOldPw').value;
        const newPw = $('#secNewPw').value;
        const newPw2 = $('#secNewPw2').value;
        const newUser = $('#secUser').value.trim();
        const disp = $('#secDisplay').value.trim();
        if (!oldPw) { toast('لطفاً رمز عبور فعلی را وارد کنید', 'err'); break; }
        if (newPw && newPw !== newPw2) { toast('رمز عبور جدید و تکرار آن یکسان نیستند', 'err'); break; }
        btn.disabled = true;
        try {
          await DB.updateCredentials(SESSION_TOKEN, {
            currentPassword: oldPw,
            newUsername: newUser,
            newPassword: newPw || null,
            displayName: disp
          });
          await refreshFromCloud(true);
          toast('مشخصات امنیتی مدیر با موفقیت در دیتابیس به‌روز شد');
        } catch (err) { toast(err.message, 'err'); }
        btn.disabled = false;
        break;
      }

      case 'export-json': {
        const snap = {
          exportedAt: new Date().toISOString(),
          brand: STATE.config.brand,
          hero: STATE.config.hero,
          stats: STATE.config.stats,
          announce: STATE.config.announce,
          commerce: STATE.config.commerce,
          categories: STATE.categories,
          products: STATE.products
        };
        downloadFile('perans-cloud-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(snap, null, 2), 'application/json');
        toast('نسخه پشتیبان JSON آماده شد');
        break;
      }
      case 'export-datajs': {
        const payload = {
          version: STATE.config.version || 3,
          updatedAt: new Date().toISOString(),
          brand: STATE.config.brand,
          hero: STATE.config.hero,
          stats: STATE.config.stats,
          announce: STATE.config.announce,
          commerce: STATE.config.commerce,
          categories: STATE.categories.map((c) => ({ id: c.id, name: c.name })),
          products: STATE.products.filter((p) => p.is_active !== false)
        };
        downloadFile('data.js', '/* PERANS — Cloud Snapshot */\nwindow.PERANS_DATA = ' + JSON.stringify(payload, null, 2) + ';\n', 'application/javascript;charset=utf-8');
        toast('فایل data.js دانلود شد');
        break;
      }
      case 'import-json':
        $('#filePick').click();
        break;
    }
  });

  document.addEventListener('change', async (e) => {
    const prodToggle = e.target.closest('[data-act="toggle-prod-active"]');
    if (prodToggle) {
      const p = STATE.products.find((x) => x.id === prodToggle.dataset.id);
      if (!p) return;
      p.is_active = prodToggle.checked;
      try {
        await DB.upsertProduct(SESSION_TOKEN, p);
        await refreshFromCloud(true);
        toast(p.is_active ? 'نمایش محصول در سایت فعال شد' : 'محصول از ویترین سایت مخفی شد');
      } catch (err) { toast(err.message, 'err'); }
      return;
    }

    const ordSel = e.target.closest('[data-act="quick-order-status"]');
    if (ordSel) {
      try {
        await DB.updateOrder(SESSION_TOKEN, ordSel.dataset.id, ordSel.value, null);
        await refreshFromCloud(true);
        toast('وضعیت سفارش در دیتابیس ثبت شد');
      } catch (err) { toast(err.message, 'err'); }
    }
  });

  $('#mediaPick').addEventListener('change', async (e) => {
    await handleMediaFiles(e.target.files);
    e.target.value = '';
  });

  $('#filePick').addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const snap = JSON.parse(String(reader.result));
        if (!snap || !Array.isArray(snap.products)) throw new Error('ساختار فایل پشتیبان معتبر نیست.');
        if (!confirm('آیا مطمئن هستید که می‌خواهید اطلاعات دیتابیس با این فایل جایگزین شود؟')) return;
        await DB.importSnapshot(SESSION_TOKEN, snap);
        await refreshFromCloud(true);
        toast('نسخه پشتیبان با موفقیت در دیتابیس بازگردانی شد');
      } catch (err) {
        toast(err.message || 'خطا در بازگردانی فایل', 'err');
      }
    };
    reader.readAsText(f);
    e.target.value = '';
  });

  /* ------------------------------------------------------------------ Topbar, Theme & Shortcuts */
  function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem(LS_THEME, t); } catch (e) {}
    const ico = $('#themeIco');
    if (ico) ico.innerHTML = '<use href="#a-' + (t === 'dark' ? 'sun' : 'moon') + '"/>';
  }

  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(cur === 'dark' ? 'light' : 'dark');
  });

  $('#syncBtn').addEventListener('click', () => refreshFromCloud(false));

  $('#globalSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim();
    if (!q) return;
    if (/^perans-/i.test(q) || /^09\d/.test(toEn(q))) {
      oQuery = toEn(q);
      if (currentView !== 'orders') go('orders'); else renderOrders();
    } else {
      pQuery = q;
      if (currentView !== 'products') go('products'); else renderProducts();
    }
  });

  function openSide() { $('#side').classList.add('on'); $('#sideBackdrop').classList.add('on'); }
  function closeSide() { $('#side').classList.remove('on'); $('#sideBackdrop').classList.remove('on'); }
  $('#sideOpen').addEventListener('click', openSide);
  $('#sideClose').addEventListener('click', closeSide);
  $('#sideBackdrop').addEventListener('click', closeSide);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeModal(); closeSide(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      const gs = $('#globalSearch');
      if (gs) { gs.focus(); gs.select(); }
    }
  });

  /* ------------------------------------------------------------------ Auth & Boot */
  const loginEl = $('#login');
  const appEl = $('#app');

  function revealCommandCenter() {
    loginEl.classList.add('leave');
    setTimeout(() => { loginEl.style.display = 'none'; }, 680);
    appEl.classList.add('on');
    go('dash');
  }

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const uname = toEn($('#username').value).trim();
    const pw = $('#pw').value;
    const remember = $('#remember').checked;
    const btn = $('#loginBtn');
    const errEl = $('#loginErr');

    if (!uname || !pw) {
      errEl.textContent = 'نام کاربری و رمز عبور را وارد کنید.';
      return;
    }

    errEl.textContent = '';
    btn.disabled = true;
    btn.innerHTML = '<span>در حال احراز هویت ابری…</span>';

    try {
      const res = await DB.login(uname, pw, remember);
      saveLocalToken(res.token, res.expires_at);
      const ok = await refreshFromCloud(true);
      if (ok) {
        revealCommandCenter();
        toast('خوش آمدید، ' + (res.admin && res.admin.display_name ? res.admin.display_name : uname));
      }
    } catch (err) {
      const card = loginEl.querySelector('.login__card');
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
      errEl.textContent = err.message || 'نام کاربری یا رمز عبور نادرست است.';
      btn.disabled = false;
      btn.innerHTML = '<span>ورود به مرکز فرماندهی</span>' + ICO('out');
      $('#pw').select();
    }
  });

  $('#eye').addEventListener('click', () => {
    const inp = $('#pw');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    $('#eye').style.color = inp.type === 'text' ? 'var(--gold-lt)' : '';
  });

  $('#logout').addEventListener('click', async () => {
    try { if (SESSION_TOKEN) await DB.logout(SESSION_TOKEN); } catch (e) {}
    clearLocalToken();
    location.reload();
  });

  (async function boot() {
    let savedTheme = 'dark';
    try { savedTheme = localStorage.getItem(LS_THEME) || 'dark'; } catch (e) {}
    applyTheme(savedTheme);

    const existingToken = readLocalToken();
    if (existingToken) {
      SESSION_TOKEN = existingToken;
      const ok = await refreshFromCloud(true);
      if (ok) {
        loginEl.style.display = 'none';
        appEl.classList.add('on');
        go('dash');
        return;
      }
      clearLocalToken();
    }
    setTimeout(() => { const u = $('#username'); if (u) u.focus(); }, 300);
  })();
})();
