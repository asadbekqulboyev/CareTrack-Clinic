/**
 * CareTrack MRMS - UI helpers (toast, modal, confirm, formatters)
 */
(function () {

  // ---------- DOM helpers ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') node.className = v;
      else if (k === 'dataset') Object.assign(node.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v === false || v === null || v === undefined) continue;
      else if (k === 'html') node.innerHTML = v;
      else node.setAttribute(k, v);
    }
    (Array.isArray(children) ? children : [children]).forEach(c => {
      if (c == null) return;
      node.append(c.nodeType ? c : document.createTextNode(String(c)));
    });
    return node;
  };

  // ---------- Toast ----------
  function ensureToastHost() {
    let host = document.getElementById('toastHost');
    if (!host) {
      host = el('div', { id: 'toastHost', class: 'toast-host' });
      document.body.appendChild(host);
    }
    return host;
  }
  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" class="ico"><path d="M5 12.5l4.5 4.5L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    error:   '<svg viewBox="0 0 24 24" fill="none" class="ico"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" class="ico"><path d="M12 9v4m0 3v.01M3 18h18L12 4 3 18Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    info:    '<svg viewBox="0 0 24 24" fill="none" class="ico"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 8v.01M12 11v5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  };
  function toast(message, type = 'info', timeout = 3500) {
    const host = ensureToastHost();
    const item = el('div', { class: `toast-item ${type}`, html: ICONS[type] || ICONS.info });
    item.append(el('span', {}, message));
    host.appendChild(item);
    setTimeout(() => {
      item.style.transition = 'opacity .25s ease, transform .25s ease';
      item.style.opacity = '0';
      item.style.transform = 'translateX(20px)';
      setTimeout(() => item.remove(), 260);
    }, timeout);
  }

  // ---------- Modal ----------
  function modal({ title = '', content, footer, size = '', onClose } = {}) {
    const backdrop = el('div', { class: 'modal-backdrop' });
    const closeBtn = el('button', { class: 'modal-close', 'aria-label': 'Yopish' }, '×');
    const head = el('div', { class: 'modal-head' }, [
      el('h3', {}, title),
      closeBtn,
    ]);
    const body = el('div', { class: 'modal-content' });
    if (typeof content === 'string') body.innerHTML = content;
    else if (content) body.appendChild(content);

    const bodyWrap = el('div', { class: 'modal-body' + (size ? ' ' + size : '') }, [head, body]);
    if (footer) {
      const foot = el('div', { class: 'modal-foot' });
      (Array.isArray(footer) ? footer : [footer]).forEach(f => foot.appendChild(f));
      bodyWrap.appendChild(foot);
    }

    const root = el('div', { class: 'modal' }, [backdrop, bodyWrap]);
    document.body.appendChild(root);
    document.body.style.overflow = 'hidden';

    function close() {
      root.remove();
      document.body.style.overflow = '';
      if (onClose) onClose();
    }
    backdrop.addEventListener('click', close);
    closeBtn.addEventListener('click', close);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
    });
    return { close, body, root };
  }

  // ---------- Confirm ----------
  function confirm({ title = 'Tasdiqlang', message = 'Davom etishni xohlaysizmi?', okText = 'Ha, davom etish', cancelText = 'Bekor qilish', tone = 'danger' } = {}) {
    return new Promise((resolve) => {
      const content = el('div', {}, [
        el('div', { class: 'confirm-icon', html: '<svg viewBox="0 0 24 24" fill="none" width="28" height="28"><path d="M12 9v4m0 3v.01M3 18h18L12 4 3 18Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>' }),
        el('p', { style: 'text-align:center;color:var(--text-soft)' }, message),
      ]);
      const cancel = el('button', { class: 'btn btn-ghost' }, cancelText);
      const ok = el('button', { class: `btn ${tone === 'danger' ? 'btn-danger' : 'btn-primary'}` }, okText);
      const m = modal({ title, content, footer: [cancel, ok], onClose: () => resolve(false) });
      cancel.addEventListener('click', () => { m.close(); resolve(false); });
      ok.addEventListener('click', () => { m.close(); resolve(true); });
    });
  }

  // ---------- Formatters ----------
  const fmt = {
    date(d) {
      if (!d) return '—';
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      return dt.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: '2-digit' });
    },
    dateTime(d) {
      if (!d) return '—';
      const dt = new Date(d);
      if (isNaN(dt)) return d;
      return dt.toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    },
    relative(d) {
      if (!d) return '';
      const dt = new Date(d);
      const diff = (Date.now() - dt.getTime()) / 1000;
      if (diff < 60)    return 'hozirgina';
      if (diff < 3600)  return `${Math.floor(diff/60)} daqiqa oldin`;
      if (diff < 86400) return `${Math.floor(diff/3600)} soat oldin`;
      if (diff < 604800)return `${Math.floor(diff/86400)} kun oldin`;
      return fmt.date(d);
    },
    initials(name = '') {
      return name.split(/\s+/).filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || '?';
    },
    severity(s) {
      const map = { mild: 'Yengil', moderate: 'O\'rta', severe: 'Og\'ir', critical: 'Kritik' };
      return map[s] || s;
    },
    availability(a) {
      const map = { available: 'Mavjud', busy: 'Band', on_leave: 'Ta\'tilda' };
      return map[a] || a;
    },
    gender(g) {
      const map = { male: 'Erkak', female: 'Ayol', other: 'Boshqa' };
      return map[g] || g;
    },
    role(r) {
      const map = { admin: 'Administrator', clinician: 'Shifokor', receptionist: 'Qabulxona' };
      return map[r] || r;
    },
  };

  // ---------- Form helpers ----------
  function serializeForm(form) {
    const data = {};
    new FormData(form).forEach((v, k) => {
      if (v === '') return;
      data[k] = typeof v === 'string' ? v.trim() : v;
    });
    return data;
  }
  function showFieldErrors(form, errors = []) {
    $$('.field-error', form).forEach(n => n.remove());
    if (!errors.length) return;
    const errBlock = el('div', { class: 'field-error', style: 'background:var(--danger-bg);padding:10px 14px;border-radius:8px;color:var(--danger);font-size:13px' });
    errBlock.innerHTML = errors.map(e => `• ${e}`).join('<br>');
    form.prepend(errBlock);
  }

  // ---------- Sidebar / Topbar shell ----------
  const NAV_ITEMS = [
    { label: 'Boshqaruv paneli', href: 'dashboard.html', icon: 'dashboard', roles: ['admin','clinician','receptionist'] },
    { label: 'Bemorlar',         href: 'patients.html',  icon: 'patient',   roles: ['admin','clinician','receptionist'] },
    { label: 'Shifokorlar',      href: 'doctors.html',   icon: 'doctor',    roles: ['admin','clinician','receptionist'] },
    { label: 'Tashxislar',       href: 'diagnoses.html', icon: 'diagnosis', roles: ['admin','clinician'] },
    { label: 'Foydalanuvchilar', href: 'users.html',     icon: 'users',     roles: ['admin'] },
    { label: 'Sozlamalar',       href: 'settings.html',  icon: 'settings',  roles: ['admin','clinician','receptionist'] },
  ];

  const NAV_ICONS = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none"><path d="M3 13h7V3H3v10Zm0 8h7v-6H3v6Zm11 0h7V11h-7v10Zm0-18v6h7V3h-7Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>',
    patient:   '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    doctor:    '<svg viewBox="0 0 24 24" fill="none"><path d="M9 11V7a3 3 0 1 1 6 0v4M5 21h14M7 21V13h10v8" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="17" r="1.5" fill="currentColor"/></svg>',
    diagnosis: '<svg viewBox="0 0 24 24" fill="none"><path d="M9 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-4M9 4a2 2 0 1 1 6 0M8 12h8M8 16h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    users:     '<svg viewBox="0 0 24 24" fill="none"><circle cx="9" cy="8" r="3.5" stroke="currentColor" stroke-width="1.7"/><path d="M2 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M16 11a3 3 0 1 0 0-6M22 20c0-2.7-1.8-4.7-4-5.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
    settings:  '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09c0 .67.39 1.27 1 1.51.65.27 1.36.13 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.27.65.85 1.06 1.51 1H21a2 2 0 1 1 0 4h-.09c-.66 0-1.24.41-1.51 1Z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
    logout:    '<svg viewBox="0 0 24 24" fill="none"><path d="M15 17l5-5-5-5M20 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu:      '<svg viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    search:    '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
    bell:      '<svg viewBox="0 0 24 24" fill="none"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    plus:      '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    edit:      '<svg viewBox="0 0 24 24" fill="none"><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    trash:     '<svg viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    eye:       '<svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>',
  };

  function renderShell({ active = '' } = {}) {
    if (!Auth.isAuthenticated()) {
      location.href = 'login.html';
      return;
    }
    const user = Auth.user || {};
    const role = user.role || 'receptionist';

    const navHTML = NAV_ITEMS
      .filter(item => item.roles.includes(role))
      .map(item => `
        <a href="${item.href}" class="nav-link ${active === item.href ? 'active' : ''}">
          ${NAV_ICONS[item.icon] || ''}
          <span class="nav-label">${item.label}</span>
        </a>
      `).join('');

    const initials = fmt.initials(user.full_name || 'User');
    const html = `
      <div class="app" id="appShell">
        <div class="mobile-backdrop" id="mobileBackdrop"></div>
        <aside class="sidebar">
          <div class="sidebar-head">
            <a href="dashboard.html" class="brand">
              <span class="brand-mark">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 21s-7-4.5-7-11a5 5 0 0 1 7-4.5A5 5 0 0 1 19 10c0 6.5-7 11-7 11Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  <path d="M12 8v6M9 11h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
                </svg>
              </span>
              <span class="brand-text">
                <span class="t">CareTrack</span>
                <span class="s">Clinic MRMS</span>
              </span>
            </a>
          </div>
          <nav class="sidebar-nav">
            <div class="nav-section-title">Asosiy</div>
            ${navHTML}
            <div class="nav-section-title">Hisob</div>
            <a href="#" class="nav-link" id="logoutBtn">
              ${NAV_ICONS.logout}
              <span class="nav-label">Chiqish</span>
            </a>
          </nav>
          <div class="sidebar-foot">
            <div class="avatar avatar-sm">${initials}</div>
            <div class="info">
              <div class="name">${user.full_name || 'Foydalanuvchi'}</div>
              <div class="role">${fmt.role(role)}</div>
            </div>
          </div>
        </aside>
        <div class="main">
          <header class="topbar">
            <div class="topbar-left">
              <button class="topbar-toggle" id="sidebarToggle" aria-label="Yopish/Ochish">${NAV_ICONS.menu}</button>
              <button class="topbar-mobile" id="mobileToggle" aria-label="Menyu">${NAV_ICONS.menu}</button>
              <div class="global-search">
                <span class="ico">${NAV_ICONS.search}</span>
                <input type="search" class="input" id="globalSearch" placeholder="Bemor, shifokor yoki tashxis qidirish..." />
              </div>
            </div>
            <div class="topbar-right">
              <button class="btn-icon" aria-label="Bildirishnomalar" style="background:var(--gray-50);border-radius:10px;width:38px;height:38px;color:var(--gray-600)">${NAV_ICONS.bell}</button>
              <div class="topbar-pill" id="topUserPill">
                <div class="avatar avatar-sm">${initials}</div>
                <div class="info-text">
                  <div class="name">${user.full_name || 'Foydalanuvchi'}</div>
                  <div class="role">${fmt.role(role)}</div>
                </div>
              </div>
            </div>
          </header>
          <main id="pageContent"></main>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', html);

    const shell = document.getElementById('appShell');
    document.getElementById('sidebarToggle').addEventListener('click', () => shell.classList.toggle('collapsed'));
    document.getElementById('mobileToggle').addEventListener('click', () => shell.classList.toggle('mobile-open'));
    document.getElementById('mobileBackdrop').addEventListener('click', () => shell.classList.remove('mobile-open'));
    document.getElementById('logoutBtn').addEventListener('click', async (e) => {
      e.preventDefault();
      const ok = await UI.confirm({ title: 'Chiqish', message: 'Hisobdan chiqishni xohlaysizmi?', okText: 'Ha, chiqish', tone: 'primary' });
      if (ok) { Auth.clear(); location.href = 'login.html'; }
    });

    // Global search → patients page
    document.getElementById('globalSearch').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.value.trim()) {
        location.href = `patients.html?q=${encodeURIComponent(e.target.value.trim())}`;
      }
    });

    return document.getElementById('pageContent');
  }

  // ---------- Page guard ----------
  function requireAuth(allowedRoles = null) {
    if (!Auth.isAuthenticated()) {
      location.href = 'login.html';
      return false;
    }
    if (allowedRoles && !Auth.hasRole(...allowedRoles)) {
      toast('Bu sahifaga ruxsat yo\'q', 'error');
      setTimeout(() => location.href = 'dashboard.html', 800);
      return false;
    }
    return true;
  }

  // ---------- Misc ----------
  function emptyState({ title = 'Ma\'lumot topilmadi', text = 'Hozircha ko\'rsatish uchun ma\'lumot yo\'q.', icon } = {}) {
    return `
      <div class="empty">
        <div class="icon">${icon || NAV_ICONS.search}</div>
        <h4>${title}</h4>
        <p>${text}</p>
      </div>
    `;
  }
  function loadingState(text = 'Yuklanmoqda...') {
    return `<div class="empty"><div class="spinner spinner-lg" style="margin:0 auto 14px"></div><p>${text}</p></div>`;
  }

  function debounce(fn, wait = 300) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  // Expose
  window.UI = { $, $$, el, toast, modal, confirm, fmt, serializeForm, showFieldErrors, renderShell, requireAuth, emptyState, loadingState, debounce, NAV_ICONS };
})();
