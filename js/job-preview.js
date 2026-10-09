/* AjiraLink ADMIN-JOB-PREVIEW — job-preview.html
   Reads the stored preview payload from sessionStorage (set by
   job-form.js on the create/edit screens) and renders the same layout
   as ADMIN-JOB-DETAILS. The "Post Job" button reuses submitJob via
   the exported onSubmit path (see job-form.js). */

let previewData = null;

document.addEventListener('DOMContentLoaded', async () => {
  const admin = await bootstrapAdminPage();
  if (!admin) return;

  const raw = sessionStorage.getItem('ajiralink_job_preview');
  if (!raw) {
    showToast('Nothing to preview');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
    return;
  }

  try {
    previewData = JSON.parse(raw);
  } catch (e) {
    showToast('Preview data is corrupted');
    setTimeout(() => { window.location.href = 'index.html'; }, 500);
    return;
  }

  // Fetch lookup names for display (payload only has ids)
  await renderPreview(previewData.payload);

  // Back button: return to the form we came from
  document.getElementById('backBtn').addEventListener('click', () => {
    if (previewData.mode === 'edit' && previewData.jobId) {
      window.location.href = 'job-edit.html?id=' + encodeURIComponent(previewData.jobId);
    } else {
      window.location.href = 'job-create.html';
    }
  });

  // Post Job: reuse the same submit logic
  document.getElementById('postFromPreviewBtn').addEventListener('click', () => {
    // Re-hydrate form elements so collectForm() works — simplest way
    // is to write the payload into sessionStorage and re-navigate is
    // not acceptable, so we build the payload straight and call the
    // same API endpoints directly.
    submitFromPreview();
  });
});

async function renderPreview(payload) {
  const body = document.getElementById('preview-body-content');
  if (!body) return;

  // Resolve lookup names (ids → labels) via the documented endpoints
  const [locs, cats, jts, wts] = await Promise.all([
    api.get('/locations').catch(() => ({data: []})),
    api.get('/categories').catch(() => ({data: []})),
    api.get('/job-types').catch(() => ({data: []})),
    api.get('/work-types').catch(() => ({data: []}))
  ]);

  const nameOf = (list, id) => {
    const found = (list.data || []).find(x => x.id === id);
    return found ? found.name : '';
  };

  const loc = nameOf(locs, payload.location_id);
  const cat = nameOf(cats, payload.category_id);
  const jt  = nameOf(jts, payload.job_type_id);
  const wt  = nameOf(wts, payload.work_type_id);

  const lines = [];
  if (payload.company_name)             lines.push(row('Company', payload.company_name));
  if (loc)                              lines.push(row('Location :', loc));
  if (cat)                              lines.push(row('Category', cat));
  if (jt)                               lines.push(row('Job type', jt));
  if (wt)                               lines.push(row('Work type', wt));
  if (payload.salary)                   lines.push(row('Salary', payload.salary));
  if (payload.positions_available) {
    const lbl = payload.positions_available + ' Position' + (payload.positions_available === 1 ? '' : 's');
    lines.push(row('Position', lbl));
  }
  if (payload.posted_date)              lines.push(row('Posted date', 'Posted ' + formatDate(payload.posted_date)));
  if (payload.closed_date)              lines.push(row('Deadline date', formatDate(payload.closed_date)));

  body.innerHTML = `
    <div class="details-job-title">${escapeHtml(payload.title || '')}</div>

    <div class="basic-details-card">
      <div class="basic-details-title">Basic Job Details</div>
      <div class="job-info-centered">
        <div class="info-block">${lines.join('')}</div>
      </div>
    </div>

    <div class="details-section">
      <div class="rich-content">${payload.job_content || ''}</div>
    </div>
  `;
}

function row(label, value) {
  return `<div class="detail-line"><span class="label">${escapeHtml(label)}:</span> <span class="value">${escapeHtml(value)}</span></div>`;
}

async function submitFromPreview() {
  if (!previewData) return;
  const btn = document.getElementById('postFromPreviewBtn');
  const isEdit = previewData.mode === 'edit';
  btn.disabled = true;
  btn.textContent = isEdit ? 'Updating...' : 'Posting...';

  try {
    if (isEdit) {
      await api.put('/admin/jobs/' + encodeURIComponent(previewData.jobId), previewData.payload);
    } else {
      await api.post('/admin/jobs', previewData.payload);
    }
    showToast(isEdit ? 'Job updated successfully' : 'Job posted successfully');
    sessionStorage.removeItem('ajiralink_job_preview');
    setTimeout(() => {
      if (isEdit && previewData.jobId) {
        window.location.href = 'job-details.html?id=' + encodeURIComponent(previewData.jobId);
      } else {
        window.location.href = 'index.html';
      }
    }, 600);
  } catch (err) {
    let msg = err.message || 'Save failed';
    if (err.errors) {
      const firstKey = Object.keys(err.errors)[0];
      if (firstKey && err.errors[firstKey][0]) msg = err.errors[firstKey][0];
    }
    showToast(msg);
    btn.disabled = false;
    btn.textContent = 'Post Job';
  }
}