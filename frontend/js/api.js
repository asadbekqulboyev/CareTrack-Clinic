/**
 * CareTrack MRMS - API client
 * Wraps fetch with auth headers, JSON handling and error toasts.
 */
(function () {
  const cfg = window.CARETRACK_CONFIG;

  const Auth = {
    get token() { return localStorage.getItem(cfg.TOKEN_KEY); },
    set token(v) { v ? localStorage.setItem(cfg.TOKEN_KEY, v) : localStorage.removeItem(cfg.TOKEN_KEY); },
    get user() {
      try { return JSON.parse(localStorage.getItem(cfg.USER_KEY) || 'null'); }
      catch { return null; }
    },
    set user(v) { v ? localStorage.setItem(cfg.USER_KEY, JSON.stringify(v)) : localStorage.removeItem(cfg.USER_KEY); },
    clear() { this.token = null; this.user = null; },
    isAuthenticated() { return !!this.token; },
    hasRole(...roles) { return this.user && roles.includes(this.user.role); },
  };

  async function request(method, path, body, opts = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (Auth.token) headers.Authorization = `Bearer ${Auth.token}`;

    let url = cfg.API_BASE + path;
    if (opts.query) {
      const params = new URLSearchParams();
      Object.entries(opts.query).forEach(([k, v]) => {
        if (v !== '' && v !== null && v !== undefined) params.append(k, v);
      });
      const qs = params.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    let res;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError('Tarmoq xatosi. Server ishlayotganini tekshiring.', 0);
    }

    let data = {};
    try { data = await res.json(); } catch { /* no-op */ }

    if (res.status === 401 && !opts.skipAuthRedirect) {
      Auth.clear();
      if (!location.pathname.endsWith('login.html') && !location.pathname.endsWith('/')) {
        location.href = 'login.html';
      }
      throw new ApiError(data.message || 'Avtorizatsiya talab qilinadi', 401, data);
    }
    if (!res.ok) {
      throw new ApiError(data.message || `Xatolik (${res.status})`, res.status, data);
    }
    return data;
  }

  class ApiError extends Error {
    constructor(message, status = 0, payload = {}) {
      super(message);
      this.status = status;
      this.payload = payload;
      this.errors = payload.errors || [];
    }
  }

  const api = {
    get:    (p, q)    => request('GET',    p, null, { query: q }),
    post:   (p, b)    => request('POST',   p, b),
    put:    (p, b)    => request('PUT',    p, b),
    delete: (p)       => request('DELETE', p),

    // Convenience domain wrappers
    auth: {
      login: (email, password) => request('POST', '/auth/login', { email, password }, { skipAuthRedirect: true }),
      me:    () => request('GET', '/auth/me'),
    },
    doctors: {
      list:   (q) => request('GET', '/doctors', null, { query: q }),
      get:    (id) => request('GET', `/doctors/${id}`),
      create: (d) => request('POST', '/doctors', d),
      update: (id, d) => request('PUT', `/doctors/${id}`, d),
      remove: (id) => request('DELETE', `/doctors/${id}`),
      departments: () => request('GET', '/doctors/departments/list'),
    },
    patients: {
      list:   (q) => request('GET', '/patients', null, { query: q }),
      get:    (id) => request('GET', `/patients/${id}`),
      create: (d) => request('POST', '/patients', d),
      update: (id, d) => request('PUT', `/patients/${id}`, d),
      remove: (id) => request('DELETE', `/patients/${id}`),
    },
    diagnoses: {
      list:   (q) => request('GET', '/diagnoses', null, { query: q }),
      get:    (id) => request('GET', `/diagnoses/${id}`),
      create: (d) => request('POST', '/diagnoses', d),
      update: (id, d) => request('PUT', `/diagnoses/${id}`, d),
      remove: (id) => request('DELETE', `/diagnoses/${id}`),
    },
    users: {
      list:   (q) => request('GET', '/users', null, { query: q }),
      create: (d) => request('POST', '/users', d),
      update: (id, d) => request('PUT', `/users/${id}`, d),
      remove: (id) => request('DELETE', `/users/${id}`),
    },
    stats: {
      dashboard: () => request('GET', '/stats/dashboard'),
    },
  };

  window.Api = api;
  window.Auth = Auth;
  window.ApiError = ApiError;
})();
