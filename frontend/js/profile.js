/**
 * Profile page — shows current user's profile with ability to change password
 */
(async function () {
  if (!UI.requireAuth()) return;
  const root = UI.renderShell({ active: '' });
  const user = Auth.user;

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="breadcrumb"><a href="dashboard.html">Bosh sahifa</a> / <span>Mening profilim</span></div>
          <h1>Mening profilim</h1>
          <div class="sub">Hisobingiz ma'lumotlarini ko'ring va parolingizni o'zgartiring.</div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Profile card -->
        <div class="card">
          <div style="display:flex;gap:20px;align-items:center;margin-bottom:24px">
            <div class="avatar avatar-lg" style="width:96px;height:96px;font-size:32px">${UI.fmt.initials(user.full_name)}</div>
            <div>
              <h2 style="font-size:24px;margin-bottom:4px">${user.full_name}</h2>
              <p class="muted">${user.email}</p>
              <span class="badge ${user.role === 'admin' ? 'badge-violet' : user.role === 'clinician' ? 'badge-info' : 'badge-success'}" style="margin-top:8px;font-size:13px;padding:5px 12px">
                ${UI.fmt.role(user.role)}
              </span>
            </div>
          </div>

          <div class="info-grid" style="border:0;padding:0;margin:0">
            <div class="item">
              <div class="label">FOYDALANUVCHI ID</div>
              <div class="value">#${user.id}</div>
            </div>
            <div class="item">
              <div class="label">EMAIL</div>
              <div class="value">${user.email}</div>
            </div>
            <div class="item">
              <div class="label">TELEFON</div>
              <div class="value">${user.phone || 'Kiritilmagan'}</div>
            </div>
            <div class="item">
              <div class="label">ROL</div>
              <div class="value">${UI.fmt.role(user.role)}</div>
            </div>
          </div>
        </div>

        <!-- Security / change password card -->
        <div>
          <div class="card" style="margin-bottom:18px">
            <div class="section-head"><h3>Parolni o'zgartirish</h3></div>
            <form id="passwordForm" style="display:flex;flex-direction:column;gap:14px">
              <div class="field">
                <label>Joriy parol</label>
                <input class="input" type="password" name="current_password" placeholder="Hozirgi parolingiz" required />
              </div>
              <div class="field">
                <label>Yangi parol</label>
                <input class="input" type="password" name="new_password" placeholder="Kamida 6 belgi" required minlength="6" />
              </div>
              <div class="field">
                <label>Yangi parolni tasdiqlang</label>
                <input class="input" type="password" name="confirm_password" placeholder="Qaytadan kiriting" required minlength="6" />
              </div>
              <button type="submit" class="btn btn-primary" style="align-self:flex-start">Parolni o'zgartirish</button>
            </form>
          </div>

          <div class="card">
            <div class="section-head"><h3>Sessiya ma'lumotlari</h3></div>
            <ul style="display:flex;flex-direction:column;gap:10px;font-size:14px">
              <li style="display:flex;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:8px">
                <span class="muted">Avtorizatsiya usuli</span>
                <strong>JWT Bearer Token</strong>
              </li>
              <li style="display:flex;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:8px">
                <span class="muted">Token muddati</span>
                <strong>7 kun</strong>
              </li>
              <li style="display:flex;justify-content:space-between;padding:12px;background:var(--gray-50);border-radius:8px">
                <span class="muted">Parol shifrlash</span>
                <strong>bcrypt (salt 10)</strong>
              </li>
              <li style="display:flex;justify-content:space-between;padding:12px;background:var(--success-bg);color:#047857;border-radius:8px">
                <span>Hisob holati</span>
                <strong>● Faol</strong>
              </li>
            </ul>
            <button class="btn btn-danger" style="margin-top:16px" id="logoutBtn2">Hisobdan chiqish</button>
          </div>
        </div>
      </div>

      <!-- Activity / permissions overview -->
      <div class="card mt-6">
        <div class="section-head"><h3>Sizning ruxsatlaringiz</h3></div>
        <div id="permGrid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">
        </div>
      </div>
    </div>
  `;

  // Render permissions based on role
  const perms = {
    admin: [
      { label: 'Bemorlarni boshqarish', ok: true },
      { label: 'Shifokorlarni boshqarish', ok: true },
      { label: 'Tashxislarni boshqarish', ok: true },
      { label: 'Foydalanuvchilarni boshqarish', ok: true },
      { label: 'Statistika ko\'rish', ok: true },
      { label: 'Tizim sozlamalari', ok: true },
    ],
    clinician: [
      { label: 'Bemorlarni ko\'rish', ok: true },
      { label: 'Bemorlarni tahrirlash', ok: true },
      { label: 'Tashxis qo\'shish', ok: true },
      { label: 'Tashxislarni tahrirlash', ok: true },
      { label: 'Shifokorlar ro\'yxati', ok: true },
      { label: 'Shifokor qo\'shish', ok: false },
      { label: 'Foydalanuvchilar boshqarish', ok: false },
    ],
    receptionist: [
      { label: 'Bemorlarni ko\'rish', ok: true },
      { label: 'Bemor qo\'shish', ok: true },
      { label: 'Bemor tahrirlash', ok: true },
      { label: 'Shifokorlar ro\'yxati', ok: true },
      { label: 'Tashxislar boshqarish', ok: false },
      { label: 'Shifokor qo\'shish', ok: false },
      { label: 'Foydalanuvchilar boshqarish', ok: false },
    ],
  };

  const permGrid = document.getElementById('permGrid');
  const rolePerms = perms[user.role] || perms.receptionist;
  permGrid.innerHTML = rolePerms.map(p => `
    <div style="padding:12px 16px;border-radius:10px;background:${p.ok ? 'var(--success-bg)' : 'var(--gray-100)'};display:flex;align-items:center;gap:10px;font-size:14px">
      <span style="font-size:16px">${p.ok ? '✅' : '🚫'}</span>
      <span style="font-weight:600;color:${p.ok ? '#047857' : 'var(--gray-500)'}">${p.label}</span>
    </div>
  `).join('');

  // Password change form
  document.getElementById('passwordForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = UI.serializeForm(form);
    UI.showFieldErrors(form, []);

    if (data.new_password !== data.confirm_password) {
      UI.showFieldErrors(form, ['Yangi parollar bir xil emas']);
      return;
    }

    try {
      await Api.put('/auth/password', {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      UI.toast('Parol muvaffaqiyatli o\'zgartirildi', 'success');
      form.reset();
    } catch (err) {
      UI.showFieldErrors(form, err.errors && err.errors.length ? err.errors : [err.message]);
    }
  });

  // Logout button
  document.getElementById('logoutBtn2').addEventListener('click', async () => {
    const ok = await UI.confirm({ title: 'Hisobdan chiqish', message: 'Chiqishni xohlaysizmi?', okText: 'Ha, chiqish', tone: 'danger' });
    if (ok) { Auth.clear(); location.href = 'login.html'; }
  });
})();
