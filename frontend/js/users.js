/**
 * Users management – admin only
 */
(async function () {
  if (!UI.requireAuth(['admin'])) return;
  const root = UI.renderShell({ active: 'users.html' });

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="breadcrumb"><a href="dashboard.html">Bosh sahifa</a> / <span>Foydalanuvchilar</span></div>
          <h1>Foydalanuvchilar</h1>
          <div class="sub">Tizim foydalanuvchilarini va ularning rollarini boshqaring.</div>
        </div>
        <button class="btn btn-primary" id="addBtn">${UI.NAV_ICONS.plus} Yangi foydalanuvchi</button>
      </div>

      <div class="filter-bar">
        <div class="input-with-icon">
          <span class="ico">${UI.NAV_ICONS.search}</span>
          <input class="input" id="searchInput" placeholder="Ism yoki email bo'yicha qidirish..." />
        </div>
        <select class="select" id="roleFilter">
          <option value="">Barcha rollar</option>
          <option value="admin">Administrator</option>
          <option value="clinician">Shifokor</option>
          <option value="receptionist">Qabulxona</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Foydalanuvchi</th>
              <th>Rol</th>
              <th>Telefon</th>
              <th>Holati</th>
              <th>Yaratilgan</th>
              <th style="text-align:right">Amallar</th>
            </tr>
          </thead>
          <tbody id="usersBody">
            <tr><td colspan="6">${UI.loadingState()}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  const search = document.getElementById('searchInput');
  const roleF = document.getElementById('roleFilter');
  search.addEventListener('input', UI.debounce(load, 250));
  roleF.addEventListener('change', load);
  document.getElementById('addBtn').addEventListener('click', () => openForm());
  await load();

  async function load() {
    const tbody = document.getElementById('usersBody');
    tbody.innerHTML = `<tr><td colspan="6">${UI.loadingState()}</td></tr>`;
    try {
      const { data } = await Api.users.list({ q: search.value, role: roleF.value });
      if (!data.length) { tbody.innerHTML = `<tr><td colspan="6">${UI.emptyState({ title: 'Foydalanuvchi topilmadi' })}</td></tr>`; return; }
      tbody.innerHTML = data.map(u => row(u)).join('');
      tbody.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', onAction));
    } catch (e) { tbody.innerHTML = `<tr><td colspan="6"><div class="empty"><h4>Xatolik</h4><p>${e.message}</p></div></td></tr>`; }
  }

  function row(u) {
    const roleColor = u.role === 'admin' ? 'badge-violet' : u.role === 'clinician' ? 'badge-info' : 'badge-success';
    const isMe = u.id === Auth.user.id;
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar">${UI.fmt.initials(u.full_name)}</div>
            <div>
              <div class="name">${u.full_name} ${isMe ? '<span class="badge" style="font-size:10px;padding:2px 6px;margin-left:4px">SIZ</span>' : ''}</div>
              <div class="sub">${u.email}</div>
            </div>
          </div>
        </td>
        <td><span class="badge ${roleColor}">${UI.fmt.role(u.role)}</span></td>
        <td>${u.phone || '—'}</td>
        <td><span class="badge ${u.status === 'active' ? 'badge-success' : 'badge-danger'} badge-dot">${u.status === 'active' ? 'Faol' : 'Nofaol'}</span></td>
        <td>${UI.fmt.date(u.created_at)}</td>
        <td style="text-align:right">
          <div class="row-actions">
            <button class="btn-icon" data-act="edit" data-id="${u.id}" title="Tahrirlash">${UI.NAV_ICONS.edit}</button>
            ${!isMe ? `<button class="btn-icon danger" data-act="delete" data-id="${u.id}" title="O'chirish">${UI.NAV_ICONS.trash}</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  async function onAction(e) {
    const btn = e.currentTarget;
    const id = btn.dataset.id;
    const act = btn.dataset.act;
    if (act === 'delete') {
      const ok = await UI.confirm({ title: 'Foydalanuvchini o\'chirish', message: 'Foydalanuvchi tizimdan o\'chiriladi.' });
      if (!ok) return;
      try { await Api.users.remove(id); UI.toast('Foydalanuvchi o\'chirildi', 'success'); load(); }
      catch (err) { UI.toast(err.message, 'error'); }
    }
    if (act === 'edit') {
      try {
        const { data } = await Api.users.list({ q: '' });
        const u = data.find(x => x.id == id);
        if (u) openForm(u);
      } catch (err) { UI.toast(err.message, 'error'); }
    }
  }

  function openForm(user = null) {
    const isEdit = !!user;
    const form = document.createElement('form');
    form.id = 'userForm';
    form.innerHTML = `
      <div class="grid-3" style="margin-bottom:12px">
        <div class="field" style="grid-column:span 2">
          <label>F.I.SH *</label>
          <input class="input" name="full_name" required value="${user?.full_name || ''}" />
        </div>
        <div class="field">
          <label>Rol *</label>
          <select class="select" name="role" required>
            ${['admin','clinician','receptionist'].map(r => `<option value="${r}" ${user?.role === r ? 'selected' : ''}>${UI.fmt.role(r)}</option>`).join('')}
          </select>
        </div>
        <div class="field" style="grid-column:span 2">
          <label>Email *</label>
          <input class="input" name="email" type="email" required value="${user?.email || ''}" />
        </div>
        <div class="field">
          <label>Telefon</label>
          <input class="input" name="phone" value="${user?.phone || ''}" />
        </div>
        <div class="field" style="grid-column:span 2">
          <label>${isEdit ? 'Yangi parol (bo\'sh qoldiring — o\'zgarmaydi)' : 'Parol *'}</label>
          <input class="input" name="password" type="password" minlength="6" ${isEdit ? '' : 'required'} placeholder="${isEdit ? 'Yangi parol kiriting' : 'Kamida 6 ta belgi'}" />
        </div>
        <div class="field">
          <label>Holati</label>
          <select class="select" name="status">
            <option value="active" ${user?.status === 'active' ? 'selected' : ''}>Faol</option>
            <option value="inactive" ${user?.status === 'inactive' ? 'selected' : ''}>Nofaol</option>
          </select>
        </div>
      </div>
    `;
    const cancel = UI.el('button', { class: 'btn btn-ghost', type: 'button' }, 'Bekor qilish');
    const save = UI.el('button', { class: 'btn btn-primary', type: 'submit' }, isEdit ? 'Saqlash' : 'Qo\'shish');
    save.setAttribute('form', 'userForm');
    const m = UI.modal({ title: isEdit ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi', content: form, footer: [cancel, save], size: 'lg' });
    cancel.addEventListener('click', () => m.close());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = UI.serializeForm(form);
      if (isEdit && !data.password) delete data.password;
      save.disabled = true;
      try {
        if (isEdit) await Api.users.update(user.id, data);
        else await Api.users.create(data);
        UI.toast(isEdit ? 'Foydalanuvchi yangilandi' : 'Foydalanuvchi qo\'shildi', 'success');
        m.close();
        load();
      } catch (err) {
        UI.showFieldErrors(form, err.errors && err.errors.length ? err.errors : [err.message]);
        save.disabled = false;
      }
    });
  }
})();
