/**
 * Doctors – CRUD page
 */
(async function () {
  if (!UI.requireAuth()) return;
  const root = UI.renderShell({ active: 'doctors.html' });
  const isAdmin = Auth.hasRole('admin');

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="breadcrumb"><a href="dashboard.html">Bosh sahifa</a> / <span>Shifokorlar</span></div>
          <h1>Shifokorlar</h1>
          <div class="sub">Klinika shifokorlari va ularning mutaxassisliklarini boshqaring.</div>
        </div>
        ${isAdmin ? `<button class="btn btn-primary" id="addBtn">${UI.NAV_ICONS.plus} Yangi shifokor</button>` : ''}
      </div>

      <div class="filter-bar">
        <div class="input-with-icon">
          <span class="ico">${UI.NAV_ICONS.search}</span>
          <input class="input" id="searchInput" placeholder="Ism, mutaxassislik yoki email bo'yicha qidirish..." />
        </div>
        <select class="select" id="deptFilter">
          <option value="">Barcha bo'limlar</option>
        </select>
        <select class="select" id="availFilter">
          <option value="">Barcha holatlar</option>
          <option value="available">Mavjud</option>
          <option value="busy">Band</option>
          <option value="on_leave">Ta'tilda</option>
        </select>
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Shifokor</th>
              <th>Mutaxassislik</th>
              <th>Bo'lim</th>
              <th>Aloqa</th>
              <th>Tajriba</th>
              <th>Holati</th>
              <th>Bemorlar</th>
              <th style="text-align:right">Amallar</th>
            </tr>
          </thead>
          <tbody id="doctorsBody">
            <tr><td colspan="8">${UI.loadingState()}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let allDepartments = [];
  await loadDepartments();

  // Wire filters
  const search = document.getElementById('searchInput');
  const dept = document.getElementById('deptFilter');
  const avail = document.getElementById('availFilter');
  search.addEventListener('input', UI.debounce(load, 250));
  dept.addEventListener('change', load);
  avail.addEventListener('change', load);

  if (isAdmin) document.getElementById('addBtn').addEventListener('click', () => openForm());

  await load();

  async function loadDepartments() {
    try {
      const { data } = await Api.doctors.departments();
      allDepartments = data;
      const sel = document.getElementById('deptFilter');
      data.forEach(d => sel.insertAdjacentHTML('beforeend', `<option value="${d}">${d}</option>`));
    } catch {}
  }

  async function load() {
    const tbody = document.getElementById('doctorsBody');
    tbody.innerHTML = `<tr><td colspan="8">${UI.loadingState()}</td></tr>`;
    try {
      const { data } = await Api.doctors.list({ q: search.value, department: dept.value, availability: avail.value });
      if (!data.length) { tbody.innerHTML = `<tr><td colspan="8">${UI.emptyState({ title: 'Shifokor topilmadi', text: 'Qidiruv shartlarini o\'zgartiring yoki yangi shifokor qo\'shing.' })}</td></tr>`; return; }
      tbody.innerHTML = data.map(d => row(d)).join('');
      tbody.querySelectorAll('[data-act]').forEach(btn => btn.addEventListener('click', onAction));
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty"><h4>Xatolik</h4><p>${e.message}</p></div></td></tr>`;
    }
  }

  function row(d) {
    const availClass = d.availability === 'available' ? 'badge-success' : d.availability === 'busy' ? 'badge-warning' : 'badge-info';
    return `
      <tr>
        <td>
          <div class="user-cell">
            <div class="avatar">${UI.fmt.initials(d.full_name)}</div>
            <div>
              <div class="name">${d.full_name}</div>
              <div class="sub">${d.email || '—'}</div>
            </div>
          </div>
        </td>
        <td>${d.specialty}</td>
        <td><span class="badge badge-info">${d.department}</span></td>
        <td>${d.phone || '—'}</td>
        <td>${d.experience_years || 0} yil</td>
        <td><span class="badge ${availClass} badge-dot">${UI.fmt.availability(d.availability)}</span></td>
        <td><strong>${d.patient_count || 0}</strong></td>
        <td style="text-align:right">
          <div class="row-actions">
            ${isAdmin ? `
              <button class="btn-icon" title="Tahrirlash" data-act="edit" data-id="${d.id}">${UI.NAV_ICONS.edit}</button>
              <button class="btn-icon danger" title="O'chirish" data-act="delete" data-id="${d.id}">${UI.NAV_ICONS.trash}</button>
            ` : `<span class="muted text-xs">Faqat ko'rish</span>`}
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
      const ok = await UI.confirm({ title: 'Shifokorni o\'chirish', message: 'Bu shifokor o\'chiriladi. Ushbu amalni qaytarib bo\'lmaydi.', okText: 'Ha, o\'chirish' });
      if (!ok) return;
      try {
        await Api.doctors.remove(id);
        UI.toast('Shifokor o\'chirildi', 'success');
        load();
      } catch (err) { UI.toast(err.message, 'error'); }
    }
    if (act === 'edit') {
      try {
        const { data } = await Api.doctors.get(id);
        openForm(data);
      } catch (err) { UI.toast(err.message, 'error'); }
    }
  }

  function openForm(doctor = null) {
    const isEdit = !!doctor;
    const form = document.createElement('form');
    form.id = 'doctorForm';
    form.innerHTML = `
      <div class="grid-3" style="margin-bottom:12px">
        <div class="field">
          <label>F.I.SH *</label>
          <input class="input" name="full_name" required value="${doctor?.full_name || ''}" />
        </div>
        <div class="field">
          <label>Mutaxassislik *</label>
          <input class="input" name="specialty" required value="${doctor?.specialty || ''}" />
        </div>
        <div class="field">
          <label>Bo'lim *</label>
          <input class="input" name="department" required list="deptList" value="${doctor?.department || ''}" />
          <datalist id="deptList">${allDepartments.map(d => `<option value="${d}">`).join('')}</datalist>
        </div>
        <div class="field">
          <label>Email</label>
          <input class="input" name="email" type="email" value="${doctor?.email || ''}" />
        </div>
        <div class="field">
          <label>Telefon</label>
          <input class="input" name="phone" value="${doctor?.phone || ''}" />
        </div>
        <div class="field">
          <label>Tajriba (yil)</label>
          <input class="input" name="experience_years" type="number" min="0" max="70" value="${doctor?.experience_years ?? 0}" />
        </div>
        <div class="field">
          <label>Holati</label>
          <select class="select" name="availability">
            <option value="available" ${doctor?.availability === 'available' ? 'selected' : ''}>Mavjud</option>
            <option value="busy" ${doctor?.availability === 'busy' ? 'selected' : ''}>Band</option>
            <option value="on_leave" ${doctor?.availability === 'on_leave' ? 'selected' : ''}>Ta'tilda</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Qisqa ma'lumot</label>
        <textarea class="textarea" name="bio">${doctor?.bio || ''}</textarea>
      </div>
    `;

    const cancel = UI.el('button', { class: 'btn btn-ghost', type: 'button' }, 'Bekor qilish');
    const save = UI.el('button', { class: 'btn btn-primary', type: 'submit' }, isEdit ? 'O\'zgarishlarni saqlash' : 'Shifokorni qo\'shish');
    save.setAttribute('form', 'doctorForm');

    const m = UI.modal({
      title: isEdit ? 'Shifokorni tahrirlash' : 'Yangi shifokor qo\'shish',
      content: form,
      footer: [cancel, save],
      size: 'lg',
    });
    cancel.addEventListener('click', () => m.close());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = UI.serializeForm(form);
      if (data.experience_years) data.experience_years = Number(data.experience_years);
      save.disabled = true;
      try {
        if (isEdit) await Api.doctors.update(doctor.id, data);
        else await Api.doctors.create(data);
        UI.toast(isEdit ? 'Shifokor yangilandi' : 'Shifokor qo\'shildi', 'success');
        m.close();
        await loadDepartments();
        load();
      } catch (err) {
        UI.showFieldErrors(form, err.errors && err.errors.length ? err.errors : [err.message]);
        save.disabled = false;
      }
    });
  }
})();
