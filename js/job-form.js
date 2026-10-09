/* AjiraLink ADMIN-JOB-CREATE + ADMIN-JOB-EDIT — shared form logic.
   UPDATED:
   - Job content is sanitized before sending to backend:
     removes inline styles, Quill size/font/indent classes,
     and empty span tags. This ensures the public display
     (.rich-content) can control font-size correctly.
   - positions_available and salary are optional. */

let quillEditor = null;

const quillToolbarOptions = [
  [{ 'header': [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ 'list': 'ordered' }, { 'list': 'bullet' }],
  [{ 'align': [] }],
  ['link'],
  ['clean']
];

/* Quill classes that would otherwise override .rich-content font-size. */
const QUILL_SIZE_CLASSES = [
  'ql-size-small',
  'ql-size-large',
  'ql-size-huge',
  'ql-font-serif',
  'ql-font-monospace',
  'ql-indent-1',
  'ql-indent-2',
  'ql-indent-3',
  'ql-indent-4',
  'ql-indent-5',
  'ql-indent-6',
  'ql-indent-7',
  'ql-indent-8'
];

/* Sanitize HTML coming out of Quill before saving to the backend.
   - Removes all inline style attributes.
   - Removes Quill size / font / indent classes.
   - Removes bare <span> wrappers with no attributes.
   Keeps semantic tags (h1/h2/h3/p/ul/ol/li/strong/em/u/s/a/blockquote). */
function sanitizeJobHtml(html) {
  if (!html) return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;

  // 1. Remove inline styles
  temp.querySelectorAll('[style]').forEach(el => {
    el.removeAttribute('style');
  });

  // 2. Remove Quill size / font / indent classes
  QUILL_SIZE_CLASSES.forEach(cls => {
    temp.querySelectorAll('.' + cls).forEach(el => {
      el.classList.remove(cls);
      if (el.classList.length === 0) el.removeAttribute('class');
    });
  });

  // 3. Remove bare <span> wrappers (no attributes left)
  temp.querySelectorAll('span').forEach(span => {
    if (span.attributes.length === 0) {
      const parent = span.parentNode;
      while (span.firstChild) parent.insertBefore(span.firstChild, span);
      parent.removeChild(span);
    }
  });

  return temp.innerHTML.trim();
}

async function initJobForm(opts) {
  const admin = await bootstrapAdminPage();
  if (!admin) return;

  // Init Quill
  quillEditor = new Quill('#p-content-editor', {
    theme: 'snow',
    placeholder: 'Andika hapa: Description, Responsibilities, Requirements, Qualifications, Experience, Skills, n.k.',
    modules: { toolbar: quillToolbarOptions }
  });

  // Load all 5 lookups in parallel
  await Promise.all([
    loadLookup('/locations',  document.getElementById('p-location'),  'Select location'),
    loadLookup('/categories', document.getElementById('p-category'),  'Select category'),
    loadLookup('/job-types',  document.getElementById('p-type'),      'Select job type'),
    loadLookup('/work-types', document.getElementById('p-worktype'),  'Select work type'),
    loadLookup('/sources',    document.getElementById('p-source'),    'Select source')
  ]);

  // Bind buttons
  document.getElementById('previewBtn').addEventListener('click', () => onPreview(opts));
  document.getElementById('submitBtn').addEventListener('click', () => onSubmit(opts, false));

  // Restore from preview storage (covers back-from-preview)
  const restored = restoreFromPreviewStorage(opts);
  if (restored) return;

  // Edit: prefill form from API (fresh visit)
  if (opts.mode === 'edit') {
    if (!opts.jobId) {
      showToast('Missing job id');
      return;
    }
    try {
      const res = await api.get('/admin/jobs/' + encodeURIComponent(opts.jobId));
      const job = res && res.data ? res.data : null;
      if (!job) { showToast('Job not found'); return; }
      prefillForm(job);
    } catch (err) {
      showToast(err.message || 'Failed to load job');
    }
  }
}

/* Restore form fields from preview storage (set by onPreview). */
function restoreFromPreviewStorage(opts) {
  let raw = null;
  try { raw = sessionStorage.getItem('ajiralink_job_preview'); } catch (e) { return false; }
  if (!raw) return false;

  let data = null;
  try { data = JSON.parse(raw); } catch (e) { return false; }
  if (!data || !data.payload) return false;

  const sameMode = data.mode === opts.mode;
  const sameJob =
    (opts.mode === 'edit' && data.jobId && opts.jobId && data.jobId === opts.jobId) ||
    (opts.mode === 'create' && !data.jobId && !opts.jobId);
  if (!sameMode || !sameJob) return false;

  const p = data.payload || {};
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };

  set('p-title', p.title);
  set('p-company', p.company_name);
  set('p-positions', p.positions_available);
  set('p-salary', p.salary);
  set('p-deadline', p.closed_date);
  set('p-posted', p.posted_date);
  set('p-apply-url', p.application_url);

  if (p.location_id)  document.getElementById('p-location').value  = p.location_id;
  if (p.category_id)  document.getElementById('p-category').value  = p.category_id;
  if (p.job_type_id)  document.getElementById('p-type').value      = p.job_type_id;
  if (p.work_type_id) document.getElementById('p-worktype').value  = p.work_type_id;
  if (p.source_id)    document.getElementById('p-source').value    = p.source_id;

  if (p.job_content) {
    try { quillEditor.clipboard.dangerouslyPasteHTML(p.job_content); }
    catch (e) { quillEditor.root.innerHTML = p.job_content; }
  }
  return true;
}

function prefillForm(job) {
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.value = v || ''; };

  set('p-title', job.title);
  set('p-company', job.company_name);
  set('p-positions', job.positions_available);
  set('p-salary', job.salary);
  set('p-deadline', job.closed_date);
  set('p-posted', job.posted_date);
  set('p-apply-url', job.application_url);

  if (job.location)  document.getElementById('p-location').value  = job.location.id;
  if (job.category)  document.getElementById('p-category').value  = job.category.id;
  if (job.job_type)  document.getElementById('p-type').value      = job.job_type.id;
  if (job.work_type) document.getElementById('p-worktype').value  = job.work_type.id;
  if (job.source)    document.getElementById('p-source').value    = job.source.id;

  if (job.job_content) {
    try { quillEditor.clipboard.dangerouslyPasteHTML(job.job_content); }
    catch (e) { quillEditor.root.innerHTML = job.job_content; }
  }
}

/* Collect + validate form.
   UPDATED: job_content is sanitized before sending. */
function collectForm() {
  const title = document.getElementById('p-title').value.trim();
  const company = document.getElementById('p-company').value.trim();
  const location_id = document.getElementById('p-location').value;
  const category_id = document.getElementById('p-category').value;
  const job_type_id = document.getElementById('p-type').value;
  const work_type_id = document.getElementById('p-worktype').value;
  const positionsRaw = document.getElementById('p-positions').value.trim();
  const salaryRaw = document.getElementById('p-salary').value.trim();
  const closed_date = document.getElementById('p-deadline').value;
  const posted_date = document.getElementById('p-posted').value;
  const source_id = document.getElementById('p-source').value;
  const application_url = document.getElementById('p-apply-url').value.trim();

  // UPDATED: sanitize the HTML coming out of Quill
  const rawContent = quillEditor.getText().trim() === '' ? '' : quillEditor.root.innerHTML;
  const job_content = sanitizeJobHtml(rawContent);

  // Required fields
  if (!title)             { showToast('Job title is required'); return null; }
  if (!company)           { showToast('Company is required'); return null; }
  if (!location_id)       { showToast('Location is required'); return null; }
  if (!category_id)       { showToast('Category is required'); return null; }
  if (!job_type_id)       { showToast('Job type is required'); return null; }
  if (!work_type_id)      { showToast('Work type is required'); return null; }
  if (!closed_date)       { showToast('Deadline is required'); return null; }
  if (!posted_date)       { showToast('Posted date is required'); return null; }
  if (!source_id)         { showToast('Source is required'); return null; }
  if (!application_url)   { showToast('Application URL is required'); return null; }
  try {
    new URL(application_url);
  } catch (e) {
    showToast('Application URL must be a valid URL');
    return null;
  }
  if (!job_content)       { showToast('Job content is required'); return null; }

  // Optional: positions_available — validate only if provided
  let positions = null;
  if (positionsRaw !== '') {
    const parsed = parseInt(positionsRaw, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      showToast('Positions must be an integer of at least 1');
      return null;
    }
    positions = parsed;
  }

  // Optional: salary — no validation, use null if empty
  const salary = salaryRaw !== '' ? salaryRaw : null;

  return {
    title,
    company_name: company,
    job_content,
    positions_available: positions,
    salary,
    posted_date,
    closed_date,
    application_url,
    category_id,
    source_id,
    job_type_id,
    work_type_id,
    location_id
  };
}

/* ---- PREVIEW ---- */
function onPreview(opts) {
  const payload = collectForm();
  if (!payload) return;
  sessionStorage.setItem('ajiralink_job_preview', JSON.stringify({
    mode: opts.mode,
    jobId: opts.jobId || null,
    payload
  }));
  window.location.href = 'job-preview.html';
}

/* ---- SUBMIT ---- */
async function onSubmit(opts, fromPreview) {
  const payload = collectForm();
  if (!payload) return;

  const btn = document.getElementById('submitBtn');
  const isEdit = opts.mode === 'edit';
  btn.disabled = true;
  btn.textContent = isEdit ? 'Updating...' : 'Posting...';

  try {
    let res;
    if (isEdit) {
      res = await api.put('/admin/jobs/' + encodeURIComponent(opts.jobId), payload);
    } else {
      res = await api.post('/admin/jobs', payload);
    }
    showToast(isEdit ? 'Job updated successfully' : 'Job posted successfully');

    sessionStorage.removeItem('ajiralink_job_preview');

    setTimeout(() => {
      if (isEdit && opts.jobId) {
        window.location.href = 'job-details.html?id=' + encodeURIComponent(opts.jobId);
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
    btn.textContent = isEdit ? 'Update Job' : 'Post Job';
  }
}