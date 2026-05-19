/**
 * Patient profile – full record with timeline of diagnoses
 */
(async function () {
  if (!UI.requireAuth()) return;
  const root = UI.renderShell({ active: 'patients.html' });
  const role = Auth.user.role;
  const canDiagnose = ['admin', 'clinician'].includes(role);

  const id = new URLSearchParams(location.search).get('id');
  if (!id) { location.href = 'patients.html'; return; }

  root.innerHTML = `<div class="page" id="profileRoot">${UI.loadingState('Bemor ma\'lumotlari yuklanmoqda...')}</div>`;

  try {
    const { data: p } = await Api.patients.get(id);
    document.title = `${p.full_name} — CareTrack`;
    render(p);
  } catch (e) {
    document.getElementById('profileRoot').innerHTML = `
      <div class="empty">
        <h4>Bemor topilmadi</h4>
        <p>${e.message}</p>
        <a href="patients.html" class="btn btn-primary mt-4">Bemorlar ro'yxatiga qaytish</a>
      </div>
    `;
  }

  function render(p) {
    const diagnoses = p.diagnoses || [];
    const stats = severityCounts(diagnoses);

    document.getElementById('profileRoot').innerHTML = `
      <div class="breadcrumb">
        <a href="dashboard.html">Bosh sahifa</a> /
        <a href="patients.html">Bemorlar</a> /
        <span>${p.full_name}</span>
      </div>

      <div class="profile-hero">
        <div class="avatar avatar-lg">${UI.fmt.initials(p.full_name)}</div>
        <div class="info">
          <h1>${p.full_name}</h1>
          <div class="meta">
            <span>👤 ${UI.fmt.gender(p.gender)} • ${p.age || '—'} yosh</span>
            ${p.blood_group ? `<span>🩸 ${p.blood_group}</span>` : ''}
            ${p.phone ? `<span>📞 ${p.phone}</span>` : ''}
            ${p.email ? `<span>✉️ ${p.email}</span>` : ''}
          </div>
          <div class="meta">
            <span>📅 Ro'yxatdan o'tgan: <strong>${UI.fmt.date(p.registration_date)}</strong></span>
            <span>🏥 Tayinlangan shifokor: <strong>${p.doctor_name || 'Tayinlanmagan'}</strong></span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${canDiagnose ? `<button class="btn btn-primary" id="addDiagBtn">${UI.NAV_ICONS.plus} Tashxis qo'shish</button>` : ''}
          <a class="btn btn-ghost" href="patients.html">← Orqaga</a>
        </div>
      </div>

      <div class="grid-stats">
        <div class="stat-card">
          <div class="icon-wrap">${UI.NAV_ICONS.diagnosis}</div>
          <div class="label">Jami tashxislar</div>
          <div class="value">${diagnoses.length}</div>
        </div>
        <div class="stat-card" data-tone="amber">
          <div class="icon-wrap">⚠</div>
          <div class="label">O'rta / Og'ir</div>
          <div class="value">${(stats.moderate || 0) + (stats.severe || 0)}</div>
        </div>
        <div class="stat-card" data-tone="rose">
          <div class="icon-wrap">!</div>
          <div class="label">Kritik</div>
          <div class="value">${stats.critical || 0}</div>
        </div>
        <div class="stat-card" data-tone="teal">
          <div class="icon-wrap">✓</div>
          <div class="label">Yengil</div>
          <div class="value">${stats.mild || 0}</div>
        </div>
      </div>

      <div class="info-grid">
        <div class="item"><div class="label">Manzil</div><div class="value">${p.address || '—'}</div></div>
        <div class="item"><div class="label">Bo'lim</div><div class="value">${p.doctor_department || '—'}</div></div>
        <div class="item"><div class="label">Mutaxassislik</div><div class="value">${p.doctor_specialty || '—'}</div></div>
        <div class="item"><div class="label">Eslatmalar</div><div class="value" style="font-size:14px;font-weight:500">${p.notes || '—'}</div></div>
      </div>

      <div class="card">
        <div class="section-head">
          <div>
            <h3>Tibbiy tarix (Timeline)</h3>
            <div class="muted text-sm">Barcha tashxislar va davolash yozuvlari xronologik tartibda</div>
          </div>
        </div>
        <div id="timelineRoot">
          ${diagnoses.length ? renderTimeline(diagnoses) : UI.emptyState({ title: 'Tashxislar yo\'q', text: 'Hozircha bu bemor uchun tashxis yozilmagan.' })}
        </div>
      </div>
    `;

    if (canDiagnose) {
      document.getElementById('addDiagBtn').addEventListener('click', () => openDiagForm(p));
    }
    document.querySelectorAll('[data-diag-edit]').forEach(b => b.addEventListener('click', async (e) => {
      try { const { data } = await Api.diagnoses.get(e.currentTarget.dataset.diagEdit); openDiagForm(p, data); }
      catch (err) { UI.toast(err.message, 'error'); }
    }));
    document.querySelectorAll('[data-diag-del]').forEach(b => b.addEventListener('click', async (e) => {
      const ok = await UI.confirm({ title: 'Tashxisni o\'chirish', message: 'Bu tashxis o\'chirib tashlanadi.' });
      if (!ok) return;
      try { await Api.diagnoses.remove(e.currentTarget.dataset.diagDel); UI.toast('Tashxis o\'chirildi', 'success'); reload(); }
      catch (err) { UI.toast(err.message, 'error'); }
    }));
  }

  function renderTimeline(items) {
    return `<div class="timeline">${items.map(d => `
      <div class="timeline-item severity-${d.severity}">
        <div class="timeline-head">
          <div>
            <div class="timeline-title">${d.title}</div>
            <code style="background:var(--gray-100);padding:2px 8px;border-radius:6px;font-family:'JetBrains Mono',monospace;font-size:11px">${d.icd_code}</code>
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <span class="badge sev-${d.severity}">${UI.fmt.severity(d.severity)}</span>
            ${canDiagnose ? `
              <button class="btn-icon" data-diag-edit="${d.id}" title="Tahrirlash" style="background:var(--gray-100)">${UI.NAV_ICONS.edit}</button>
              <button class="btn-icon danger" data-diag-del="${d.id}" title="O'chirish" style="background:var(--gray-100)">${UI.NAV_ICONS.trash}</button>
            ` : ''}
          </div>
        </div>
        ${d.description ? `<p style="color:var(--text-soft);margin-top:6px">${d.description}</p>` : ''}
        ${d.treatment_notes ? `<p style="margin-top:8px;padding:10px 12px;background:var(--brand-50);border-radius:8px;font-size:13px"><strong>Davolash:</strong> ${d.treatment_notes}</p>` : ''}
        <div class="timeline-meta">
          <span>📅 ${UI.fmt.date(d.diagnosed_on)}</span>
          ${d.doctor_name ? `<span>👨‍⚕️ ${d.doctor_name}</span>` : ''}
        </div>
      </div>
    `).join('')}</div>`;
  }

  function severityCounts(diagnoses) {
    return diagnoses.reduce((acc, d) => { acc[d.severity] = (acc[d.severity] || 0) + 1; return acc; }, {});
  }

  async function openDiagForm(patient, diag = null) {
    const isEdit = !!diag;
    let allDoctors = [];
    try { const { data } = await Api.doctors.list(); allDoctors = data; } catch {}

    const form = document.createElement('form');
    form.id = 'pdiagForm';
    form.innerHTML = `
      <div class="grid-3" style="margin-bottom:12px">
        <div class="field" style="grid-column:span 2">
          <label>Bemor</label>
          <input class="input" disabled value="${patient.full_name}" />
          <input type="hidden" name="patient_id" value="${patient.id}" />
        </div>
        <div class="field">
          <label>ICD kodi *</label>
          <input class="input" name="icd_code" required value="${diag?.icd_code || ''}" />
        </div>
        <div class="field" style="grid-column:span 2">
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
          <label>Shifokor</label>
          <select class="select" name="doctor_id">
            <option value="">— Tanlanmagan —</option>
            ${allDoctors.map(d => `<option value="${d.id}" ${(diag?.doctor_id || patient.doctor_id) == d.id ? 'selected' : ''}>${d.full_name}</option>`).join('')}
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
    const save = UI.el('button', { class: 'btn btn-primary', type: 'submit' }, isEdit ? 'Saqlash' : 'Qo\'shish');
    save.setAttribute('form', 'pdiagForm');
    const m = UI.modal({ title: isEdit ? 'Tashxisni tahrirlash' : `${patient.full_name} uchun tashxis`, content: form, footer: [cancel, save], size: 'lg' });
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
        reload();
      } catch (err) {
        UI.showFieldErrors(form, err.errors && err.errors.length ? err.errors : [err.message]);
        save.disabled = false;
      }
    });
  }

  async function reload() {
    try { const { data } = await Api.patients.get(id); render(data); }
    catch (e) { UI.toast(e.message, 'error'); }
  }
})();
