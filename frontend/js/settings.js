/**
 * Settings page – profile + system info + security
 */
(async function () {
  if (!UI.requireAuth()) return;
  const root = UI.renderShell({ active: 'settings.html' });
  const u = Auth.user;

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="breadcrumb"><a href="dashboard.html">Bosh sahifa</a> / <span>Sozlamalar</span></div>
          <h1>Sozlamalar</h1>
          <div class="sub">Hisobingiz va tizim sozlamalarini boshqaring.</div>
        </div>
      </div>

      <div class="grid-3">
        <div class="card">
          <div class="section-head">
            <h3>Profil</h3>
          </div>
          <div style="display:flex;gap:14px;align-items:center;margin-bottom:16px">
            <div class="avatar avatar-lg">${UI.fmt.initials(u.full_name)}</div>
            <div>
              <div style="font-weight:700;font-size:16px">${u.full_name}</div>
              <div class="muted text-sm">${u.email}</div>
              <span class="badge ${u.role === 'admin' ? 'badge-violet' : u.role === 'clinician' ? 'badge-info' : 'badge-success'}" style="margin-top:6px">${UI.fmt.role(u.role)}</span>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px;font-size:14px">
            <div style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-50);border-radius:8px">
              <span class="muted">Foydalanuvchi ID</span>
              <strong>#${u.id}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-50);border-radius:8px">
              <span class="muted">Telefon</span>
              <strong>${u.phone || '—'}</strong>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="section-head">
            <h3>Xavfsizlik</h3>
          </div>
          <p class="muted text-sm" style="margin-bottom:14px">Parolingiz bcrypt bilan shifrlangan va xavfsiz saqlanadi. Sessiyalar JWT tokenlari orqali boshqariladi.</p>
          <ul style="display:flex;flex-direction:column;gap:8px;font-size:14px">
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--success-bg);color:#047857;border-radius:8px">
              <span>JWT Avtorizatsiya</span><strong>Faol</strong>
            </li>
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--success-bg);color:#047857;border-radius:8px">
              <span>Parol shifrlash</span><strong>bcrypt</strong>
            </li>
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--success-bg);color:#047857;border-radius:8px">
              <span>Rate limiting</span><strong>Yoqilgan</strong>
            </li>
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--success-bg);color:#047857;border-radius:8px">
              <span>Rolga asoslangan kirish</span><strong>RBAC</strong>
            </li>
          </ul>
        </div>

        <div class="card">
          <div class="section-head">
            <h3>Tizim haqida</h3>
          </div>
          <ul style="display:flex;flex-direction:column;gap:8px;font-size:14px">
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-50);border-radius:8px">
              <span class="muted">Mahsulot</span><strong>CareTrack MRMS</strong>
            </li>
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-50);border-radius:8px">
              <span class="muted">Versiya</span><strong>v1.0.0</strong>
            </li>
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-50);border-radius:8px">
              <span class="muted">API holati</span><strong id="apiHealth">tekshirilmoqda...</strong>
            </li>
            <li style="display:flex;justify-content:space-between;padding:10px;background:var(--gray-50);border-radius:8px">
              <span class="muted">Ma'lumotlar bazasi</span><strong>MySQL</strong>
            </li>
          </ul>
        </div>
      </div>

      <div class="card mt-6">
        <div class="section-head"><h3>Rollar va ruxsatlar</h3></div>
        <table class="table">
          <thead>
            <tr>
              <th>Funksiya</th>
              <th>Administrator</th>
              <th>Shifokor</th>
              <th>Qabulxona</th>
            </tr>
          </thead>
          <tbody>
            ${permRow('Bemorlarni ko\'rish', true, true, true)}
            ${permRow('Bemor qo\'shish/o\'zgartirish', true, true, true)}
            ${permRow('Bemorni o\'chirish', true, false, false)}
            ${permRow('Tashxis qo\'shish', true, true, false)}
            ${permRow('Shifokor qo\'shish/o\'zgartirish', true, false, false)}
            ${permRow('Foydalanuvchi boshqarish', true, false, false)}
            ${permRow('Statistika ko\'rish', true, true, true)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  fetch('/api/health').then(r => r.json()).then(d => {
    document.getElementById('apiHealth').innerHTML = d.success
      ? '<span style="color:var(--success)">● Aktiv</span>'
      : '<span style="color:var(--danger)">● Off-line</span>';
  }).catch(() => {
    document.getElementById('apiHealth').innerHTML = '<span style="color:var(--danger)">● Off-line</span>';
  });

  function permRow(label, admin, clinician, reception) {
    const yes = '<span style="color:var(--success);font-weight:700">✓</span>';
    const no = '<span style="color:var(--gray-400)">—</span>';
    return `<tr><td><strong>${label}</strong></td><td>${admin ? yes : no}</td><td>${clinician ? yes : no}</td><td>${reception ? yes : no}</td></tr>`;
  }
})();
