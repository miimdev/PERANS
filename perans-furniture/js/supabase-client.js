/* ==========================================================================
   PERANS — Supabase Cloud Client & Bale Bot Bridge (Zero external CDN)
   Project: ideh-pardazan (jmpwryddrxmuwzmbmhsb) · Isolated perans_* namespace
   ========================================================================== */
(function () {
  'use strict';

  const SUPABASE_URL = 'https://jmpwryddrxmuwzmbmhsb.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptcHdyeWRkcnhtdXd6bWJtaHNiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNzc5NzMsImV4cCI6MjEwODc1Mzk3M30.brTur1P5XE5FCq-0SebTXt5p2fn3PzmHQM5QbwfG-nI';

  let lastLatencyMs = null;
  let isOnline = true;
  const listeners = new Set();

  function notify() {
    listeners.forEach((fn) => {
      try { fn({ online: isOnline, latencyMs: lastLatencyMs }); } catch (e) {}
    });
  }

  async function rpc(fnName, params = {}, timeoutMs = 14000) {
    const t0 = performance.now();
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;

    try {
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + encodeURIComponent(fnName), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        },
        body: JSON.stringify(params || {}),
        signal: ctrl ? ctrl.signal : undefined
      });

      lastLatencyMs = Math.max(1, Math.round(performance.now() - t0));

      let data = null;
      const text = await res.text();
      if (text) {
        try { data = JSON.parse(text); } catch (e) { data = text; }
      }

      if (!res.ok) {
        isOnline = res.status < 500;
        notify();
        const msg = (data && (data.message || data.error_description || data.details || data.error)) || ('خطای سرور (' + res.status + ')');
        const err = new Error(msg);
        err.status = res.status;
        err.code = data && data.code;
        throw err;
      }

      isOnline = true;
      notify();
      return data;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        isOnline = false;
        notify();
        throw new Error('پاسخی از سرور دریافت نشد (مهلت اتصال به پایان رسید).');
      }
      if (!err.status) {
        isOnline = false;
        notify();
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  async function edge(slug, payload = {}, timeoutMs = 18000, keepalive = false) {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;

    try {
      const res = await fetch(SUPABASE_URL + '/functions/v1/' + encodeURIComponent(slug), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
        },
        body: JSON.stringify(payload || {}),
        keepalive: !!keepalive,
        signal: ctrl ? ctrl.signal : undefined
      });

      let data = null;
      const text = await res.text();
      if (text) {
        try { data = JSON.parse(text); } catch (e) { data = { raw: text }; }
      }

      if (!res.ok || (data && data.ok === false)) {
        const msg = (data && (data.error || data.message)) || ('خطای سرویس اعلان (' + res.status + ')');
        throw new Error(msg);
      }
      return data;
    } catch (err) {
      if (err && err.name === 'AbortError') {
        throw new Error('مهلت ارتباط با سرویس پیام‌رسان به پایان رسید.');
      }
      throw err;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /* فشرده‌سازی هوشمند تصویر محصول به WebP/JPEG پیش از ذخیره در دیتابیس */
  function compressImageFile(file, maxDim = 1080, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type || !file.type.startsWith('image/')) {
        reject(new Error('فایل انتخاب‌شده تصویر معتبری نیست.'));
        return;
      }
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('خطا در خواندن فایل تصویر.'));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('فرمت تصویر پشتیبانی نمی‌شود.'));
        img.onload = () => {
          let w = img.naturalWidth || img.width;
          let h = img.naturalHeight || img.height;
          if (w > maxDim || h > maxDim) {
            if (w >= h) { h = Math.round((h * maxDim) / w); w = maxDim; }
            else { w = Math.round((w * maxDim) / h); h = maxDim; }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);

          let mime = 'image/webp';
          let dataUrl = canvas.toDataURL(mime, quality);
          if (!dataUrl || dataUrl.indexOf('data:image/webp') !== 0) {
            mime = 'image/jpeg';
            dataUrl = canvas.toDataURL(mime, quality);
          }
          const approxBytes = Math.round((dataUrl.length * 3) / 4);
          resolve({
            title: file.name.replace(/\.[^.]+$/, ''),
            mime,
            size: approxBytes,
            originalSize: file.size,
            width: w,
            height: h,
            dataUrl
          });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.PERANS_DB = {
    url: SUPABASE_URL,
    projectRef: 'jmpwryddrxmuwzmbmhsb',
    get online() { return isOnline; },
    get latencyMs() { return lastLatencyMs; },
    onStatus(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    rpc,
    edge,
    compressImageFile,

    // Public storefront endpoints
    getStorefront: () => rpc('perans_get_storefront', {}),
    submitOrder: async (payload) => {
      const res = await rpc('perans_submit_order', { p_payload: payload });
      if (res && res.id && res.order_code) {
        edge('perans-bale-notify', {
          action: 'notify_order',
          order_id: res.id,
          order_code: res.order_code
        }, 16000, true).catch(() => {});
      }
      return res;
    },
    trackOrder: (orderCode, phone) => rpc('perans_track_order', { p_order_code: orderCode, p_phone: phone }),
    submitMessage: async (payload) => {
      const res = await rpc('perans_submit_message', { p_payload: payload });
      if (res && res.id && payload && payload.kind !== 'newsletter') {
        edge('perans-bale-notify', {
          action: 'notify_message',
          message_id: res.id
        }, 12000, true).catch(() => {});
      }
      return res;
    },

    // Authenticated admin endpoints
    login: (username, password, remember) => rpc('perans_admin_login', {
      p_username: username,
      p_password: password,
      p_remember: !!remember,
      p_ua: (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : ''
    }),
    logout: (token) => rpc('perans_admin_logout', { p_token: token }),
    bootstrap: (token) => rpc('perans_admin_bootstrap', { p_token: token }),
    upsertProduct: (token, product) => rpc('perans_admin_upsert_product', { p_token: token, p_product: product }),
    deleteProduct: (token, id) => rpc('perans_admin_delete_product', { p_token: token, p_id: id }),
    bulkProducts: (token, action, cat, value) => rpc('perans_admin_bulk_products', { p_token: token, p_action: action, p_cat: cat, p_value: value }),
    saveCategories: (token, categories) => rpc('perans_admin_save_categories', { p_token: token, p_categories: categories }),
    saveConfig: (token, payload) => rpc('perans_admin_save_config', { p_token: token, p_payload: payload }),
    saveBotSettings: (token, payload) => rpc('perans_admin_save_bot_settings', { p_token: token, p_payload: payload }),
    detectBaleChat: (token, botToken) => edge('perans-bale-notify', {
      action: 'detect_chat',
      admin_token: token,
      bot_token: botToken || ''
    }, 18000),
    testBaleBot: (token, botToken, chatId) => edge('perans-bale-notify', {
      action: 'test_send',
      admin_token: token,
      bot_token: botToken || '',
      chat_id: chatId || ''
    }, 20000),
    resendOrderToBale: (token, orderId) => edge('perans-bale-notify', {
      action: 'resend_order',
      admin_token: token,
      order_id: orderId
    }, 22000),
    updateOrder: (token, id, status, adminNote) => rpc('perans_admin_update_order', { p_token: token, p_id: id, p_status: status, p_admin_note: adminNote }),
    createOrder: (token, order) => rpc('perans_admin_create_order', { p_token: token, p_order: order }),
    deleteOrder: (token, id) => rpc('perans_admin_delete_order', { p_token: token, p_id: id }),
    updateMessage: (token, id, status, adminNote) => rpc('perans_admin_update_message', { p_token: token, p_id: id, p_status: status, p_admin_note: adminNote }),
    deleteMessage: (token, id) => rpc('perans_admin_delete_message', { p_token: token, p_id: id }),
    uploadMedia: (token, media) => rpc('perans_admin_upload_media', {
      p_token: token,
      p_title: media.title,
      p_mime: media.mime,
      p_size: media.size,
      p_data_url: media.dataUrl
    }),
    deleteMedia: (token, id) => rpc('perans_admin_delete_media', { p_token: token, p_id: id }),
    updateCredentials: (token, payload) => rpc('perans_admin_update_credentials', {
      p_token: token,
      p_current_password: payload.currentPassword,
      p_new_username: payload.newUsername || null,
      p_new_password: payload.newPassword || null,
      p_display_name: payload.displayName || null
    }),
    importSnapshot: (token, snapshot) => rpc('perans_admin_import_snapshot', { p_token: token, p_snapshot: snapshot })
  };
})();
