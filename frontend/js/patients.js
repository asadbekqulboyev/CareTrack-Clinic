/**
 * Patients – CRUD page
 */
(async function () {
  if (!UI.requireAuth()) return;
  const root = UI.renderShell({ active: 'patients.html' });
  const role = Auth.user.role;
  const canCreate = ['admin', 'receptionist'].includes(role);
  const canUpdate = ['admin', 'clinician', 'receptionist'].includes(role);
  const canDelete = role === 'admin';

  const params = new URLSearchParams(location.search);

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="breadcrumb"><a href="dashboard.html">Bosh sahifa</a> / <span>Bemorlar</span></div>
          <h1>Bemorlar</h1>
          <div class="sub">Bemor yozuvlarini boshqaring va to'liq tarixlarini ko'ring.</div>
        </div>
        ${canCreate ? `<button class="btn btn-primary" id="addBtn">${UI.NAV_ICONS.plus} Yangi bemor</button>` : ''}
      </div>

      <div class="filter-bar">
        <div class="input-with-icon">
          <span class="ico">${UI.NAV_ICONS.search}</span>
          <input class="input" id="searchInput" placeholder="Ism, telefon yoki email bo'yicha qidirish..." value="${params.get('q') || ''}" />
        </div>
        <select class="select" id="genderFilter">
          <option value="">Barcha jinslar</option>
          <option value="male">Erkak</option>
          <option value="female">Ayol</option>
          <option value="other">Boshqa</option>
        </select>
        <select class="select" id="doctorFilter">
          <option value="">Barcha shifokorlar</option>
        </select>
        <input type="date" class="input" id="fromDate" style="max-width:160px" />
        <input type="date" class="input" id="toDate" style="max-width:160px" />
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Bemor</th>
              <th>Yosh / Jins</th>
              <th>Aloqa</th>
              <th>Tayinlangan shifokor</th>
              <th>Tashxislar</th>
              <th>Ro'yxatga olingan</th>
              <th style="text-align:right">Amallar</th>
            </tr>
          </thead>
          <tbody id="patientsBody">
            <tr><td colspan="7">${UI.loadingState()}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let allDoctors = [];
  await loadDoctors();

  const search = document.getElementById('searchInput');
  const gender = document.getElementById('genderFilter');
  const doctorF = document.getElementById('doctorFilter');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  search.addEventListener('input', UI.debounce(load, 250));
  [gender, doctorF, fromDate, toDate].forEach(el => el.addEventListener('change', load));
  if (canCreate) document.getElementById('addBtn').addEventListener('click', () => openForm());

  await load();

  async function loadDoctors() {
    try {
      const { data } = await Api.doctors.list();
      allDoctors = data;
      const sel = document.getElementById('doctorFilter');
      data.forEach(d => sel.insertAdjacentHTML('beforeend', `<option value="${d.id}">${d.full_name} — ${d.specialty}</option>`));
    } catch {}
  }

  async function load() {
    const tbody = document.getElementById('patientsBody');
    tbody.innerHTML = `<tr><td colspan="7">${UI.loadingState()}</td></tr>`;
    try {
      const { data } = await Api.patients.list({
        q: search.value, gender: gender.value, doctor_id: doctorF.value,
        from: fromDate.value, to: toDate.value,
      });
      if (!data.length) { tbody.innerHTML = `<tr><td colspan="7">${UI.emptyState({ title: 'Bemor topilmadi', text: 'Filtrlarni o\'zgartiring yoki yangi bemor qo\'shing.' })}</td></tr>`; return; }
      tbody.innerHTML = data.map(p => row(p)).join('');
      tbody.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', onAction));
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><h4>Xatolik</h4><p>${e.message}</p></div></td></tr>`;
    }
  }

  function row(p) {
    return `
      <tr>
        <td>
          <a href="patient-profile.html?id=${p.id}" style="display:block">
            <div class="user-cell">
              <div class="avatar">${UI.fmt.initials(p.full_name)}</div>
              <div>
                <div class="name">${p.full_name}</div>
                <div class="sub">${p.email || p.phone || '—'}</div>
              </div>
            </div>
          </a>
        </td>
        <td>${p.age || '—'} yosh • ${UI.fmt.gender(p.gender)}</td>
        <td>${p.phone || '—'}</td>
        <td>${p.doctor_name ? `<div><strong>${p.doctor_name}</strong></div><div class="sub muted text-xs">${p.doctor_specialty || ''}</div>` : '<span class="muted">Tayinlanmagan</span>'}</td>
        <td><span class="badge">${p.diagnosis_count || 0}</span></td>
        <td>${UI.fmt.date(p.registration_date)}</td>
        <td style="text-align:right">
          <div class="row-actions">
            <a class="btn-icon" href="patient-profile.html?id=${p.id}" title="Ko'rish">${UI.NAV_ICONS.eye}</a>
            ${canUpdate ? `<button class="btn-icon" data-act="edit" data-id="${p.id}" title="Tahrirlash">${UI.NAV_ICONS.edit}</button>` : ''}
            ${canDelete ? `<button class="btn-icon danger" data-act="delete" data-id="${p.id}" title="O'chirish">${UI.NAV_ICONS.trash}</button>` : ''}
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
      const ok = await UI.confirm({ title: 'Bemorni o\'chirish', message: 'Bu bemor va uning barcha tashxislari o\'chiriladi. Davom etilsinmi?', okText: 'Ha, o\'chirish' });
      if (!ok) return;
      try { await Api.patients.remove(id); UI.toast('Bemor o\'chirildi', 'success'); load(); }
      catch (err) { UI.toast(err.message, 'error'); }
    }
    if (act === 'edit') {
      try { const { data } = await Api.patients.get(id); openForm(data); }
      catch (err) { UI.toast(err.message, 'error'); }
    }
  }

  function openForm(patient = null) {
    const isEdit = !!patient;
    const form = document.createElement('form');
    form.id = 'patientForm';
    form.innerHTML = `
      <div class="grid-3" style="margin-bottom:12px">
        <div class="field">
          <label>F.I.SH *</label>
          <input class="input" name="full_name" required value="${patient?.full_name || ''}" />
        </div>
        <div class="field">
          <label>Yosh</label>
          <input class="input" name="age" type="number" min="0" max="130" value="${patient?.age ?? ''}" />
        </div>
        <div class="field">
          <label>Jinsi</label>
          <select class="select" name="gender">
            <option value="male" ${patient?.gender === 'male' ? 'selected' : ''}>Erkak</option>
            <option value="female" ${patient?.gender === 'female' ? 'selected' : ''}>Ayol</option>
            <option value="other" ${patient?.gender === 'other' ? 'selected' : ''}>Boshqa</option>
          </select>
        </div>
        <div class="field">
          <label>Telefon</label>
          <input class="input" name="phone" value="${patient?.phone || ''}" />
        </div>
        <div class="field">
          <label>Email</label>
          <input class="input" name="email" type="email" value="${patient?.email || ''}" />
        </div>
        <div class="field">
          <label>Qon guruhi</label>
          <select class="select" name="blood_group">
            <option value="">—</option>
            ${['O+','O-','A+','A-','B+','B-','AB+','AB-'].map(b => `<option ${patient?.blood_group === b ? 'selected' : ''}>${b}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Tayinlangan shifokor</label>
          <select class="select" name="doctor_id">
            <option value="">— Tanlanmagan —</option>
            ${allDoctors.map(d => `<option value="${d.id}" ${patient?.doctor_id == d.id ? 'selected' : ''}>${d.full_name} — ${d.specialty}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Ro'yxatdan o'tish sanasi</label>
          <input class="input" name="registration_date" type="date" value="${patient?.registration_date || ''}" />
        </div>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label>Manzil</label>
        <input class="input" name="address" value="${patient?.address || ''}" />
      </div>
      <div class="field">
        <label>Eslatmalar</label>
        <textarea class="textarea" name="notes">${patient?.notes || ''}</textarea>
      </div>
    `;
    const cancel = UI.el('button', { class: 'btn btn-ghost', type: 'button' }, 'Bekor qilish');
    const save = UI.el('button', { class: 'btn btn-primary', type: 'submit' }, isEdit ? 'Saqlash' : 'Bemorni qo\'shish');
    save.setAttribute('form', 'patientForm');
    const m = UI.modal({ title: isEdit ? 'Bemorni tahrirlash' : 'Yangi bemor qo\'shish', content: form, footer: [cancel, save], size: 'lg' });
    cancel.addEventListener('click', () => m.close());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = UI.serializeForm(form);
      if (data.age) data.age = Number(data.age);
      if (data.doctor_id) data.doctor_id = Number(data.doctor_id);
      save.disabled = true;
      try {
        if (isEdit) await Api.patients.update(patient.id, data);
        else await Api.patients.create(data);
        UI.toast(isEdit ? 'Bemor yangilandi' : 'Bemor qo\'shildi', 'success');
        m.close();
        load();
      } catch (err) {
        UI.showFieldErrors(form, err.errors && err.errors.length ? err.errors : [err.message]);
        save.disabled = false;
      }
    });
  }
})();
