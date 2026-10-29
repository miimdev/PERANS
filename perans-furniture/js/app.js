/* =========================================================
   مبل پرنس — Prince Furniture
   Vanilla JS app: router, catalog, cart, checkout, UI motion
   ========================================================= */
(function () {
  'use strict';

  /* ---------- helpers ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const FA = ['۰','۱','۲','۳','۴','۵','۶','۷','۸','۹'];
  const toFa = (v) => String(v).replace(/\d/g, (d) => FA[+d]);
  const toEn = (v) => String(v).replace(/[۰-۹]/g, (d) => String(FA.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
  const fmt = (n) => toFa(Math.round(n).toLocaleString('en-US'));
  const money = (n) => fmt(n) + ' تومان';
  const stars = (n = 5) => '<span class="stars" aria-hidden="true">' + '<svg><use href="#i-star"/></svg>'.repeat(n) + '</span>';
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const mq = (q) => (typeof window.matchMedia === 'function' ? window.matchMedia(q) : { matches: false });
  const reduce = mq('(prefers-reduced-motion: reduce)').matches;
  const escHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const COLOR_NAMES = {
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
  const colorLabel = (hex) => {
    if (!hex) return 'رنگ نمایشگاه';
    const k = String(hex).trim().toLowerCase();
    return COLOR_NAMES[k] || ('کد رنگ ' + k.replace('#', '').toUpperCase());
  };
  const COORD_LABELS = {
    phone_consult: 'هماهنگی تلفنی با کارشناس فروش',
    showroom_visit: 'مراجعه حضوری به نمایشگاه بیرجند',
    installment_plan: 'درخواست شرایط اقساطی (بدون سود)',
    installment: 'شرایط اقساطی (بدون سود)',
    cod: 'هماهنگی حضوری / هنگام تحویل',
    online: 'ثبت اینترنتی سفارش'
  };

  /* ---------- data ---------- */
  const BUILTIN_CATS = [
    { id: 'all', name: 'همه محصولات' },
    { id: 'modern', name: 'مبل راحتی' },
    { id: 'classic', name: 'کلاسیک و استیل' },
    { id: 'dining', name: 'ناهارخوری' },
    { id: 'bedroom', name: 'اتاق خواب' },
    { id: 'decor', name: 'دکور و روشنایی' }
  ];
  const catName = (id) => (CATS.find((c) => c.id === id) || {}).name || '';

  const C = {
    emerald: '#123f34', forest: '#274d3f', navy: '#22283a', charcoal: '#3a3733',
    camel: '#b58a5c', sand: '#ddcbb0', cream: '#efe7d8', grey: '#b9b4ad',
    walnut: '#5a3d2b', ochre: '#c58b2d'
  };

  const BUILTIN_PRODUCTS = [
    {
      id: 'royal', name: 'مبل راحتی رویال', cat: 'modern', img: 'p1',
      price: 84500000, old: 92000000, rating: 4.9, reviews: 312, badge: 'پرفروش', badgeClass: 'sale',
      colors: [C.emerald, C.camel, C.cream, C.charcoal],
      desc: 'رویال، پرچم‌دار مجموعه‌ی پرنس است: مخمل ایتالیایی با تراکم بالا، نشیمن سه‌نفره‌ی عمیق و پایه‌های برنجی؛ محبوب‌ترین مدل فروشگاه پرنس برای نشیمن‌هایی که مهمان‌ها در آن می‌مانند.',
      tags: ['مخمل ضدلکه', 'پایه برنج', '۳ نفره', 'اسفنج سرد'],
      specs: { 'ابعاد': '۲۳۰ × ۹۵ × ۸۲ سانتی‌متر', 'جنس بدنه': 'راش خشک‌شده + تخته MDF ضدآب', 'پارچه': 'مخمل ایتالیایی ضدلکه', 'وزن': '۹۸ کیلوگرم', 'ضمانت': '۵ سال سازه / ۲ سال پارچه (برند سازنده)', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'nobel', name: 'مبل راحتی نُبل', cat: 'modern', img: 'p2',
      price: 62900000, old: null, rating: 4.8, reviews: 208, badge: 'جدید', badgeClass: 'new',
      colors: [C.grey, C.cream, C.forest, C.sand],
      desc: 'خطوط منحنی و حجم‌های نرم نُبل، نشیمن‌های کوچک را بزرگ‌تر نشان می‌دهد. پارچه‌ی بوکله با بافت درشت و پایه‌های چوب گردو، حس آرامش را به خانه می‌آورد.',
      tags: ['پارچه بوکله', 'پایه چوب گردو', '۳ نفره', 'ارسال سریع'],
      specs: { 'ابعاد': '۲۴۵ × ۹۰ × ۷۸ سانتی‌متر', 'جنس بدنه': 'چوب راش + فنر بونل', 'پارچه': 'بوکله بلژیکی', 'وزن': '۸۶ کیلوگرم', 'ضمانت': '۵ سال سازه', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'monaco', name: 'صندلی موناکو', cat: 'classic', img: 'p3',
      price: 32400000, old: 36800000, rating: 4.9, reviews: 146, badge: 'پیشنهاد', badgeClass: '',
      colors: [C.ochre, C.emerald, C.cream, C.walnut],
      desc: 'موناکو با قالب چوب گردو و دوخت واکس‌خورده، همان صندلی است که در عکس‌های خانه‌های کلاسیک دنبالش بودید؛ اما روی نشیمن آن می‌توانید ساعت‌ها بنشینید.',
      tags: ['چوب گردو', 'مخمل دوره‌ای', 'تک‌نفره', 'چوب گردو'],
      specs: { 'ابعاد': '۸۲ × ۸۵ × ۷۸ سانتی‌متر', 'جنس بدنه': 'گردوی منبت‌کاری‌شده', 'پارچه': 'مخمل دوره‌ای', 'وزن': '۲۴ کیلوگرم', 'ضمانت': '۵ سال', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'marble', name: 'میز ناهارخوری مرمرین', cat: 'dining', img: 'p4',
      price: 54800000, old: 61000000, rating: 4.7, reviews: 189, badge: 'تخفیف', badgeClass: 'sale',
      colors: [C.cream, C.sand, C.charcoal, C.walnut],
      desc: 'صفحه‌ی سنگ مرمر با رگه‌های یکتا، روی پایه‌ی برنجی با پوشش مقاوم که اثر انگشت نمی‌گیرد. ظرفیت شش نفر با فضای کافی برای دیس مهمانی.',
      tags: ['مرمر طبیعی', 'پایه برنج', '۶ نفره', 'پوشش نانو'],
      specs: { 'ابعاد': '۱۸۰ × ۹۰ × ۷۶ سانتی‌متر', 'جنس بدنه': 'مرمر طبیعی + برنج', 'پارچه': '—', 'وزن': '۱۱۰ کیلوگرم', 'ضمانت': '۵ سال', 'زمان ارسال': '۳ تا ۵ روز کاری' }
    },
    {
      id: 'queen', name: 'تخت خواب کوئین', cat: 'bedroom', img: 'p5',
      price: 68000000, old: 74000000, rating: 4.9, reviews: 241, badge: 'پرفروش', badgeClass: 'sale',
      colors: [C.sand, C.cream, C.grey, C.forest],
      desc: 'پشتی قوس‌دار کوئین با رویه‌ی پارچه‌ی کتان شسته، ستون فقرات اتاق خواب شماست. زیر تخت، کشوی جادار و سیستم مهار تشک ضد صدا دارد.',
      tags: ['کتان شسته', 'کشوی مخفی', 'دو نفره', 'پشتی قوس‌دار'],
      specs: { 'ابعاد': '۲۱۰ × ۱۸۰ × ۱۲۰ سانتی‌متر', 'جنس بدنه': 'راش + ام‌دی‌اف روکش', 'پارچه': 'کتان شسته ضدلکه', 'وزن': '۹۲ کیلوگرم', 'ضمانت': '۵ سال', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'loma', name: 'میز جلومبلی لوما', cat: 'decor', img: 'p6',
      price: 21900000, old: null, rating: 4.8, reviews: 97, badge: null,
      colors: [C.cream, C.charcoal, C.walnut],
      desc: 'ترکیب مرمر کرم و برنج مات در دو طبقه؛ لومای بزرگ با میز کنار کوچکش، ستاره‌ی هر نشیمنی است که با آن عکس می‌گیرند.',
      tags: ['مرمر', 'برنج مات', 'ست دو تکه'],
      specs: { 'ابعاد': 'قطر ۹۰ / ۴۵ سانتی‌متر', 'جنس بدنه': 'مرمر + فولاد برنجی', 'پارچه': '—', 'وزن': '۳۸ کیلوگرم', 'ضمانت': '۳ سال', 'زمان ارسال': '۱ تا ۳ روز کاری' }
    },
    {
      id: 'versailles', name: 'کمد دیواری ورسای', cat: 'bedroom', img: 'p7',
      price: 47500000, old: null, rating: 4.6, reviews: 64, badge: null,
      colors: [C.walnut, C.cream, C.charcoal],
      desc: 'درهای شیاردار با دستگیره‌های برنجی و داخل‌بندی ماژولار: قفسه‌های جابه‌جاشو، ریل نرم‌بند و نور داخلی هوشمند.',
      tags: ['چوب گردو', 'درهای شیاردار', 'نور داخلی'],
      specs: { 'ابعاد': '۲۲۰ × ۱۲۰ × ۶۰ سانتی‌متر', 'جنس بدنه': 'روکش گردوی طبیعی', 'پارچه': '—', 'وزن': '۱۴۵ کیلوگرم', 'ضمانت': '۵ سال', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'tolou', name: 'آباژور ایستاده طلوع', cat: 'decor', img: 'p8',
      price: 8900000, old: 10500000, rating: 4.7, reviews: 118, badge: 'جدید', badgeClass: 'new',
      colors: [C.cream, C.charcoal, C.walnut],
      desc: 'نور گرم و پخش‌شده با عابرباش کتان و بازوی برنجی نازک؛ طلوع، گوشه‌ی مطالعه را به گرم‌ترین نقطه‌ی خانه تبدیل می‌کند.',
      tags: ['کتان', 'برنج', 'دیمردار'],
      specs: { 'ابعاد': 'ارتفاع ۱۶۵ سانتی‌متر', 'جنس بدنه': 'برنج + کتان', 'پارچه': '—', 'وزن': '۸ کیلوگرم', 'ضمانت': '۲ سال', 'زمان ارسال': '۱ تا ۳ روز کاری' }
    },
    {
      id: 'arya', name: 'مبل دونفره آریا', cat: 'modern', img: 'p2',
      price: 48900000, old: null, rating: 4.8, reviews: 132, badge: null,
      colors: [C.grey, C.forest, C.sand, C.cream],
      desc: 'همان راحتی نُبل، در ابعادی که برای آپارتمان‌های کوچک مناسب است. آریا در دو نسخه‌ی کنسول چپ و راست موجود است.',
      tags: ['۲ نفره', 'پارچه ضدلکه', 'دو نسخه چپ/راست'],
      specs: { 'ابعاد': '۱۷۰ × ۸۸ × ۷۸ سانتی‌متر', 'جنس بدنه': 'راش + فنر', 'پارچه': 'بوکله', 'وزن': '۶۲ کیلوگرم', 'ضمانت': '۵ سال', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'baroque', name: 'صندلی ناهارخوری باروک', cat: 'dining', img: 'p3',
      price: 12400000, old: null, rating: 4.6, reviews: 87, badge: null,
      colors: [C.ochre, C.cream, C.charcoal, C.walnut],
      desc: 'صندلی باروک با پشتی بلند و دوخت میخ‌کوبی؛ انتخاب‌شده برای نشستن‌های طولانی سر میز.',
      tags: ['تک‌نفره', 'میخ‌کوبی', 'چوب گردو'],
      specs: { 'ابعاد': '۴۸ × ۵۵ × ۱۰۰ سانتی‌متر', 'جنس بدنه': 'گردو', 'پارچه': 'مخمل ضدلکه', 'وزن': '۱۱ کیلوگرم', 'ضمانت': '۵ سال', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'princess', name: 'تخت خواب پرنسس', cat: 'bedroom', img: 'p5',
      price: 29900000, old: null, rating: 4.8, reviews: 74, badge: null,
      colors: [C.cream, C.sand, C.grey],
      desc: 'تخت یک‌نفره با پشتی گرد و پایه‌های کوتاه چوبی، برای اتاق‌های کوچک و نورگیر؛ نسخه‌ی دارای کشوی زیر تخت هم موجود است.',
      tags: ['یک نفره', 'پشتی گرد', 'کشوی زیر تخت'],
      specs: { 'ابعاد': '۲۰۰ × ۹۰ × ۱۰۵ سانتی‌متر', 'جنس بدنه': 'راش', 'پارچه': 'کتان شسته', 'وزن': '۵۴ کیلوگرم', 'ضمانت': '۵ سال', 'زمان ارسال': '۲ تا ۴ روز کاری' }
    },
    {
      id: 'milano', name: 'ست جلومبلی میلانو', cat: 'decor', img: 'p6',
      price: 16700000, old: 18900000, rating: 4.5, reviews: 53, badge: null,
      colors: [C.cream, C.walnut, C.charcoal],
      desc: 'سه میز با ارتفاع‌های مختلف که می‌توانید کنار هم یا جدا بچینید؛ صفحه‌ی مرمر و پایه‌ی برنجی با پوشش ضدخش.',
      tags: ['ست سه تکه', 'مرمر', 'برنج'],
      specs: { 'ابعاد': 'قطر ۶۰ / ۴۵ / ۳۵ سانتی‌متر', 'جنس بدنه': 'مرمر + برنج', 'پارچه': '—', 'وزن': '۲۶ کیلوگرم', 'ضمانت': '۳ سال', 'زمان ارسال': '۱ تا ۳ روز کاری' }
    }
  ];

  const BUILTIN_QUOTES = [];

  const BUILTIN_COMMERCE = { shipping: 1200000, threshold: 20000000, coupons: { PERANS10: 0.1 } };

  /* ==================================================================
     CMS — داده‌های پنل مدیریت
     اولویت: localStorage (پیش‌نمایش زنده از پنل) ← data.js ← پیش‌فرض‌ها
     ================================================================== */
  const DEFAULTS = {
    version: 2,
    brand: {
      name: 'مبل پرنس', en: 'PERANS', tagline: 'فروشگاه مبلمان پرنس — بیرجند',
      phone: '09159598518', phoneRaw: '09159598518',
      mobile: '09159598518', mobileRaw: '09159598518',
      address: 'خیابان انقلاب، نبش انقلاب ۳',
      hours: 'همه‌روزه ۹ تا ۲۱ — جمعه‌ها ۱۶ تا ۲۱',
      email: '', instagram: 'https://instagram.com/PERANS_FURNITURE', whatsapp: '',
      telegram: '',
      since: '۱۳۷۲', sinceEn: '1993'
    },
    hero: {
      badge: 'PERANS · بیرجند · برای خانه‌ای که امضای شماست',
      t1: 'خانه‌ات را', t2: 'خاص‌تر بچین؛', t3: 'با امضای پرنس.',
      lead: 'از نشیمنِ صمیمی تا پذیراییِ چشم‌گیر؛ مدل‌های منتخب مبل، ناهارخوری، اتاق خواب و دکور را کنار هم ببینید و برای فضای خودتان انتخاب کنید.'
    },
    stats: [
      { value: 'راحتی', label: 'برای نشیمن' },
      { value: 'کلاسیک', label: 'برای پذیرایی' },
      { value: 'ناهارخوری', label: 'برای دورهمی' },
      { value: 'دکور', label: 'برای جزئیات خانه' }
    ],
    announce: [
      'برای هماهنگی خرید و بازدید، با ما تماس بگیرید',
      'شعبه‌ی مرکزی: خیابان انقلاب، نبش انقلاب ۳',
      'PERANS_FURNITURE را در اینستاگرام دنبال کنید'
    ],
    categories: BUILTIN_CATS,
    products: BUILTIN_PRODUCTS,
    commerce: BUILTIN_COMMERCE
  };
  window.PERANS_DEFAULTS = DEFAULTS;

  const CMS = (function () {
    const source = (window.PERANS_DATA && typeof window.PERANS_DATA === 'object') ? window.PERANS_DATA : {};
    try {
      const ls = localStorage.getItem('perans_site_data');
      if (ls) {
        const o = JSON.parse(ls);
        if (o && typeof o === 'object') {
          /* داده‌های نسخه‌ی پیشین فقط یک‌بار به محتوای تأییدشده‌ی جدید منتقل می‌شوند. */
          if ((+o.version || 1) < (+source.version || 2)) {
            return Object.assign({}, o, {
              version: source.version,
              brand: Object.assign({}, o.brand || {}, source.brand || {}),
              hero: Object.assign({}, source.hero || {}),
              stats: Array.isArray(source.stats) ? source.stats : [],
              announce: Array.isArray(source.announce) ? source.announce : [],
              quotes: []
            });
          }
          return o;
        }
      }
    } catch (e) {}
    return source;
  })();
  let CMS_ON = !!(CMS && (CMS.products || CMS.brand || CMS.hero));

  let CATS = (Array.isArray(CMS.categories) && CMS.categories.length) ? CMS.categories : BUILTIN_CATS;
  let PRODUCTS = (Array.isArray(CMS.products) && CMS.products.length) ? CMS.products : BUILTIN_PRODUCTS;
  let THRESHOLD = (CMS.commerce && +CMS.commerce.threshold) || BUILTIN_COMMERCE.threshold;
  let SHIPPING = (CMS.commerce && +CMS.commerce.shipping) || BUILTIN_COMMERCE.shipping;
  let COUPONS = (CMS.commerce && CMS.commerce.coupons) || BUILTIN_COMMERCE.coupons;

  /* متن‌های قابل ویرایش از پنل */
  function applyCms() {
    if (!CMS_ON) return;
    const setText = (sel, val) => { if (!val) return; $$(sel).forEach((el) => { el.textContent = val; }); };
    const B = CMS.brand || {}, H = CMS.hero || {};
    setText('[data-cms="heroBadge"]', H.badge);
    setText('[data-cms="heroT1"]', H.t1);
    setText('[data-cms="heroT2"]', H.t2);
    setText('[data-cms="heroT3"]', H.t3);
    setText('[data-cms="heroLead"]', H.lead);
    $$('[data-cms="phone"]').forEach((el) => {
      if (!B.phone) return;
      /* اگر خودش <bdi> است فقط متن را عوض کن تا تودرتو نشود */
      if (el.tagName === 'BDI') { el.textContent = B.phone; return; }
      if (el.tagName === 'A' && B.phoneRaw) el.href = 'tel:' + B.phoneRaw;
      el.innerHTML = '<bdi dir="ltr">' + B.phone + '</bdi>';
    });
    setText('[data-cms="address"]', B.address);
    setText('[data-cms="hours"]', B.hours);
    setText('[data-cms="email"]', B.email);
    setText('[data-cms="mobile"]', B.mobile);
    $$('[data-cms="phoneLink"]').forEach((a) => { if (B.phoneRaw) a.href = 'tel:' + B.phoneRaw; });
    $$('[data-cms="mobileLink"]').forEach((a) => { if (B.mobileRaw) a.href = 'tel:' + B.mobileRaw; });
    $$('[data-cms="emailLink"]').forEach((a) => { if (B.email) a.href = 'mailto:' + B.email; });
    $$('[data-cms-instagram]').forEach((a) => {
      if (!B.instagram) return;
      a.href = B.instagram;
      /* اگر لینک فقط آیکون دارد دست نمی‌زنیم؛ فقط متن را (در صورت وجود) به‌روز می‌کنیم */
      const handle = '@' + (B.instagram.split('/').filter(Boolean).pop() || '');
      const txt = a.querySelector('.ft__social-txt');
      if (txt) { txt.textContent = handle; return; }              /* فوتر: آیکون + متن */
      if (!a.querySelector('svg') && (!a.textContent.trim() || a.textContent.trim().indexOf('@') === 0)) {
        a.innerHTML = '<bdi dir="ltr">' + handle + '</bdi>';
      }
    });

    if (Array.isArray(CMS.stats) && CMS.stats.length) {
      const cells = $$('.hero-stats > div');
      CMS.stats.slice(0, cells.length).forEach((st, i) => {
        const b = cells[i].querySelector('b'), sp = cells[i].querySelector('span');
        if (b && st.value != null) b.textContent = st.value;
        if (sp && st.label != null) sp.textContent = st.label;
      });
    }
    if (Array.isArray(CMS.announce) && CMS.announce.length) {
      const ticker = $('#ann .ann__ticker');
      if (ticker) {
        ticker.innerHTML = CMS.announce.map((t, i) =>
          '<span class="ann__slide" style="--i:' + i + '">' +
            '<svg aria-hidden="true"><use href="#i-sparkle"/></svg>' + t +
          '</span>').join('');
        ticker.style.setProperty('--total', String(CMS.announce.length));
      }
    }
  }

  /* ---------- هم‌گام‌سازی زنده با پنل مدیریت ---------- */
  function readCmsRaw() {
    try {
      const raw = localStorage.getItem('perans_site_data');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function syncCms(silent) {
    const o = readCmsRaw();
    if (!o || typeof o !== 'object') return false;
    if (Array.isArray(o.products) && o.products.length) PRODUCTS = o.products;
    if (Array.isArray(o.categories) && o.categories.length) CATS = o.categories;
    if (o.commerce) {
      if (o.commerce.threshold != null && !isNaN(+o.commerce.threshold)) THRESHOLD = +o.commerce.threshold;
      if (o.commerce.shipping != null && !isNaN(+o.commerce.shipping)) SHIPPING = +o.commerce.shipping;
      if (o.commerce.coupons) COUPONS = o.commerce.coupons;
    }
    Object.keys(o).forEach((k) => { CMS[k] = o[k]; });
    CMS_ON = true;
    applyCms();
    try { renderHome(); } catch (e) {}
    try { fillMegaMeta(); } catch (e) {}
    try { route(); } catch (e) {}
    if (!silent) toast('محتوای سایت از پنل مدیریت به‌روز شد');
    return true;
  }

  async function pullCloudStorefront() {
    if (!window.PERANS_DB || typeof window.PERANS_DB.getStorefront !== 'function') return;
    try {
      const remote = await window.PERANS_DB.getStorefront();
      if (remote && Array.isArray(remote.products) && remote.products.length) {
        try { localStorage.setItem('perans_site_data', JSON.stringify(remote)); } catch (e) {}
        syncCms(true);
      }
    } catch (e) {}
  }

  function initCmsSync() {
    window.addEventListener('storage', (e) => {
      if (e.key === 'perans_site_data') syncCms();
    });
    try {
      const bc = new BroadcastChannel('perans-cms');
      bc.onmessage = (e) => {
        if (!e.data || e.data.type !== 'ping') {
          if (!syncCms()) pullCloudStorefront();
        }
      };
      window.addEventListener('beforeunload', () => { try { bc.close(); } catch (err) {} });
    } catch (e) {}
    pullCloudStorefront();
  }

  /* ثبت سفارش‌ها برای پنل مدیریت */
  function pushOrder(order) {
    try {
      const list = JSON.parse(localStorage.getItem('perans_orders') || '[]');
      list.unshift(order);
      localStorage.setItem('perans_orders', JSON.stringify(list.slice(0, 80)));
    } catch (e) {}
  }

  /* ---------- state ---------- */
  let cart = load('perans_cart', []);
  let wish = load('perans_wish', []);
  let coupon = load('perans_coupon', null);
  const shopState = { cat: 'all', q: '', sort: 'featured' };
  const homeState = { cat: 'all' };

  /* ---------- images ---------- */
  const imgSrc = (key) => {
    if (!key) return '';
    if (/^(data:|https?:|images\/|\.\.?\/)/.test(key)) return key;
    return (window.IMG && window.IMG[key]) ? window.IMG[key] : ('images/' + key + '.jpg');
  };
  function hydrate(root = document) {
    $$('[data-img]', root).forEach((img) => {
      const key = img.getAttribute('data-img');
      const src = imgSrc(key);
      if (src && img.getAttribute('src') !== src) img.src = src;
    });
  }

  /* ---------- toasts ---------- */
  function toast(msg, ok = true) {
    const box = $('#toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + (ok ? 'ok' : '');
    el.innerHTML = '<svg aria-hidden="true"><use href="#' + (ok ? 'i-check' : 'i-sparkle') + '"/></svg><span>' + msg + '</span>';
    box.appendChild(el);
    requestAnimationFrame(() => el.classList.add('on'));
    setTimeout(() => { el.classList.remove('on'); setTimeout(() => el.remove(), 450); }, 3200);
  }

  /* ---------- reveal on scroll ---------- */
  let revealIO = null;
  function observeReveals(root = document) {
    if (!('IntersectionObserver' in window)) { $$('[data-reveal]', root).forEach((e) => e.classList.add('in')); return; }
    if (!revealIO) {
      revealIO = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); revealIO.unobserve(en.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    }
    $$('[data-reveal]', root).forEach((el) => { if (!el.classList.contains('in')) revealIO.observe(el); });
  }

  /* ---------- counters ---------- */
  function initCounters() {
    $$('[data-count]').forEach((el) => {
      if (el.dataset.done) return;
      const target = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      const run = () => {
        el.dataset.done = '1';
        if (reduce) { el.textContent = fmt(target) + suffix; return; }
        const t0 = performance.now(), dur = 1500;
        const tick = (t) => {
          const p = Math.min(1, (t - t0) / dur);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(Math.round(target * e)) + (p === 1 ? suffix : '');
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(); io.disconnect(); } }), { threshold: 0.4 });
        io.observe(el);
      } else run();
    });
  }

  /* ---------- hero: thumb switcher + parallax ---------- */
  function initHero() {
    const shot = $('#heroShot');
    const thumbs = $$('.hero-thumb');
    if (!shot || !thumbs.length) return;
    const cap = $('#heroCap');
    const visual = $('.hero-visual');
    let busy = false, timer = null;

    const pick = (btn) => {
      if (busy || btn.classList.contains('on')) return;
      busy = true;
      thumbs.forEach((b) => b.classList.toggle('on', b === btn));
      const key = btn.dataset.hero;
      if (cap) cap.textContent = btn.dataset.name || '';
      /* کارت کوچک روی تصویر، همراه با محصولِ نمایش‌داده‌شده عوض می‌شود */
      const prod = PRODUCTS.find((p) => p.img === key) || PRODUCTS[0];
      const miniName = document.querySelector('.hero-mini b');
      const miniPrice = document.querySelector('.hero-mini small');
      if (prod && miniName && miniPrice) {
        miniName.textContent = prod.name.replace(/^(مبل راحتی|مبل|صندلی|میز ناهارخوری|تخت خواب)\s*/, '') || prod.name;
        miniPrice.textContent = fmt(prod.price);
      }
      shot.classList.add('is-swapping');
      setTimeout(() => {
        const src = imgSrc(key);
        if (src) shot.src = src;
        shot.setAttribute('data-img', key);
        shot.classList.remove('is-swapping');
        busy = false;
      }, 250);
    };

    thumbs.forEach((btn) => {
      btn.addEventListener('click', () => { pick(btn); restart(); });
      btn.addEventListener('mouseenter', () => { if (window.matchMedia('(hover:hover)').matches) pick(btn); });
    });

    function restart() {
      clearInterval(timer);
      if (reduce) return;
      timer = setInterval(() => {
        const list = $$('.hero-thumb');
        const i = list.findIndex((b) => b.classList.contains('on'));
        pick(list[(i + 1) % list.length]);
      }, 6200);
    }
    if (visual) {
      visual.addEventListener('mouseenter', () => clearInterval(timer));
      visual.addEventListener('mouseleave', restart);
      if (!reduce) {
        visual.addEventListener('mousemove', (e) => {
          const r = visual.getBoundingClientRect();
          const dx = (e.clientX - r.left) / r.width - 0.5;
          const dy = (e.clientY - r.top) / r.height - 0.5;
          $$('.hero-mini, .seal').forEach((el, i) => {
            const k = i % 2 ? -1 : 1;
            el.style.translate = (dx * 12 * k).toFixed(1) + 'px ' + (dy * 10 * k).toFixed(1) + 'px';
          });
        });
        visual.addEventListener('mouseleave', () => {
          $$('.hero-mini, .seal').forEach((el) => { el.style.translate = ''; });
        });
      }
    }
    restart();
  }

  /* ---------- footer wordmark ---------- */
  function initWordmark() {
    const wm = document.querySelector('.ft__brandmark');
    if (!wm || wm.dataset.wm) return;
    wm.dataset.wm = '1';
    if (!('IntersectionObserver' in window)) { wm.classList.add('is-in'); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => { if (e.isIntersecting) { wm.classList.add('is-in'); io.disconnect(); } });
    }, { threshold: 0.25 });
    io.observe(wm);
  }

  /* ---------- marquee ---------- */
  function buildMarquee() {
    const items = ['فروشگاه مبلمان در بیرجند', 'ارسال و نصب رایگان در بیرجند', 'ضمانت اصالت کالا', '۱۲ برند معتبر', 'ارسال سریع', 'مشاوره‌ی چیدمان رایگان'];
    const one = items.map((t) => '<span><svg aria-hidden="true"><use href="#i-sparkle"/></svg>' + t + '</span>').join('');
    $('#marqueeTrack').innerHTML = one + one;
  }

  /* ---------- product cards ---------- */
  function colorDots(colors) {
    return '<span class="colors" aria-hidden="true">' + colors.slice(0, 4).map((c) => '<i style="background:' + c + '"></i>').join('') + '</span>';
  }
  function cardHTML(p) {
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    const badge = p.badge ? '<span class="card-badge ' + (p.badgeClass || '') + '">' + p.badge + (off && p.badgeClass === 'sale' ? ' · ' + toFa(off) + '٪' : '') + '</span>' : '';
    return '<article class="card" data-reveal>' +
      '<div class="card-media">' +
        '<a href="#/product/' + p.id + '" aria-label="' + p.name + '"><img data-img="' + p.img + '" alt="' + p.name + '" loading="lazy"></a>' +
        badge +
        '<button class="wish ' + (wish.includes(p.id) ? 'on' : '') + '" data-wish="' + p.id + '" aria-label="افزودن ' + p.name + ' به علاقه‌مندی‌ها"><svg aria-hidden="true"><use href="#i-heart"/></svg></button>' +
        '<div class="quick">' +
          '<button class="btn btn-dark" data-add="' + p.id + '"><svg aria-hidden="true"><use href="#i-cart"/></svg> انتخاب برای سفارش</button>' +
          '<a class="btn btn-ghost btn-icon" href="#/product/' + p.id + '" aria-label="مشاهده‌ی ' + p.name + '"><svg aria-hidden="true"><use href="#i-arrow-left"/></svg></a>' +
        '</div>' +
      '</div>' +
      '<div class="card-body">' +
        '<span class="card-cat">' + catName(p.cat) + '</span>' +
        '<a href="#/product/' + p.id + '" class="card-name">' + p.name + '</a>' +
        (p.reviews ? '<span class="card-rate">' + stars(5) + ' ' + toFa(p.rating) + '<span class="card-rev"> · ' + fmt(p.reviews) + ' نظر</span></span>' : '') +
        '<div class="card-foot">' +
          '<div class="price">' + fmt(p.price) + '<small>تومان</small></div>' +
          (p.old ? '<div class="price-old">' + fmt(p.old) + '</div>' : colorDots(p.colors)) +
        '</div>' +
      '</div>' +
    '</article>';
  }
  function renderInto(el, list) {
    if (!el) return;
    el.innerHTML = list.length ? list.map(cardHTML).join('') :
      '<div class="empty-state"><svg aria-hidden="true"><use href="#i-search"/></svg><p>محصولی با این مشخصات پیدا نشد. فیلترها را تغییر دهید.</p></div>';
    hydrate(el);
    observeReveals(el);
  }

  function filtered(list, state) {
    let out = list.slice();
    if (state.cat && state.cat !== 'all') out = out.filter((p) => p.cat === state.cat);
    if (state.q) {
      const q = toEn(state.q).toLowerCase().trim();
      out = out.filter((p) => (p.name + ' ' + catName(p.cat) + ' ' + p.tags.join(' ') + ' ' + p.desc).toLowerCase().includes(q) ||
        toEn(p.name).includes(q));
    }
    switch (state.sort) {
      case 'cheap': out.sort((a, b) => a.price - b.price); break;
      case 'expensive': out.sort((a, b) => b.price - a.price); break;
      case 'new': out.sort((a, b) => (b.badgeClass === 'new') - (a.badgeClass === 'new')); break;
      default: out.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
    }
    return out;
  }

  function chipsHTML(active) {
    return CATS.map((c) => '<button class="chip ' + (c.id === active ? 'on' : '') + '" data-cat="' + c.id + '" role="tab" aria-selected="' + (c.id === active) + '">' + c.name + '</button>').join('');
  }

  /* ---------- products rendering ---------- */
  function renderHome() {
    const grid = $('#homeGrid');
    const list = filtered(PRODUCTS, { cat: homeState.cat, q: '', sort: 'featured' }).slice(0, 8);
    renderInto(grid, list);
    $('#homeChips').innerHTML = chipsHTML(homeState.cat);
  }
  function renderShop() {
    const list = filtered(PRODUCTS, shopState);
    renderInto($('#shopGrid'), list);
    $('#shopChips').innerHTML = chipsHTML(shopState.cat);
    $('#shopCount').textContent = toFa(list.length) + ' محصول' + (shopState.q ? ' برای «' + shopState.q + '»' : '') + (shopState.cat !== 'all' ? ' در ' + catName(shopState.cat) : '');
    $('#clearFilters').style.display = (shopState.cat !== 'all' || shopState.q) ? 'inline-flex' : 'none';
    $('#shopSearch').value = shopState.q;
    const sortSel = $('#shopSort');
    if (sortSel) sortSel.value = shopState.sort;
  }

  /* ---------- product page ---------- */
  function renderProduct(id) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) { location.hash = '#/shop'; return; }
    const off = p.old ? Math.round((1 - p.price / p.old) * 100) : 0;
    document.title = p.name + ' | مبل پرنس';
    $('#pdCrumb').innerHTML = '<a href="#/">خانه</a><svg aria-hidden="true"><use href="#i-chevron-left"/></svg><a href="#/shop">فروشگاه</a><svg aria-hidden="true"><use href="#i-chevron-left"/></svg><a href="#/shop?cat=' + p.cat + '">' + catName(p.cat) + '</a><svg aria-hidden="true"><use href="#i-chevron-left"/></svg><span>' + p.name + '</span>';

    $('#pdWrap').innerHTML =
      '<div class="pd-grid">' +
        '<div>' +
          '<div class="pd-media"><img id="pdImg" data-img="' + p.img + '" alt="' + p.name + '"></div>' +
          '<div class="pd-thumbs" id="pdThumbs">' +
            '<div class="on" data-view="0"><img data-img="' + p.img + '" alt="نمای کلی"></div>' +
            '<div data-view="1"><img data-img="' + p.img + '" alt="جزئیات پارچه" style="object-position:75% 40%;transform:scale(2.1);transform-origin:75% 40%"></div>' +
            '<div data-view="2"><img data-img="' + p.img + '" alt="جزئیات پایه" style="object-position:35% 80%;transform:scale(1.9);transform-origin:35% 80%"></div>' +
          '</div>' +
        '</div>' +
        '<div class="pd">' +
          '<span class="eyebrow">' + catName(p.cat) + '</span>' +
          '<h1 style="margin-top:12px">' + p.name + '</h1>' +
          '<div class="pd-rate">' + (p.reviews ? stars(5) + '<span>' + toFa(p.rating) + ' از ۵</span><span>·</span><span>' + fmt(p.reviews) + ' نظر ثبت‌شده</span><span>·</span>' : '') + '<span style="color:#2f7d5f;font-weight:700">موجود در انبار</span></div>' +
          '<div class="pd-price"><b>' + fmt(p.price) + '</b><small style="color:var(--muted);font-size:13px">تومان</small>' +
            (p.old ? '<del>' + fmt(p.old) + '</del><span class="off">' + toFa(off) + '٪ تخفیف</span>' : '') + '</div>' +
          '<p class="pd-desc">' + p.desc + '</p>' +
          '<div class="opt-label"><span>رنگ پارچه</span><small id="pdColorName">' + colorLabel(p.colors[0]) + '</small></div>' +
          '<div class="swatches" id="pdSwatches">' + p.colors.map((c, i) => '<button class="swatch ' + (i === 0 ? 'on' : '') + '" data-color="' + c + '" style="background:' + c + '" aria-label="رنگ ' + toFa(i + 1) + '"></button>').join('') + '</div>' +
          '<div class="opt-label"><span>تعداد</span><small>حداکثر ۵ عدد در هر سفارش</small></div>' +
          '<div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">' +
            '<div class="qty" id="pdQty" style="background:var(--white)"><button data-q="-1" aria-label="کاهش">−</button><span>۱</span><button data-q="1" aria-label="افزایش">+</button></div>' +
            '<span style="font-size:12.5px;color:var(--muted)">زمان آماده‌سازی: ' + p.specs['زمان ارسال'] + '</span>' +
          '</div>' +
          '<div class="pd-actions">' +
            '<button class="btn btn-gold" id="pdAdd"><svg aria-hidden="true"><use href="#i-cart"/></svg> افزودن به لیست سفارش</button>' +
            '<button class="btn btn-dark" id="pdDirectOrder">ثبت مستقیم سفارش</button>' +
          '</div>' +
          '<div class="pd-meta">' +
            '<div><svg aria-hidden="true"><use href="#i-shield"/></svg> ثبت رایگان بدون پرداخت آنلاین</div>' +
            '<div><svg aria-hidden="true"><use href="#i-ruler"/></svg> دریافت آنی کد پیگیری سفارش</div>' +
            '<div><svg aria-hidden="true"><use href="#i-truck"/></svg> هماهنگی ارسال با تیم تخصصی</div>' +
            '<div><svg aria-hidden="true"><use href="#i-wallet"/></svg> امکان شرایط اقساطی بدون سود</div>' +
          '</div>' +
          '<div class="acc">' +
            '<div class="acc-item open"><button class="acc-btn">مشخصات فنی <svg aria-hidden="true"><use href="#i-chevron-down"/></svg></button>' +
              '<div class="acc-panel"><div><table class="spec-table">' + Object.entries(p.specs).map(([k, v]) => '<tr><td>' + k + '</td><td>' + v + '</td></tr>').join('') + '</table></div></div></div>' +
            '<div class="acc-item"><button class="acc-btn">ارسال، نصب و مرجوعی <svg aria-hidden="true"><use href="#i-chevron-down"/></svg></button>' +
              '<div class="acc-panel"><div>ارسال با بسته‌بندی ایمن و تیم نصب پرنس انجام می‌شود. تحویل در بیرجند ۲ تا ۴ روز کاری است و ارسال به شهرهای دیگر با هماهنگی تلفنی انجام می‌گیرد. تا ۷ روز پس از تحویل، در صورت سالم و استفاده‌نشدن کالا، مرجوعی ممکن است.</div></div></div>' +
            '<div class="acc-item"><button class="acc-btn">نگهداری و گارانتی <svg aria-hidden="true"><use href="#i-chevron-down"/></svg></button>' +
              '<div class="acc-panel"><div>پارچه‌های این مدل ضدلکه هستند؛ برای تمیزکاری روزانه پارچه‌ی نرم و خشک و برای لکه‌های سخت، محلول آب و صابون رقیق کافی است. از شوینده‌های قلیایی و نور مستقیم آفتاب دوری کنید. گارانتی سازه و پارچه طبق ضمانت برند سازنده ارائه می‌شود.</div></div></div>' +
          '</div>' +
        '</div>' +
      '</div>';

    hydrate($('#pdWrap'));
    initAccordions($('#pdWrap'));

    /* gallery */
    const img = $('#pdImg');
    const media = $('.pd-media');
    $$('#pdThumbs > div').forEach((t) => {
      t.addEventListener('click', () => {
        $$('#pdThumbs > div').forEach((x) => x.classList.remove('on'));
        t.classList.add('on');
        const v = t.dataset.view;
        if (v === '0') { img.style.transform = ''; img.style.transformOrigin = ''; }
        if (v === '1') { img.style.transform = 'scale(2)'; img.style.transformOrigin = '75% 40%'; }
        if (v === '2') { img.style.transform = 'scale(1.8)'; img.style.transformOrigin = '35% 80%'; }
      });
    });
    media.addEventListener('mousemove', (e) => {
      if (reduce) return;
      const r = media.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      img.style.transformOrigin = x + '% ' + y + '%';
      img.style.transform = 'scale(1.55)';
    });
    media.addEventListener('mouseleave', () => {
      img.style.transform = ''; img.style.transformOrigin = '';
    });

    /* colors + qty */
    let selectedColor = p.colors[0];
    $$('#pdSwatches .swatch').forEach((s) => {
      s.addEventListener('click', () => {
        $$('#pdSwatches .swatch').forEach((x) => x.classList.remove('on'));
        s.classList.add('on');
        selectedColor = s.dataset.color;
        $('#pdColorName').textContent = colorLabel(selectedColor);
      });
    });
    let qty = 1;
    $$('#pdQty button').forEach((b) => {
      b.addEventListener('click', () => {
        qty = Math.max(1, Math.min(5, qty + Number(b.dataset.q)));
        $('#pdQty span').textContent = toFa(qty);
      });
    });
    $('#pdAdd').addEventListener('click', () => addToCart(p.id, qty, selectedColor));
    if ($('#pdDirectOrder')) {
      $('#pdDirectOrder').addEventListener('click', () => {
        addToCart(p.id, qty, selectedColor, true);
        openCheckout();
      });
    }

    /* related */
    const rel = PRODUCTS.filter((x) => x.id !== p.id && (x.cat === p.cat || x.cat === 'decor')).slice(0, 4);
    renderInto($('#pdRelated'), rel.length ? rel : PRODUCTS.filter((x) => x.id !== p.id).slice(0, 4));
    observeReveals($('#pdWrap'));
  }

  /* ---------- accordions ---------- */
  function initAccordions(root = document) {
    $$('.acc-item', root).forEach((item) => {
      const btn = $('.acc-btn', item);
      const panel = $('.acc-panel', item);
      if (!btn || !panel || btn.dataset.bound) return;
      btn.dataset.bound = '1';
      if (item.classList.contains('open')) panel.style.maxHeight = panel.scrollHeight + 'px';
      btn.addEventListener('click', () => {
        const open = item.classList.toggle('open');
        panel.style.maxHeight = open ? panel.scrollHeight + 'px' : '0px';
      });
    });
  }

  /* ---------- wishlist ---------- */
  function toggleWish(id) {
    const i = wish.indexOf(id);
    if (i > -1) { wish.splice(i, 1); toast('از علاقه‌مندی‌ها حذف شد'); }
    else { wish.push(id); toast('به علاقه‌مندی‌ها اضافه شد'); }
    save('perans_wish', wish);
    syncWishUI();
  }
  function syncWishUI() {
    $$('[data-wish]').forEach((b) => b.classList.toggle('on', wish.includes(b.dataset.wish)));
    const el = $('#wishCount');
    el.textContent = toFa(wish.length);
    el.classList.toggle('on', wish.length > 0);
  }

  /* ---------- cart ---------- */
  function cartLines() {
    return cart.map((it) => {
      const p = PRODUCTS.find((x) => x.id === it.id);
      return p ? { ...it, p } : null;
    }).filter(Boolean);
  }
  function totals() {
    const lines = cartLines();
    const subtotal = lines.reduce((s, l) => s + l.p.price * l.qty, 0);
    const discount = coupon && COUPONS[coupon] ? Math.round(subtotal * COUPONS[coupon]) : 0;
    const shipping = subtotal === 0 || (subtotal - discount) >= THRESHOLD ? 0 : SHIPPING;
    return { lines, subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping) };
  }
  function addToCart(id, qty = 1, color = null, skipDrawer = false) {
    const p = PRODUCTS.find((x) => x.id === id);
    if (!p) return;
    const chosenColor = color || (p.colors && p.colors[0]) || '';
    const found = cart.find((x) => x.id === id && (x.color || '') === chosenColor);
    if (found) found.qty = Math.min(5, found.qty + qty);
    else cart.push({ id, qty, color: chosenColor });
    save('perans_cart', cart);
    syncCartUI();
    toast(p.name + ' به لیست سفارش شما اضافه شد');
    if (!skipDrawer) openDrawer();
  }
  function setQty(id, color, delta) {
    const it = cart.find((x) => x.id === id && x.color === color);
    if (!it) return;
    it.qty = Math.max(1, Math.min(5, it.qty + delta));
    save('perans_cart', cart);
    syncCartUI();
  }
  function removeItem(id, color) {
    cart = cart.filter((x) => !(x.id === id && x.color === color));
    save('perans_cart', cart);
    syncCartUI();
    toast('کالا از لیست سفارش حذف شد');
  }
  function syncCartUI() {
    const count = cart.reduce((s, i) => s + i.qty, 0);
    const cc = $('#cartCount');
    cc.textContent = toFa(count);
    cc.classList.toggle('on', count > 0);
    $('#cartSubtitle').textContent = count ? toFa(count) + ' قلم در لیست سفارش شما' : 'لیست سفارش خالی است';
    renderCart();
  }
  function renderCart() {
    const { lines, subtotal, discount, shipping, total } = totals();
    const body = $('#cartBody');
    const foot = $('#cartFoot');
    if (!lines.length) {
      body.innerHTML = '<div class="cart-empty"><svg aria-hidden="true"><use href="#i-cart"/></svg><p style="font-weight:800;color:var(--ink);font-size:15px;margin-bottom:6px">لیست سفارش شما خالی است</p><p style="font-size:12.5px">مبل و رنگ مورد نظرتان را از فروشگاه انتخاب کنید تا برایتان ثبت و کد پیگیری صادر شود.</p><a href="#/shop" class="btn btn-dark btn-sm" style="margin-top:18px" data-close-cart>مشاهده کلکسیون</a></div>';
      foot.innerHTML = '<div class="sum-row"><span>جمع سفارش</span><span>۰ تومان</span></div>';
      return;
    }
    body.innerHTML = lines.map((l) => {
      const off = l.p.old ? '<small style="text-decoration:line-through">' + fmt(l.p.old) + '</small> ' : '';
      const cHex = l.color || (l.p.colors && l.p.colors[0]) || '#123f34';
      return '<div class="citem">' +
        '<img data-img="' + l.p.img + '" alt="' + escHtml(l.p.name) + '">' +
        '<div class="citem-body">' +
          '<b>' + escHtml(l.p.name) + '</b>' +
          '<small>رنگ: <i style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + escHtml(cHex) + ';vertical-align:middle;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)"></i> ' + escHtml(colorLabel(cHex)) + ' · ' + escHtml(catName(l.p.cat)) + '</small>' +
          '<div class="citem-row">' +
            '<div class="qty"><button data-dec="' + l.id + '" data-color="' + (l.color || '') + '" aria-label="کاهش">−</button><span>' + toFa(l.qty) + '</span><button data-inc="' + l.id + '" data-color="' + (l.color || '') + '" aria-label="افزایش">+</button></div>' +
            '<span class="citem-price">' + off + fmt(l.p.price * l.qty) + '</span>' +
          '</div>' +
          '<button class="citem-del" data-remove="' + l.id + '" data-color="' + (l.color || '') + '">حذف از لیست</button>' +
        '</div>' +
      '</div>';
    }).join('');
    hydrate(body);

    const pct = THRESHOLD > 0 ? Math.min(100, (subtotal / THRESHOLD) * 100) : 100;
    const remain = THRESHOLD - subtotal;
    foot.innerHTML =
      '<div class="coupon">' +
        '<input id="couponInput" placeholder="کد تخفیف (مثلاً PERANS10)" value="' + (coupon || '') + '" aria-label="کد تخفیف">' +
        '<button id="couponApply">اعمال</button>' +
      '</div>' +
      (shipping === 0
        ? '<div style="font-size:11.5px;color:#2f7d5f;font-weight:700;margin-bottom:8px">✓ هزینه ارسال با تعرفه ویژه محاسبه شد</div>'
        : '<div style="font-size:11.5px;color:var(--muted);margin-bottom:8px">' + fmt(remain) + ' تومان تا سقف ارسال رایگان</div>') +
      '<div class="ship-bar"><i style="width:' + pct + '%"></i></div>' +
      '<div class="sum-row"><span>جمع کالاها</span><span>' + money(subtotal) + '</span></div>' +
      (discount ? '<div class="sum-row"><span>تخفیف (' + toFa(COUPONS[coupon] * 100) + '٪)</span><span class="free">− ' + money(discount) + '</span></div>' : '') +
      '<div class="sum-row"><span>برآورد ارسال</span><span class="' + (shipping === 0 ? 'free' : '') + '">' + (shipping === 0 ? 'رایگان / طبق هماهنگی' : money(shipping)) + '</span></div>' +
      '<div class="sum-row total"><span>جمع برآوردی سفارش</span><span>' + money(total) + '</span></div>' +
      '<button class="btn btn-gold btn-block" id="checkoutBtn">ادامه و ثبت سفارش <svg aria-hidden="true"><use href="#i-arrow-left"/></svg></button>' +
      '<p style="font-size:10.5px;color:var(--muted);text-align:center;margin-top:10px">بدون پرداخت آنلاین · دریافت آنی کد پیگیری · هماهنگی تلفنی کارشناس</p>';

    hydrate(foot);
    $('#couponApply').addEventListener('click', applyCoupon);
    $('#couponInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') applyCoupon(); });
    $('#checkoutBtn').addEventListener('click', () => { closeDrawer(); openCheckout(); });
  }
  function applyCoupon() {
    const val = toEn($('#couponInput').value).trim().toUpperCase();
    if (!val) { coupon = null; save('perans_coupon', null); renderCart(); return; }
    if (COUPONS[val]) {
      coupon = val; save('perans_coupon', coupon); renderCart();
      toast('کد تخفیف ' + toFa(COUPONS[val] * 100) + '٪ اعمال شد');
    } else {
      renderCart();
      toast('کد تخفیف معتبر نیست', false);
    }
  }

  /* ---------- drawers ---------- */
  function openDrawer() {
    $('#cartDrawer').classList.add('on');
    $('#cartDrawer').setAttribute('aria-hidden', 'false');
    $('#scrim').classList.add('on');
    document.body.classList.add('locked');
  }
  function closeDrawer() {
    $('#cartDrawer').classList.remove('on');
    $('#cartDrawer').setAttribute('aria-hidden', 'true');
    $('#scrim').classList.remove('on');
    document.body.classList.remove('locked');
  }

  /* ---------- order registration (consultative, zero online payment) ---------- */
  let coStep = 1;
  const coData = { name: '', phone: '', city: '', zip: '', address: '', note: '', pay: 'phone_consult' };
  function openCheckout() {
    if (!cart.length) { toast('لیست سفارش شما خالی است', false); return; }
    coStep = 1;
    $('#checkoutModal').classList.add('on');
    document.body.classList.add('locked');
    renderCheckout();
  }
  function closeCheckout() {
    $('#checkoutModal').classList.remove('on');
    document.body.classList.remove('locked');
  }
  function stepsHTML() {
    const S = [{ n: 1, t: 'مشخصات ثبت‌کننده' }, { n: 2, t: 'نحوه هماهنگی' }, { n: 3, t: 'دریافت کد پیگیری' }];
    return S.map((s, i) => {
      const cls = coStep === s.n ? 'on' : (coStep > s.n ? 'done' : '');
      const icon = coStep > s.n ? '<svg width="13" height="13" aria-hidden="true"><use href="#i-check"/></svg>' : toFa(s.n);
      return (i ? '<span class="step-line"></span>' : '') + '<div class="step ' + cls + '"><i>' + icon + '</i>' + s.t + '</div>';
    }).join('');
  }
  function renderCheckout() {
    $('#coSteps').innerHTML = stepsHTML();
    const body = $('#coBody');
    if (coStep === 1) {
      body.innerHTML =
        '<h3>مشخصات ثبت‌کننده سفارش</h3>' +
        '<p style="font-size:12.5px;color:var(--muted);line-height:1.85">در مبل پرنس هیچ پرداخت آنلاینی از شما دریافت نمی‌شود؛ پس از ثبت مشخصات، <b>کد پیگیری</b> صادر شده و کارشناس نمایشگاه برای نهایی‌سازی رنگ، ابعاد و نحوه تسویه با شما تماس می‌گیرد.</p>' +
        '<div class="two">' +
          '<div class="field"><label>نام و نام خانوادگی ثبت‌کننده *</label><input id="coName" value="' + escHtml(coData.name) + '" placeholder="مثلاً علی رضایی"><span class="msg">نام خود را وارد کنید.</span></div>' +
          '<div class="field"><label>شماره موبایل در دسترس *</label><input id="coPhone" inputmode="tel" dir="ltr" value="' + escHtml(coData.phone) + '" placeholder="0915..."><span class="msg">شماره‌ی موبایل معتبر وارد کنید.</span></div>' +
        '</div>' +
        '<div class="two">' +
          '<div class="field"><label>شهر *</label><input id="coCity" value="' + escHtml(coData.city) + '" placeholder="بیرجند"><span class="msg">نام شهر را وارد کنید.</span></div>' +
          '<div class="field"><label>کد پستی (اختیاری)</label><input id="coZip" inputmode="numeric" dir="ltr" value="' + escHtml(coData.zip || '') + '" placeholder="اختیاری"></div>' +
        '</div>' +
        '<div class="field"><label>نشانی محل تحویل *</label><textarea id="coAddress" placeholder="خیابان، کوچه، پلاک، واحد">' + escHtml(coData.address) + '</textarea><span class="msg">نشانی را کامل وارد کنید.</span></div>' +
        '<div class="field"><label>توضیحات سفارش (رنگ دلخواه، ابعاد نشیمن، شرایط ساختمان و…)</label><input id="coNote" value="' + escHtml(coData.note) + '" placeholder="مثلاً رنگ پارچه کرم روشن باشد یا ابعاد نشیمن ۲۸ متر است"></div>' +
        '<div class="modal-actions"><button class="btn btn-ghost" id="coBack">بازگشت به لیست</button><button class="btn btn-gold" id="coNext">مرحله بعد: انتخاب نحوه هماهنگی <svg aria-hidden="true"><use href="#i-arrow-left"/></svg></button></div>';
      $('#coBack').addEventListener('click', () => { closeCheckout(); openDrawer(); });
      $('#coNext').addEventListener('click', () => {
        coData.name = $('#coName').value.trim();
        coData.phone = toEn($('#coPhone').value).replace(/[\s-]/g, '');
        coData.city = $('#coCity').value.trim();
        coData.zip = toEn(($('#coZip') && $('#coZip').value.trim()) || '');
        coData.address = $('#coAddress').value.trim();
        coData.note = $('#coNote').value.trim();
        let ok = true;
        const mark = (el, bad) => { el.closest('.field').classList.toggle('err', bad); if (bad) ok = false; };
        mark($('#coName'), coData.name.length < 3);
        mark($('#coPhone'), !/^0?9\d{9}$/.test(coData.phone));
        mark($('#coCity'), coData.city.length < 2);
        mark($('#coAddress'), coData.address.length < 6);
        if (!ok) { toast('لطفاً فیلدهای ستاره‌دار را کامل کنید', false); return; }
        coStep = 2; renderCheckout();
      });
    } else if (coStep === 2) {
      const { lines, subtotal, discount, shipping, total } = totals();
      const selPay = coData.pay || 'phone_consult';
      const itemsPreview = lines.map((l) => {
        const cHex = l.color || (l.p.colors && l.p.colors[0]) || '#123f34';
        return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px dashed rgba(20,17,15,.08);font-size:12.5px">' +
          '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
            '<img data-img="' + l.p.img + '" alt="" style="width:42px;height:42px;border-radius:10px;object-fit:cover;flex:none">' +
            '<div style="min-width:0"><b style="display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + escHtml(l.p.name) + ' × ' + toFa(l.qty) + '</b>' +
            '<small style="color:var(--muted)">رنگ: ' + escHtml(colorLabel(cHex)) + '</small></div>' +
          '</div>' +
          '<b style="flex:none">' + money(l.p.price * l.qty) + '</b>' +
        '</div>';
      }).join('');

      body.innerHTML =
        '<h3>انتخاب نحوه هماهنگی و ثبت نهایی</h3>' +
        '<p style="font-size:12.5px;color:var(--muted)">ترجیح می‌دهید کارشناسان نمایشگاه مبل پرنس چگونه ادامه فرآیند سفارش را با شما هماهنگ کنند؟</p>' +
        '<div class="pay-opts">' +
          '<label class="pay-opt"><input type="radio" name="pay" value="phone_consult"' + (selPay === 'phone_consult' ? ' checked' : '') + '><div><b>هماهنگی تلفنی با کارشناس فروش</b><small>تماس کارشناس نمایشگاه جهت نهایی‌سازی رنگ پارچه، زمان ارسال و نحوه تسویه</small></div></label>' +
          '<label class="pay-opt"><input type="radio" name="pay" value="showroom_visit"' + (selPay === 'showroom_visit' ? ' checked' : '') + '><div><b>مراجعه حضوری به نمایشگاه بیرجند</b><small>رزرو مدل‌های انتخابی جهت بازدید از نزدیک در شعبه خیابان انقلاب، نبش انقلاب ۳</small></div></label>' +
          '<label class="pay-opt"><input type="radio" name="pay" value="installment_plan"' + (selPay === 'installment_plan' ? ' checked' : '') + '><div><b>درخواست شرایط اقساطی (بدون سود)</b><small>بررسی شرایط اقساط تا ۶ ماه با چک صیادی طی تماس واحد فروش</small></div></label>' +
        '</div>' +
        '<div class="panel" style="margin-top:16px;padding:14px 16px;box-shadow:none">' +
          '<div style="font-size:12px;font-weight:800;margin-bottom:6px;color:var(--ink)">خلاصه مبلمان انتخابی شما:</div>' +
          itemsPreview +
          '<div class="sum-row" style="margin-top:10px"><span>جمع اقلام</span><span>' + money(subtotal) + '</span></div>' +
          (discount ? '<div class="sum-row"><span>تخفیف کد هدیه</span><span class="free">− ' + money(discount) + '</span></div>' : '') +
          '<div class="sum-row"><span>برآورد ارسال</span><span>' + (shipping ? money(shipping) : 'رایگان / طبق هماهنگی') + '</span></div>' +
          '<div class="sum-row total" style="margin-bottom:0"><span>مبلغ برآوردی سفارش</span><span>' + money(total) + '</span></div>' +
        '</div>' +
        '<div class="modal-actions"><button class="btn btn-ghost" id="coPrev">مرحله قبل</button><button class="btn btn-gold" id="coPay">ثبت سفارش و دریافت کد پیگیری</button></div>';

      hydrate(body);
      $('#coPrev').addEventListener('click', () => { coStep = 1; renderCheckout(); });
      $('#coPay').addEventListener('click', async () => {
        const payBtn = $('#coPay');
        coData.pay = ($('input[name="pay"]:checked') || {}).value || 'phone_consult';
        const { subtotal, discount, shipping, total } = totals();
        const orderItems = cart.map((it) => {
          const pr = PRODUCTS.find((x) => x.id === it.id) || { id: it.id, name: it.id, cat: '', img: 'p1', price: 0, colors: [], specs: {} };
          const cHex = it.color || (pr.colors && pr.colors[0]) || '';
          return {
            id: pr.id,
            name: pr.name,
            cat: pr.cat || '',
            cat_name: catName(pr.cat) || '',
            img: pr.img || 'p1',
            qty: it.qty,
            price: pr.price,
            color: cHex,
            color_name: colorLabel(cHex),
            specs: pr.specs || {}
          };
        });
        if (payBtn) { payBtn.disabled = true; payBtn.textContent = 'در حال ثبت سفارش و صدور کد پیگیری…'; }
        let orderCode = 'PERANS-' + Math.floor(100000 + Math.random() * 899999);
        if (window.PERANS_DB && typeof window.PERANS_DB.submitOrder === 'function') {
          try {
            const res = await window.PERANS_DB.submitOrder({
              name: coData.name,
              phone: coData.phone,
              city: coData.city,
              postal_code: coData.zip || '',
              address: coData.address,
              note: coData.note,
              pay: coData.pay,
              coupon: coupon || '',
              subtotal,
              discount,
              shipping,
              total,
              items: orderItems
            });
            if (res && res.order_code) orderCode = res.order_code;
          } catch (e) {}
        }
        coData.lastOrderCode = orderCode;
        coData.lastTotal = total;
        coData.lastItems = orderItems;
        pushOrder({
          id: orderCode,
          date: new Date().toISOString(),
          status: 'new',
          name: coData.name,
          phone: coData.phone,
          city: coData.city,
          address: coData.address,
          note: coData.note,
          pay: coData.pay,
          total,
          items: orderItems
        });
        coStep = 3;
        renderCheckout();
      });
    } else {
      const total = coData.lastTotal != null ? coData.lastTotal : totals().total;
      const rawCode = coData.lastOrderCode || ('PERANS-' + Math.floor(100000 + Math.random() * 899999));
      const summaryItems = Array.isArray(coData.lastItems) ? coData.lastItems : [];
      const receiptItemsHtml = summaryItems.length
        ? '<div style="margin:14px auto 4px;max-width:440px;text-align:right;padding:10px 12px;border-radius:12px;background:rgba(18,63,52,.05);border:1px solid rgba(18,63,52,.14)">' +
            summaryItems.map((it) =>
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;padding:5px 0;font-size:12px">' +
                '<div style="display:flex;align-items:center;gap:8px;min-width:0">' +
                  '<img data-img="' + escHtml(it.img || 'p1') + '" alt="" style="width:36px;height:36px;border-radius:8px;object-fit:cover;flex:none">' +
                  '<span style="font-weight:700">' + escHtml(it.name) + ' × ' + toFa(it.qty || 1) + ' <small style="color:var(--muted);font-weight:400">(' + escHtml(it.color_name || colorLabel(it.color)) + ')</small></span>' +
                '</div>' +
                '<b>' + money((+it.price || 0) * (+it.qty || 1)) + '</b>' +
              '</div>'
            ).join('') +
          '</div>'
        : '';
      body.innerHTML =
        '<div class="success">' +
          '<svg class="success-check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M15 27l7 7 15-16" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
          '<h3>سفارش شما با موفقیت ثبت شد</h3>' +
          '<p>سپاس از انتخاب شما، <b>' + escHtml(coData.name || 'همراه گرامی') + '</b>. تصویر مبلمان انتخابی، مشخصات سفارش و اطلاعات شما برای مدیریت مبل پرنس ارسال شد و کارشناسان ما به‌زودی با شماره <b dir="ltr">' + escHtml(coData.phone) + '</b> تماس می‌گیرند.</p>' +
          '<div style="display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:8px">' +
            '<span class="order-no" dir="ltr" style="font-family:monospace;letter-spacing:.06em;font-size:16px;margin:0">' + escHtml(rawCode) + '</span>' +
            '<button type="button" class="btn btn-dark btn-sm" id="coCopyCode">کپی کد پیگیری</button>' +
          '</div>' +
          receiptItemsHtml +
          '<p style="margin-top:12px;font-size:13px">برآورد کل سفارش: <b style="color:var(--ink)">' + money(total) + '</b> · ' + escHtml(COORD_LABELS[coData.pay] || 'هماهنگی تلفنی') + '</p>' +
          '<div class="modal-actions">' +
            '<a href="#/shop" class="btn btn-gold" id="coDone">بازگشت به فروشگاه</a>' +
            '<button type="button" class="btn btn-ghost" id="coTrackNow">پیگیری وضعیت سفارش</button>' +
          '</div>' +
        '</div>';
      hydrate(body);
      cart = []; coupon = null;
      save('perans_cart', cart); save('perans_coupon', null);
      syncCartUI();
      setTimeout(() => {
        if ($('#coDone')) $('#coDone').addEventListener('click', closeCheckout);
        if ($('#coCopyCode')) {
          $('#coCopyCode').addEventListener('click', () => {
            if (navigator.clipboard) navigator.clipboard.writeText(rawCode).then(() => toast('کد پیگیری ' + rawCode + ' کپی شد'));
          });
        }
        if ($('#coTrackNow')) {
          $('#coTrackNow').addEventListener('click', () => {
            closeCheckout();
            location.hash = '#/contact?topic=track';
            setTimeout(() => {
              const trC = $('#trCode'), trP = $('#trPhone'), trF = $('#trackOrderForm');
              if (trC) trC.value = rawCode;
              if (trP) trP.value = coData.phone || '';
              if (trC) trC.scrollIntoView({ behavior: 'smooth', block: 'center' });
              if (trF && trC && trP && trC.value && trP.value) trF.dispatchEvent(new Event('submit', { cancelable: true }));
            }, 320);
          });
        }
      }, 0);
      document.title = 'کد پیگیری صادر شد | مبل پرنس';
    }
  }

  /* ---------- search ---------- */
  function openSearch() {
    $('#searchOverlay').classList.add('on');
    document.body.classList.add('locked');
    setTimeout(() => $('#searchInput').focus(), 220);
    runSearch('');
  }
  function closeSearch() {
    $('#searchOverlay').classList.remove('on');
    document.body.classList.remove('locked');
    $('#searchInput').value = '';
  }
  function runSearch(q) {
    $('#searchOverlay').querySelector('.s-hint').innerHTML = 'پیشنهاد: <b>مبل راحتی</b> · <b>تخت خواب</b> · <b>میز مرمر</b> · <b>آباژور</b>';
    const list = q ? filtered(PRODUCTS, { cat: 'all', q, sort: 'featured' }).slice(0, 9) : PRODUCTS.slice(0, 4);
    renderInto($('#searchResults'), list);
  }
  function openFavorites() {
    $('#searchOverlay').classList.add('on');
    document.body.classList.add('locked');
    $('#searchInput').value = '';
    $('#searchOverlay').querySelector('.s-hint').innerHTML = 'علاقه‌مندی‌های شما — <b>' + toFa(wish.length) + '</b> محصول ذخیره‌شده';
    const list = PRODUCTS.filter((p) => wish.includes(p.id));
    renderInto($('#searchResults'), list);
    if (!list.length) {
      $('#searchResults').innerHTML = '<div class="empty-state"><svg aria-hidden="true"><use href="#i-heart"/></svg><p>هنوز محصولی را ذخیره نکرده‌اید. روی آیکون قلب هر محصول بزنید.</p></div>';
    }
  }

  /* ---------- contact deep links (#/contact?topic=partner&focus=returns) ---------- */
  function handleContactParams(params) {
    const topic = params.get('topic');
    const focus = params.get('focus');
    const sel = $('#cfTopic');
    const valid = ['advice', 'visit', 'track', 'returns', 'partner'];
    const map = { partner: 'partner', returns: 'returns', track: 'track', visit: 'visit', advice: 'advice' };
    if (topic && sel && valid.includes(topic)) {
      sel.value = map[topic] || 'advice';
    }
    const goForm = () => {
      const panel = $('#contactFormPanel');
      if (!panel) return;
      panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      panel.classList.add('is-flash');
      setTimeout(() => panel.classList.remove('is-flash'), 1800);
      const name = $('#cfName');
      if (name && !reduce) setTimeout(() => name.focus({ preventScroll: true }), 500);
    };
    const goPolicy = (id) => {
      const item = document.getElementById(id);
      if (!item) return;
      const acc = item.querySelector('.acc-item') || item;
      if (!acc.classList.contains('open')) acc.querySelector('.acc-btn').click();
      setTimeout(() => acc.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }), 120);
      acc.classList.add('is-flash');
      setTimeout(() => acc.classList.remove('is-flash'), 1800);
    };
    const goTrack = () => {
      const box = $('#orderTrackBox');
      if (!box) return;
      box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      box.classList.add('is-flash');
      setTimeout(() => box.classList.remove('is-flash'), 1800);
      const codeInp = $('#trCode');
      if (codeInp && !reduce) setTimeout(() => codeInp.focus({ preventScroll: true }), 450);
    };
    if (focus === 'returns') { goPolicy('faq-returns'); return; }
    if (focus === 'warranty') { goPolicy('faq-warranty'); return; }
    if (focus === 'partner') { goPolicy('faq-partner'); return; }
    if (topic) {
      if (topic === 'returns') { goPolicy('faq-returns'); return; }
      if (topic === 'track') { goTrack(); return; }
      goForm();
    }
  }

  /* ---------- router ---------- */
  const VIEWS = { home: '#view-home', shop: '#view-shop', product: '#view-product', about: '#view-about', contact: '#view-contact' };
  function setView(name) {
    Object.entries(VIEWS).forEach(([k, sel]) => {
      const el = $(sel);
      const on = k === name;
      el.classList.toggle('active', on);
      if (on) { el.classList.remove('active'); void el.offsetWidth; el.classList.add('active'); }
    });
    $$('.hd__nav a').forEach((a) => a.classList.toggle('is-active', a.dataset.nav === name || (name === 'product' && a.dataset.nav === 'shop')));
    requestAnimationFrame(movePill);
  }
  function route() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const params = new URLSearchParams(qs || '');
    const seg = path.split('/').filter(Boolean);
    closeMMenu(); closeSearch();
    if (seg[0] === 'shop') {
      shopState.cat = params.get('cat') || 'all';
      shopState.q = '';
      const srt = params.get('sort');
      shopState.sort = ['featured', 'cheap', 'expensive', 'new'].indexOf(srt) > -1 ? srt : 'featured';
      renderShop(); setView('shop');
      document.title = 'فروشگاه | مبل پرنس';
      window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } else if (seg[0] === 'product' && seg[1]) {
      renderProduct(seg[1]); setView('product');
      window.scrollTo({ top: 0, behavior: 'auto' });
    } else if (seg[0] === 'about') {
      setView('about'); document.title = 'درباره‌ی پرنس | مبل پرنس';
      window.scrollTo({ top: 0, behavior: 'auto' }); initCounters(); observeReveals();
    } else if (seg[0] === 'contact') {
      setView('contact'); document.title = 'تماس و شعبه‌ها | مبل پرنس';
      window.scrollTo({ top: 0, behavior: 'auto' });
      observeReveals();
      handleContactParams(params);
    } else {
      setView('home'); document.title = 'مبل پرنس | مبلمان دست‌ساز لوکس برای خانه‌ی ایرانی';
      window.scrollTo({ top: 0, behavior: 'auto' }); observeReveals();
    }
    hydrate();
    observeReveals();
  }

  /* mobile menu removed: the same (responsive) header is used on every screen */
  function openMMenu() {}
  function closeMMenu() {}

  /* ---------- contact form ---------- */
  function initContactForm() {
    const form = $('#contactForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = $('#cfName'), phone = $('#cfPhone');
      const topic = $('#cfTopic'), city = $('#cfCity'), msg = $('#cfMsg');
      let ok = true;
      const mark = (el, bad) => { el.closest('.field').classList.toggle('err', bad); if (bad) ok = false; };
      mark(name, name.value.trim().length < 3);
      const cleanPhone = toEn(phone.value).replace(/[\s-]/g, '');
      mark(phone, !/^0?9\d{9}$/.test(cleanPhone));
      if (!ok) { toast('نام و شماره‌ی تماس را بررسی کنید', false); return; }
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (window.PERANS_DB && typeof window.PERANS_DB.submitMessage === 'function') {
        try {
          await window.PERANS_DB.submitMessage({
            kind: 'consultation',
            name: name.value.trim(),
            phone: cleanPhone,
            topic: topic ? topic.value : 'advice',
            city: city ? city.value.trim() : '',
            message: msg ? msg.value.trim() : ''
          });
        } catch (err) {}
      }
      if (submitBtn) submitBtn.disabled = false;
      toast('درخواست شما ثبت شد؛ به‌زودی تماس می‌گیریم');
      form.reset();
    });
    $('#nlForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const input = $('#nlForm input');
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.value)) { toast('ایمیل معتبر وارد کنید', false); return; }
      if (window.PERANS_DB && typeof window.PERANS_DB.submitMessage === 'function') {
        try {
          await window.PERANS_DB.submitMessage({
            kind: 'newsletter',
            email: input.value.trim(),
            topic: 'newsletter'
          });
        } catch (err) {}
      }
      toast('عضویت شما ثبت شد؛ کد تخفیف ایمیل می‌شود');
      input.value = '';
    });

    const trackForm = $('#trackOrderForm');
    if (trackForm) {
      const statusFa = {
        new: 'ثبت اولیه — در انتظار تماس کارشناس فروش',
        confirmed: 'تأیید شده — هماهنگ‌شده با کارشناس نمایشگاه',
        processing: 'در حال آماده‌سازی و کنترل کیفی در نمایشگاه',
        sent: 'ارسال شده به نشانی مشتری',
        done: 'تحویل نهایی انجام شد',
        canceled: 'سفارش لغو شده است'
      };
      const stageIdxMap = { new: 0, confirmed: 1, processing: 2, sent: 3, done: 3 };
      const stages = ['ثبت و کد پیگیری', 'تأیید کارشناس', 'آماده‌سازی', 'ارسال و تحویل'];

      trackForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = toEn($('#trCode').value).trim().toUpperCase();
        const ph = toEn($('#trPhone').value).replace(/[\s-]/g, '');
        const resEl = $('#trackOrderResult');
        if (!code || ph.length < 8) {
          toast('کد پیگیری و شماره همراه را وارد کنید', false);
          return;
        }
        resEl.innerHTML = '<p class="hint-sm">در حال استعلام پرونده سفارش از سرور…</p>';
        try {
          const data = window.PERANS_DB ? await window.PERANS_DB.trackOrder(code, ph) : { found: false };
          if (!data || !data.found) {
            resEl.innerHTML = '<div style="padding:12px 14px;border-radius:12px;background:rgba(180,68,47,.1);border:1px solid rgba(180,68,47,.25);font-size:13px">سفارشی با این کد پیگیری و شماره همراه یافت نشد. لطفاً کد پیگیری (مثلاً PERANS-123456) و شماره موبایل هنگام ثبت را بررسی کنید.</div>';
            return;
          }

          const activeStage = data.status === 'canceled' ? -1 : (stageIdxMap[data.status] != null ? stageIdxMap[data.status] : 0);
          const timelineHtml = data.status === 'canceled'
            ? ''
            : '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:12px 0">' +
                stages.map((lbl, idx) => {
                  const done = idx <= activeStage;
                  return '<div style="text-align:center;padding:8px 4px;border-radius:10px;background:' + (done ? '#123f34' : 'rgba(18,63,52,.08)') + ';color:' + (done ? '#fff' : 'var(--muted)') + ';font-size:11px;font-weight:' + (idx === activeStage ? '800' : '600') + '">' +
                    toFa(idx + 1) + '. ' + lbl +
                  '</div>';
                }).join('') +
              '</div>';

          const itemsHtml = Array.isArray(data.items) && data.items.length
            ? '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed rgba(18,63,52,.2)"><b style="display:block;margin-bottom:8px">اقلام سفارش شما:</b>' +
              data.items.map((it) => {
                const rawImg = it.resolvedImg || it.img || 'p1';
                const cHex = it.color || '#123f34';
                const cName = it.color_name || colorLabel(cHex);
                const imgAttr = /^data:image\/|^https?:\/\//i.test(rawImg)
                  ? 'src="' + escHtml(rawImg) + '"'
                  : 'data-img="' + escHtml(rawImg) + '"';
                return '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:7px 10px;margin-bottom:6px;border-radius:10px;background:rgba(255,255,255,.72);border:1px solid rgba(18,63,52,.1)">' +
                  '<div style="display:flex;align-items:center;gap:10px;min-width:0">' +
                    '<img ' + imgAttr + ' alt="" style="width:42px;height:42px;border-radius:8px;object-fit:cover;flex:none">' +
                    '<div style="min-width:0">' +
                      '<b style="display:block;font-size:12.5px">' + escHtml(it.name || it.id) + ' × ' + toFa(it.qty || 1) + '</b>' +
                      '<small style="color:var(--muted);font-size:11px"><i style="display:inline-block;width:9px;height:9px;border-radius:50%;background:' + escHtml(cHex) + ';vertical-align:middle;margin-left:4px;box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)"></i>رنگ: ' + escHtml(cName) + '</small>' +
                    '</div>' +
                  '</div>' +
                  '<b style="font-size:12px;flex:none">' + money((+it.price || 0) * (+it.qty || 1)) + '</b>' +
                '</div>';
              }).join('') +
              '</div>'
            : '';

          const noteHtml = data.admin_note
            ? '<div style="margin-top:10px;padding:10px 12px;border-radius:10px;background:rgba(194,163,92,.14);border:1px solid rgba(194,163,92,.35);font-size:12.3px">' +
                '<b>پیام کارشناس نمایشگاه پرنس:</b> ' + escHtml(data.admin_note) +
              '</div>'
            : '';

          resEl.innerHTML =
            '<div style="padding:16px 18px;border-radius:16px;background:rgba(18,63,52,.06);border:1px solid rgba(18,63,52,.2);font-size:13px;line-height:1.95">' +
              '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">' +
                '<div><b>کد پیگیری:</b> <bdi dir="ltr" style="font-family:monospace;font-weight:800;font-size:14px">' + escHtml(data.order_code || code) + '</bdi></div>' +
                '<span style="padding:3px 10px;border-radius:99px;background:rgba(18,63,52,.12);color:#123f34;font-size:11.5px;font-weight:800">' + escHtml(statusFa[data.status] || data.status) + '</span>' +
              '</div>' +
              timelineHtml +
              '<div><b>ثبت‌کننده سفارش:</b> ' + escHtml(data.customer_name) + ' (' + escHtml(data.city || 'بیرجند') + ')</div>' +
              (data.payment_method ? '<div><b>نحوه هماهنگی انتخابی:</b> ' + escHtml(COORD_LABELS[data.payment_method] || data.payment_method) + '</div>' : '') +
              '<div><b>مبلغ برآوردی سفارش:</b> <b>' + money(data.total || 0) + '</b> <span style="font-size:11.5px;color:var(--muted)">(بدون پرداخت آنلاین)</span></div>' +
              noteHtml +
              itemsHtml +
            '</div>';
          hydrate(resEl);
        } catch (err) {
          resEl.innerHTML = '<div style="padding:12px 14px;border-radius:12px;background:rgba(180,68,47,.1);font-size:13px">خطا در ارتباط با سرور. کمی بعد دوباره تلاش کنید.</div>';
        }
      });
    }
  }

  /* ---------- global events ---------- */
  function bindGlobal() {
    document.addEventListener('click', (e) => {
      const add = e.target.closest('[data-add]');
      if (add) { e.preventDefault(); addToCart(add.dataset.add); return; }
      const w = e.target.closest('[data-wish]');
      if (w) { e.preventDefault(); toggleWish(w.dataset.wish); return; }
      const inc = e.target.closest('[data-inc]');
      if (inc) { setQty(inc.dataset.inc, inc.dataset.color || null, 1); return; }
      const dec = e.target.closest('[data-dec]');
      if (dec) { setQty(dec.dataset.dec, dec.dataset.color || null, -1); return; }
      const rm = e.target.closest('[data-remove]');
      if (rm) { removeItem(rm.dataset.remove, rm.dataset.color || null); return; }
      const cat = e.target.closest('[data-cat]');
      if (cat) {
        const inShop = cat.closest('#shopChips');
        if (inShop) { shopState.cat = cat.dataset.cat; renderShop(); }
        else { homeState.cat = cat.dataset.cat; renderHome(); }
        return;
      }
      if (e.target.closest('[data-close-cart]')) { closeDrawer(); return; }
    });

    $('#cartBtn').addEventListener('click', openDrawer);
    $('#cartClose').addEventListener('click', closeDrawer);
    $('#scrim').addEventListener('click', closeDrawer);
    $('#checkoutClose').addEventListener('click', closeCheckout);
    $('#checkoutModal').addEventListener('click', (e) => { if (e.target.id === 'checkoutModal') closeCheckout(); });
    $('#wishBtn').addEventListener('click', openFavorites);
    $('#searchBtn').addEventListener('click', openSearch);
    $('#searchClose').addEventListener('click', closeSearch);
    $('#searchOverlay').addEventListener('click', (e) => { if (e.target.id === 'searchOverlay') closeSearch(); });
    $('#searchInput').addEventListener('input', (e) => runSearch(e.target.value.trim()));
    $('#shopSearch').addEventListener('input', (e) => { shopState.q = e.target.value; renderShop(); });
    $('#shopSort').addEventListener('change', (e) => { shopState.sort = e.target.value; renderShop(); });
    $('#clearFilters').addEventListener('click', () => { shopState.cat = 'all'; shopState.q = ''; renderShop(); });
    $('#toTop').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { closeDrawer(); closeCheckout(); closeSearch(); }
    });

    window.addEventListener('hashchange', route);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- scroll effects ---------- */
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const hd = $('#siteHeader');
      const ann = $('#ann');
      const prog = $('#progress');
      if (prog) prog.style.width = (h > 0 ? Math.min(100, (y / h) * 100) : 0) + '%';
      if (hd) hd.classList.toggle('is-scrolled', y > 30);   /* sticky — never hides */
      if (ann) ann.classList.toggle('is-hidden', y > 40);
      $('#toTop').classList.toggle('on', y > 700);
      ticking = false;
    });
  }
  function initGlow() {
    const g = $('#glow');
    if (!g || mq('(hover: none)').matches || reduce) return;
    let gx = window.innerWidth / 2, gy = window.innerHeight / 2, cx = gx, cy = gy;
    window.addEventListener('mousemove', (e) => { gx = e.clientX; gy = e.clientY; }, { passive: true });
    (function loop() {
      cx += (gx - cx) * 0.08; cy += (gy - cy) * 0.08;
      g.style.transform = 'translate3d(' + (cx - 230) + 'px,' + (cy - 230) + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  /* =========================================================
     UI MOTION — loader, glass header, cursor, tilt, dust
     ========================================================= */

  /* ---------- loader ---------- */
  function initLoader() {
    const ld = $('#loader');
    if (!ld) return;
    document.body.classList.add('is-loading');
    const fill = $('#ldFill'), pct = $('#ldPct'), hint = $('#ldHint');
    const hints = ['در حال چیدن نمایشگاه…', 'آماده‌سازی پارچه‌ها…', 'چیدن ویترین فروشگاه…', 'تقریباً آماده است…'];
    let target = 14, cur = 0, finished = false, hi = 0;

    const paint = () => {
      if (fill) fill.style.width = cur + '%';
      if (pct) pct.textContent = toFa(Math.round(cur)) + '٪';
    };
    const hintTimer = setInterval(() => {
      hi = (hi + 1) % hints.length;
      if (!finished && hint) hint.textContent = hints[hi];
    }, 1500);

    const tick = () => {
      cur += Math.max(0.6, (target - cur) * 0.13);
      if (cur > target) cur = target;
      paint();
      if (cur < 99.4) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const bump = (v) => { target = Math.max(target, v); };
    bump(46);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => bump(66));
    const imgs = Array.from(document.images || []);
    let loaded = 0;
    const onOne = () => {
      loaded++;
      bump(66 + Math.round((loaded / Math.max(1, imgs.length)) * 24));
    };
    imgs.forEach((img) => {
      if (img.complete) onOne();
      else { img.addEventListener('load', onOne); img.addEventListener('error', onOne); }
    });
    window.addEventListener('load', () => bump(96), { once: true });
    setTimeout(() => bump(96), 850);
    setTimeout(() => { if (!finished) finish(); }, 2350);

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(hintTimer);
      target = 100;
      if (hint) hint.textContent = 'خوش آمدید';
      const go = () => {
        cur = 100; paint();
        ld.classList.add('is-done');
        document.dispatchEvent(new Event('perans:ready'));
        document.documentElement.classList.add('is-ready');
        setTimeout(() => {
          /* loader slides up and the header "grows" out of the loader's gold line */
          const hd = $('#siteHeader');
          if (hd) hd.classList.add('is-docking');
          ld.classList.add('is-out');
          document.body.classList.remove('is-loading');
          setTimeout(() => ld.remove(), 1150);
          setTimeout(() => { if (hd) hd.classList.remove('is-docking'); }, 1900);
        }, 360);
      };
      const wait = setInterval(() => { if (cur > 97.2) { clearInterval(wait); go(); } }, 40);
      setTimeout(() => { clearInterval(wait); go(); }, 900);
    }
  }

  /* ---------- nav pill ---------- */
  function placePill(a) {
    const nav = $('#hdNav'), pill = $('#hdPill');
    if (!nav || !pill) return;
    if (!a || !a.offsetWidth) { pill.classList.remove('on'); return; }
    const nb = nav.getBoundingClientRect(), ab = a.getBoundingClientRect();
    pill.style.width = ab.width + 'px';
    pill.style.transform = 'translateX(' + (ab.right - (nb.right - 5)).toFixed(2) + 'px)';
    pill.classList.add('on');
  }
  function movePill() {
    const nav = $('#hdNav');
    if (!nav) return;
    placePill(nav.querySelector('a.is-active') || nav.querySelector('a'));
  }
  function initNavPill() {
    const nav = $('#hdNav');
    if (!nav) return;
    movePill();
    setTimeout(movePill, 400);
    setTimeout(movePill, 1400);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => setTimeout(movePill, 80));
    window.addEventListener('resize', () => requestAnimationFrame(movePill));
    $$('#hdNav a').forEach((a) => {
      a.addEventListener('mouseenter', () => {
        $$('#hdNav a').forEach((x) => x.classList.remove('is-hovered'));
        a.classList.add('is-hovered');
        placePill(a);
      });
    });
    nav.addEventListener('mouseleave', () => {
      $$('#hdNav a').forEach((x) => x.classList.remove('is-hovered'));
      movePill();
    });
  }

  /* ---------- mega menu ---------- */
  function initMegaMenu() {
    const trg = $('#megaTrigger'), mega = $('#hdMega');
    if (!trg || !mega) return;
    const closeBtn = $('#megaClose');
    let tOpen = 0, tClose = 0, isOpen = false;
    const canHover = () => !mq('(hover: none)').matches && window.innerWidth > 900;

    function paint(on) {
      isOpen = on;
      mega.classList.toggle('on', on);
      mega.setAttribute('aria-hidden', String(!on));
      trg.setAttribute('aria-expanded', String(on));
      document.body.classList.toggle('mega-open', on);
      trg.classList.toggle('is-hovered', on);
      mega.style.marginTop = '';
    }
    function open() {
      clearTimeout(tClose); clearTimeout(tOpen);
      tOpen = setTimeout(() => paint(true), 60);
    }
    function close() {
      clearTimeout(tOpen); clearTimeout(tClose);
      tClose = setTimeout(() => paint(false), 150);
    }
    function closeNow() { clearTimeout(tOpen); clearTimeout(tClose); paint(false); }

    /* --- ماوس: باز شدن با هاور، ماندن تا خروج از پنل --- */
    trg.addEventListener('mouseenter', () => { if (canHover()) open(); });
    trg.addEventListener('mouseleave', () => { if (canHover() && isOpen) close(); });
    mega.addEventListener('mouseenter', () => { if (canHover()) clearTimeout(tClose); });
    mega.addEventListener('mouseleave', () => { if (canHover()) close(); });

    /* --- کلیک/لمس: بار اول باز می‌کند، بار دوم به فروشگاه می‌رود --- */
    trg.addEventListener('click', (e) => {
      if (!isOpen) { e.preventDefault(); clearTimeout(tOpen); paint(true); }
      else { paint(false); } /* اگر باز است، لینک فروشگاه به‌طور طبیعی باز می‌شود */
    });

    /* --- بستن‌ها --- */
    if (closeBtn) closeBtn.addEventListener('click', () => { closeNow(); trg.focus(); });
    mega.addEventListener('click', (e) => { if (e.target.closest('a')) closeNow(); });
    document.addEventListener('click', (e) => {
      if (!isOpen) return;
      if (e.target.closest('#hdMega') || e.target.closest('#megaTrigger')) return;
      closeNow();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) { closeNow(); trg.focus(); }
    });
    document.addEventListener('focusin', (e) => {
      if (!isOpen) return;
      if (e.target.closest('#hdMega') || e.target.closest('#megaTrigger')) return;
      closeNow();
    });
    window.addEventListener('resize', () => { if (isOpen && window.innerWidth > 900) paint(true); });
    window.addEventListener('scroll', () => { if (isOpen && window.scrollY > 260) closeNow(); }, { passive: true });
    paint(false);
  }

  /* شمارش واقعی هر دسته در مگامنو (از همان داده‌های محصولات) */
  function fillMegaMeta() {
    const wrap = $('#hdMega');
    if (!wrap) return;
    $$('[data-mega-cat]', wrap).forEach((a) => {
      const cat = a.dataset.megaCat;
      const list = PRODUCTS.filter((p) => p.cat === cat);
      if (!list.length) return;
      const min = list.reduce((m, p) => (p.price < m ? p.price : m), list[0].price);
      const small = a.querySelector('small');
      if (small) small.textContent = toFa(list.length) + ' مدل · از ' + toFa(Math.round(min / 100000) / 10) + ' میلیون';
    });
    const allSmall = $('#hdMega .mega__cat--all small');
    if (allSmall) allSmall.textContent = toFa(PRODUCTS.length) + ' قطعه در ' + toFa(Math.max(0, CATS.length - 1)) + ' دسته';
  }

  /* ---------- custom cursor ---------- */
  function initCursor() {
    const cur = $('#cur'), dot = $('#curDot');
    if (!cur || !dot || reduce) return;
    if (mq('(hover: none)').matches) return;
    document.documentElement.classList.add('has-cur', 'hide-cur');
    let x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y, shown = false;
    const place = (el, px, py) => { el.style.transform = 'translate3d(' + px.toFixed(1) + 'px,' + py.toFixed(1) + 'px,0) translate(-50%,-50%)'; };
    window.addEventListener('mousemove', (e) => {
      x = e.clientX; y = e.clientY;
      if (!shown) { shown = true; cx = x; cy = y; }
      place(dot, x, y);
    }, { passive: true });
    (function loop() {
      cx += (x - cx) * 0.16; cy += (y - cy) * 0.16;
      place(cur, cx, cy);
      requestAnimationFrame(loop);
    })();
    document.addEventListener('mouseover', (e) => {
      const t = e.target;
      cur.classList.toggle('is-hot', !!t.closest('a,button,[data-magnetic],.card,input,select,textarea,.swatch,.look'));
      cur.classList.toggle('is-dark', !!t.closest('.hd,.ft,.mmenu,.drawer,.modal,.search-overlay,.ld,.ann'));
    });
    document.addEventListener('mouseleave', () => { cur.style.opacity = '0'; dot.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cur.style.opacity = ''; dot.style.opacity = ''; });
  }

  /* ---------- magnetic ---------- */
  function initMagnetic() {
    if (reduce) return;
    $$('[data-magnetic]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const mx = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const my = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform = 'translate(' + (mx * 5).toFixed(2) + 'px,' + (my * 4).toFixed(2) + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  /* ---------- 3D tilt on cards ---------- */
  function initTilt() {
    if (reduce || mq('(hover: none)').matches) return;
    const bind = (card) => {
      if (!card || card.dataset.tilt) return;
      card.dataset.tilt = '1';
      if (!card.querySelector('.card__glare')) card.insertAdjacentHTML('beforeend', '<span class="card__glare" aria-hidden="true"></span>');
      card.addEventListener('mousemove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        card.style.transform = 'perspective(900px) translateY(-6px) rotateX(' + ((0.5 - py) * 6).toFixed(2) + 'deg) rotateY(' + ((px - 0.5) * 7).toFixed(2) + 'deg)';
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    };
    $$('.card').forEach(bind);
    if ('MutationObserver' in window) {
      new MutationObserver(() => $$('.card:not([data-tilt])').forEach(bind))
        .observe(document.body, { childList: true, subtree: true });
    }
  }

  /* ---------- hero dust ---------- */
  function initDust() {
    const hero = document.querySelector('.hero');
    if (!hero || reduce || hero.querySelector('.hero__dust')) return;
    const box = document.createElement('div');
    box.className = 'hero__dust';
    box.setAttribute('aria-hidden', 'true');
    let html = '';
    for (let i = 0; i < 22; i++) {
      const left = Math.random() * 100;
      const bottom = Math.random() * 70;
      const size = 2 + Math.random() * 4;
      const dur = 8 + Math.random() * 10;
      const delay = -Math.random() * 14;
      html += '<i style="left:' + left.toFixed(2) + '%;bottom:' + bottom.toFixed(2) + '%;width:' + size.toFixed(1) +
        'px;height:' + size.toFixed(1) + 'px;animation-duration:' + dur.toFixed(1) + 's;animation-delay:' + delay.toFixed(1) + 's"></i>';
    }
    box.innerHTML = html;
    hero.prepend(box);
  }

  /* ---------- hero parallax ---------- */
  function initParallax() {
    const hero = document.querySelector('.hero');
    if (!hero || reduce) return;
    const visual = hero.querySelector('.hero-visual');
    const arch = hero.querySelector('.arch img');
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      if (visual) visual.style.transform = 'translate3d(' + (px * -16).toFixed(1) + 'px,' + (py * -12).toFixed(1) + 'px,0)';
      if (arch) arch.style.transform = 'scale(1.06) translate3d(' + (px * 14).toFixed(1) + 'px,' + (py * 10).toFixed(1) + 'px,0)';
    });
    hero.addEventListener('mouseleave', () => {
      if (visual) visual.style.transform = '';
      if (arch) arch.style.transform = '';
    });
  }

  /* ---------- online branch map ---------- */
  function initOnlineMap() {
    $$('.map-box--online iframe').forEach((frame) => {
      const box = frame.closest('.map-box--online');
      if (!box) return;
      frame.addEventListener('load', () => box.classList.add('is-online'), { once: true });
    });
  }

  /* ---------- footer ribbon ---------- */
  function initFooterRibbon() {
    const t = $('#ftTrack');
    if (!t) return;
    const items = ['BIRJAND · IRAN', 'SINCE 1993', 'AUTHENTIC BRANDS', 'FREE DELIVERY & SETUP',
      '12 BRANDS', '6-INSTALLMENT PAYMENT', 'P E R A N S'];
    const one = items.map((i) => '<span><svg aria-hidden="true"><use href="#i-sparkle"/></svg><b>' + i + '</b></span>').join('');
    t.innerHTML = one + one;
  }

  /* ---------- boot ---------- */
  function boot() {
    hydrate();
    buildMarquee();
    initWordmark();
    initHero();
    renderHome();
    initAccordions();
    initContactForm();
    applyCms();
    initCmsSync();
    syncCartUI();
    syncWishUI();
    bindGlobal();
    route();
    initGlow();
    initCounters();
    observeReveals();

    initLoader();
    initNavPill();
    initMegaMenu();
    fillMegaMeta();
    initCursor();
    initMagnetic();
    initTilt();
    initDust();
    initFooterRibbon();
    initOnlineMap();
    initParallax();
    document.addEventListener('perans:ready', () => {
      document.documentElement.classList.add('is-ready');
      $$('.hero [data-reveal], .hero').forEach((el) => el.classList.add('in'));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
