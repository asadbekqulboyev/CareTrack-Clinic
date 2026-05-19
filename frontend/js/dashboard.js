/**
 * Dashboard page – charts + KPIs + recent activity
 */
(async function () {
  if (!UI.requireAuth()) return;
  const root = UI.renderShell({ active: 'dashboard.html' });
  const user = Auth.user;

  root.innerHTML = `
    <div class="page">
      <div class="welcome-banner">
        <div>
          <h2>Xush kelibsiz, ${user.full_name.split(' ')[0]}! 👋</h2>
          <p>Bugungi klinika faoliyatining umumiy ko'rinishi. Barcha asosiy ko'rsatkichlar va so'nggi hodisalar shu yerda.</p>
        </div>
        <a href="patients.html" class="btn btn-lg">Bemorlarni ko'rish →</a>
      </div>

      <div class="grid-stats" id="statsGrid">
        ${[1,2,3,4].map(() => `<div class="stat-card"><div class="skeleton" style="height:18px;width:60%"></div><div class="skeleton" style="height:36px;width:40%;margin-top:8px"></div></div>`).join('')}
      </div>

      <div class="grid-2">
        <div class="card chart-card">
          <div class="section-head">
            <div>
              <h3>Tashxislar tendentsiyasi</h3>
              <div class="sub">So'nggi 6 oy</div>
            </div>
          </div>
          <div id="trendChart"></div>
        </div>

        <div class="card chart-card">
          <div class="section-head">
            <h3>Tashxis darajalari</h3>
          </div>
          <div id="severityChart"></div>
        </div>
      </div>

      <div class="grid-2" style="margin-top:18px">
        <div class="card">
          <div class="section-head">
            <div>
              <h3>So'nggi ro'yxatdan o'tgan bemorlar</h3>
              <div class="sub">Eng yangilari</div>
            </div>
            <a href="patients.html" class="btn btn-soft btn-sm">Hammasi →</a>
          </div>
          <div id="recentList"></div>
        </div>

        <div class="card">
          <div class="section-head">
            <h3>Bo'limlar bo'yicha shifokorlar</h3>
          </div>
          <div id="deptList"></div>
        </div>
      </div>
    </div>
  `;

  try {
    const { data } = await Api.stats.dashboard();
    renderStats(data.totals);
    renderTrendChart(data.monthlyTrend || []);
    renderSeverity(data.severityBreakdown || []);
    renderRecent(data.recentPatients || []);
    renderDepartments(data.departments || []);
  } catch (e) {
    UI.toast(e.message, 'error');
  }

  function renderStats(totals) {
    const grid = document.getElementById('statsGrid');
    const items = [
      { label: 'Jami bemorlar',    value: totals.patients,  tone: '',       icon: UI.NAV_ICONS.patient,   delta: '+12% bu oy' },
      { label: 'Jami shifokorlar', value: totals.doctors,   tone: 'teal',   icon: UI.NAV_ICONS.doctor,    delta: 'Aktiv kadr' },
      { label: 'Jami tashxislar',  value: totals.diagnoses, tone: 'amber',  icon: UI.NAV_ICONS.diagnosis, delta: 'So\'nggi yozuvlar' },
      { label: 'Foydalanuvchilar', value: totals.users,     tone: 'violet', icon: UI.NAV_ICONS.users,     delta: 'Tizim foydalanuvchilari' },
    ];
    grid.innerHTML = items.map(it => `
      <div class="stat-card" data-tone="${it.tone}">
        <div class="icon-wrap">${it.icon}</div>
        <div class="label">${it.label}</div>
        <div class="value">${(it.value || 0).toLocaleString('uz-UZ')}</div>
        <div class="delta up">${it.delta}</div>
      </div>
    `).join('');
  }

  function renderTrendChart(rows) {
    if (!rows.length) {
      document.getElementById('trendChart').innerHTML = UI.emptyState({ title: 'Hozircha tendentsiya yo\'q', text: 'Tashxislar qo\'shilgach, grafik bu yerda ko\'rinadi.' });
      return;
    }
    const max = Math.max(...rows.map(r => r.c), 1);
    const W = 720, H = 240, padX = 36, padY = 20;
    const barW = (W - padX * 2) / rows.length - 14;

    const bars = rows.map((r, i) => {
      const h = ((r.c / max) * (H - padY * 2));
      const x = padX + i * ((W - padX * 2) / rows.length) + 7;
      const y = H - padY - h;
      const label = r.month.slice(5);
      return `
        <g>
          <rect class="bar" x="${x}" y="${y}" width="${barW}" height="${h}" rx="6"/>
          <text x="${x + barW/2}" y="${H - padY + 16}" text-anchor="middle">${label}</text>
          <text x="${x + barW/2}" y="${y - 6}" text-anchor="middle" font-weight="700" fill="var(--text)">${r.c}</text>
        </g>
      `;
    }).join('');

    const grid = [0, .25, .5, .75, 1].map(p => {
      const y = H - padY - p * (H - padY * 2);
      return `<line x1="${padX}" y1="${y}" x2="${W - padX}" y2="${y}"/>`;
    }).join('');

    document.getElementById('trendChart').innerHTML = `
      <svg class="bar-chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#1f8ff5"/>
            <stop offset="1" stop-color="#14b8a6" stop-opacity="0.85"/>
          </linearGradient>
        </defs>
        <g class="axis">${grid}</g>
        ${bars}
      </svg>
    `;
  }

  function renderSeverity(rows) {
    const root = document.getElementById('severityChart');
    if (!rows.length) {
      root.innerHTML = UI.emptyState({ title: 'Tashxislar yo\'q' });
      return;
    }
    const colors = { mild: '#10b981', moderate: '#f59e0b', severe: '#fb923c', critical: '#ef4444' };
    const total = rows.reduce((s, r) => s + r.c, 0);
    let acc = 0;
    const R = 60, C = 80;
    const segments = rows.map(r => {
      const pct = r.c / total;
      const start = acc * 2 * Math.PI;
      const end   = (acc + pct) * 2 * Math.PI;
      acc += pct;
      const large = pct > .5 ? 1 : 0;
      const x1 = C + R * Math.cos(start - Math.PI/2);
      const y1 = C + R * Math.sin(start - Math.PI/2);
      const x2 = C + R * Math.cos(end - Math.PI/2);
      const y2 = C + R * Math.sin(end - Math.PI/2);
      return `<path d="M${C} ${C} L${x1} ${y1} A${R} ${R} 0 ${large} 1 ${x2} ${y2} Z" fill="${colors[r.severity] || '#94a3b8'}"/>`;
    }).join('');

    const legend = rows.map(r => `
      <div class="item">
        <div class="label-wrap">
          <span class="dot" style="background:${colors[r.severity] || '#94a3b8'}"></span>
          <span>${UI.fmt.severity(r.severity)}</span>
        </div>
        <span class="count">${r.c}</span>
      </div>
    `).join('');

    root.innerHTML = `
      <div class="donut-wrap">
        <div class="donut">
          <svg viewBox="0 0 160 160">
            ${segments}
            <circle cx="${C}" cy="${C}" r="36" fill="#fff"/>
            <text x="${C}" y="${C - 2}" text-anchor="middle" font-size="22" font-weight="800" fill="var(--text)">${total}</text>
            <text x="${C}" y="${C + 16}" text-anchor="middle" font-size="11" fill="var(--text-mute)">JAMI</text>
          </svg>
        </div>
        <div class="donut-legend">${legend}</div>
      </div>
    `;
  }

  function renderRecent(rows) {
    const root = document.getElementById('recentList');
    if (!rows.length) { root.innerHTML = UI.emptyState({ title: 'Bemorlar yo\'q' }); return; }
    root.innerHTML = `<div class="activity-list">${rows.map(r => `
      <div class="activity-item">
        <div class="avatar">${UI.fmt.initials(r.full_name)}</div>
        <div class="info">
          <div class="name">${r.full_name}</div>
          <div class="desc">${r.doctor_name ? 'Shifokor: ' + r.doctor_name : 'Shifokor tayinlanmagan'} • ${UI.fmt.gender(r.gender)} • ${r.age || '—'} yosh</div>
        </div>
        <div class="time">${UI.fmt.date(r.registration_date)}</div>
      </div>
    `).join('')}</div>`;
  }

  function renderDepartments(rows) {
    const root = document.getElementById('deptList');
    if (!rows.length) { root.innerHTML = UI.emptyState({ title: 'Bo\'limlar topilmadi' }); return; }
    const max = Math.max(...rows.map(r => r.c), 1);
    root.innerHTML = rows.map(r => {
      const w = Math.max(8, (r.c / max) * 100);
      return `
        <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;margin-bottom:6px">${r.department}</div>
            <div style="height:8px;background:var(--gray-100);border-radius:99px;overflow:hidden">
              <div style="width:${w}%;height:100%;background:var(--grad-primary);border-radius:99px"></div>
            </div>
          </div>
          <div style="font-weight:700;font-size:18px;color:var(--brand-700)">${r.c}</div>
        </div>
      `;
    }).join('');
  }
})();
