/* AjiraLink ADMIN-JOB-DETAILS — job-details.html
   Endpoints: GET /admin/jobs/{id}   (any status)
              DELETE /admin/jobs/{id} (soft delete, confirmation required) */

let currentJob = null;

document.addEventListener('DOMContentLoaded', async () => {
  const admin = await bootstrapAdminPage();
  if (!admin) return;

  const id = new URLSearchParams(window.location.search).get('id');
  if (!id) {
    renderNotFound('Job not found');
    return;
  }

  showSkeleton();

  try {
    const res = await api.get('/admin/jobs/' + encodeURIComponent(id));
    const job = res && res.data ? res.data : null;
    if (!job) {
      renderNotFound('Job not found');
      return;
    }
    currentJob = job;
    renderJob(job);
  } catch (err) {
    if (err.status === 404) renderNotFound('Job not found');
    else renderNotFound(err.message || 'Failed to load job');
  }
});

function showSkeleton() {
  const body = document.getElementById('details-body-content');
  if (!body) return;
  let rows = '';
  for (let i = 0; i < 9; i++) {
    rows += `<div class="sk-block" style="width:75%;height:12px;margin-bottom:8px;border-radius:6px;"></div>`;
  }
  body.innerHTML = `
    <div class="sk-block" style="width:60%;height:20px;margin:0 auto 16px;border-radius:6px;"></div>
    <div class="basic-details-card">
      <div class="sk-block" style="width:130px;height:14px;margin:0 auto 12px;border-radius:6px;"></div>
      ${rows}
    </div>`;
}

function renderJob(job) {
  const body = document.getElementById('details-body-content');
  if (!body) return;

  const loc = job.location ? job.location.name : '';
  const cat = job.category ? job.category.name : '';
  const jt  = job.job_type ? job.job_type.name : '';
  const wt  = job.work_type ? job.work_type.name : '';

  // Skip missing fields (Screen Spec §G — "Line not displayed")
  const lines = [];
  if (job.company_name) lines.push(row('Company', job.company_name));
  if (loc)               lines.push(row('Location :', loc));
  if (cat)               lines.push(row('Category', cat));
  if (jt)                lines.push(row('Job type', jt));
  if (wt)                lines.push(row('Work type', wt));
  if (job.salary)        lines.push(row('Salary', job.salary));
  if (job.positions_available) {
    const lbl = job.positions_available + ' Position' + (job.positions_available === 1 ? '' : 's');
    lines.push(row('Position', lbl));
  }
  if (job.posted_date)   lines.push(row('Posted date', 'Posted ' + formatDate(job.posted_date)));
  if (job.closed_date)   lines.push(row('Deadline date', formatDate(job.closed_date)));

  body.innerHTML = `
    <div class="details-job-title">${escapeHtml(job.title || '')}</div>

    <div class="basic-details-card">
      <div class="basic-details-title">Basic Job Details</div>
      <div class="job-info-centered">
        <div class="info-block">${lines.join('')}</div>
      </div>
    </div>

    <div class="details-section">
      <div class="rich-content">${job.job_content || ''}</div>
    </div>
  `;

  // Show action bar
  const bar = document.getElementById('actions-bar');
  if (bar) bar.style.display = '';

  document.getElementById('editBtn').addEventListener('click', () => {
    window.location.href = 'job-edit.html?id=' + encodeURIComponent(job.id);
  });
  document.getElementById('deleteBtn').addEventListener('click', confirmDelete);
}

function row(label, value) {
  return `<div class="detail-line"><span class="label">${escapeHtml(label)}:</span> <span class="value">${escapeHtml(value)}</span></div>`;
}

async function confirmDelete() {
  if (!currentJob) return;

  // Confirmation dialog (Screen Spec: "Yes, a confirmation message is required before deletion")
  const ok = window.confirm('Are you sure you want to delete this job?');
  if (!ok) return;

  const btn = document.getElementById('deleteBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-trash"></i> Deleting...';

  try {
    await api.del('/admin/jobs/' + encodeURIComponent(currentJob.id));
    showToast('Job deleted successfully');
    setTimeout(() => { window.location.href = 'index.html'; }, 700);
  } catch (err) {
    showToast(err.message || 'Failed to delete job');
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-trash"></i> Delete';
  }
}

function renderNotFound(msg) {
  const body = document.getElementById('details-body-content');
  if (!body) return;
  body.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon-wrap"><i class="fas fa-briefcase empty-icon-large"></i></div>
      <h3>${escapeHtml(msg)}</h3>
      <p>This job may have been removed.</p>
    </div>`;
}