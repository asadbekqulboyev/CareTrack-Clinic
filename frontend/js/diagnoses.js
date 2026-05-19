/**
 * Diagnoses – CRUD page (admin & clinician)
 */
(async function () {
  if (!UI.requireAuth(['admin', 'clinician'])) return;
  const root = UI.renderShell({ active: 'diagnoses.html' });
  const canEdit = Auth.hasRole('admin', 'clinician');

  const params = new URLSearchParams(location.search);

  root.innerHTML = `
    <div class="page">
      <div class="page-head">
        <div>
          <div class="breadcrumb"><a href="dashboard.html">Bosh sahifa</a> / <span>Tashxislar</span></div>
          <h1>Tashxislar</h1>
          <div class="sub">Bemorlar uchun tashxislarni boshqaring va kuzating.</div>
        </div>
        ${canEdit ? `<button class="btn btn-primary" id="addBtn">${UI.NAV_ICONS.plus} Yangi tashxis</button>` : ''}
      </div>

      <div class="filter-bar">
        <div class="input-with-icon">
          <span class="ico">${UI.NAV_ICONS.search}</span>
          <input class="input" id="searchInput" placeholder="ICD kodi, tashxis nomi yoki tavsif..." />
        </div>
        <select class="select" id="severityFilter">
          <option value="">Barcha darajalar</option>
          <option value="mild">Yengil</option>
          <option value="moderate">O'rta</option>
          <option value="severe">Og'ir</option>
          <option value="critical">Kritik</option>
        </select>
        <select class="select" id="patientFilter">
          <option value="">Barcha bemorlar</option>
        </select>
        <input type="date" class="input" id="fromDate" style="max-width:160px" />
        <input type="date" class="input" id="toDate" style="max-width:160px" />
      </div>

      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>ICD kodi</th>
              <th>Tashxis</th>
              <th>Bemor</th>
              <th>Shifokor</th>
              <th>Daraja</th>
              <th>Sana</th>
              <th style="text-align:right">Amallar</th>
            </tr>
          </thead>
          <tbody id="diagBody">
            <tr><td colspan="7">${UI.loadingState()}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;

  let allPatients = [];
  let allDoctors = [];
  await Promise.all([loadPatients(), loadDoctors()]);

  // Pre-select patient from URL (?patient_id=xxx)
  if (params.get('patient_id')) {
    document.getElementById('patientFilter').value = params.get('patient_id');
  }

  const search = document.getElementById('searchInput');
  const sev = document.getElementById('severityFilter');
  const patientF = document.getElementById('patientFilter');
  const fromDate = document.getElementById('fromDate');
  const toDate = document.getElementById('toDate');
  search.addEventListener('input', UI.debounce(load, 250));
  [sev, patientF, fromDate, toDate].forEach(el => el.addEventListener('change', load));
  if (canEdit) document.getElementById('addBtn').addEventListener('click', () => openForm());

  await load();

  async function loadPatients() {
    try {
      const { data } = await Api.patients.list();
      allPatients = data;
      const sel = document.getElementById('patientFilter');
      data.forEach(p => sel.insertAdjacentHTML('beforeend', `<option value="${p.id}">${p.full_name}</option>`));
    } catch {}
  }
  async function loadDoctors() {
    try { const { data } = await Api.doctors.list(); allDoctors = data; } catch {}
  }

  async function load() {
    const tbody = document.getElementById('diagBody');
    tbody.innerHTML = `<tr><td colspan="7">${UI.loadingState()}</td></tr>`;
    try {
      const { data } = await Api.diagnoses.list({
        q: search.value, severity: sev.value, patient_id: patientF.value,
        from: fromDate.value, to: toDate.value,
      });
      if (!data.length) { tbody.innerHTML = `<tr><td colspan="7">${UI.emptyState({ title: 'Tashxis topilmadi', text: 'Filtrlarni o\'zgartirib ko\'ring.' })}</td></tr>`; return; }
      tbody.innerHTML = data.map(d => row(d)).join('');
      tbody.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', onAction));
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty"><h4>Xatolik</h4><p>${e.message}</p></div></td></tr>`;
    }
  }

  function row(d) {
    return `
      <tr>
        <td><code style="background:var(--gray-100);padding:3px 8px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:12px">${d.icd_code}</code></td>
        <td>
          <div style="font-weight:600">${d.title}</div>
          ${d.description ? `<div class="muted text-xs" style="max-width:340px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.description}</div>` : ''}
        </td>
        <td>${d.patient_name ? `<a href="patient-profile.html?id=${d.patient_id}">${d.patient_name}</a>` : '<span class="muted">—</span>'}</td>
        <td>${d.doctor_name || '<span class="muted">—</span>'}</td>
        <td><span class="badge sev-${d.severity} badge-dot">${UI.fmt.severity(d.severity)}</span></td>
        <td>${UI.fmt.date(d.diagnosed_on)}</td>
        <td style="text-align:right">
          <div class="row-actions">
            ${canEdit ? `
              <button class="btn-icon" data-act="edit" data-id="${d.id}" title="Tahrirlash">${UI.NAV_ICONS.edit}</button>
              <button class="btn-icon danger" data-act="delete" data-id="${d.id}" title="O'chirish">${UI.NAV_ICONS.trash}</button>
            ` : '<span class="muted text-xs">—</span>'}
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
      const ok = await UI.confirm({ title: 'Tashxisni o\'chirish', message: 'Ushbu tashxis o\'chiriladi.', okText: 'Ha, o\'chirish' });
      if (!ok) return;
      try { await Api.diagnoses.remove(id); UI.toast('Tashxis o\'chirildi', 'success'); load(); }
      catch (err) { UI.toast(err.message, 'error'); }
    }
    if (act === 'edit') {
      try { const { data } = await Api.diagnoses.get(id); openForm(data); }
      catch (err) { UI.toast(err.message, 'error'); }
    }
  }

  function openForm(diag = null) {
    const isEdit = !!diag;
    const form = document.createElement('form');
    form.id = 'diagForm';
    form.innerHTML = `
      <div class="grid-3" style="margin-bottom:12px">
        <div class="field">
          <label>Bemor *</label>
          <select class="select" name="patient_id" required>
            <option value="">— Tanlang —</option>
            ${allPatients.map(p => `<option value="${p.id}" ${diag?.patient_id == p.id ? 'selected' : ''}>${p.full_name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Shifokor</label>
          <select class="select" name="doctor_id">
            <option value="">— Tanlanmagan —</option>
            ${allDoctors.map(d => `<option value="${d.id}" ${diag?.doctor_id == d.id ? 'selected' : ''}>${d.full_name}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>ICD kodi *</label>
          <input class="input" name="icd_code" required placeholder="masalan: I10" value="${diag?.icd_code || ''}" />
        </div>
        <div class="field" style="grid-column: span 2">
          <label>Tashxis nomi *</label>
          <input class="input" name="title" required value="${diag?.title || ''}" />
        </div>
        <div class="field">
          <label>Daraja</label>
          <select class="select" name="severity">
            ${['mild','moderate','severe','critical'].map(s => `<option value="${s}" ${diag?.severity === s ? 'selected' : ''}>${UI.fmt.severity(s)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label>Tashxis sanasi</label>
          <input class="input" name="diagnosed_on" type="date" value="${diag?.diagnosed_on || ''}" />
        </div>
      </div>
      <div class="field" style="margin-bottom:12px">
        <label>Tavsif</label>
        <textarea class="textarea" name="description">${diag?.description || ''}</textarea>
      </div>
      <div class="field">
        <label>Davolash bo'yicha eslatmalar</label>
        <textarea class="textarea" name="treatment_notes">${diag?.treatment_notes || ''}</textarea>
      </div>
    `;
    const cancel = UI.el('button', { class: 'btn btn-ghost', type: 'button' }, 'Bekor qilish');
    const save = UI.el('button', { class: 'btn btn-primary', type: 'submit' }, isEdit ? 'Saqlash' : 'Tashxis qo\'shish');
    save.setAttribute('form', 'diagForm');
    const m = UI.modal({ title: isEdit ? 'Tashxisni tahrirlash' : 'Yangi tashxis qo\'shish', content: form, footer: [cancel, save], size: 'lg' });
    cancel.addEventListener('click', () => m.close());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = UI.serializeForm(form);
      data.patient_id = Number(data.patient_id);
      if (data.doctor_id) data.doctor_id = Number(data.doctor_id); else delete data.doctor_id;
      save.disabled = true;
      try {
        if (isEdit) await Api.diagnoses.update(diag.id, data);
        else await Api.diagnoses.create(data);
        UI.toast(isEdit ? 'Tashxis yangilandi' : 'Tashxis qo\'shildi', 'success');
        m.close();
        load();
      } catch (err) {
        UI.showFieldErrors(form, err.errors && err.errors.length ? err.errors : [err.message]);
        save.disabled = false;
      }
    });
  }
})();
