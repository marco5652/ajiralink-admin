/* AjiraLink Admin — Shared Layout (drawer, toast, header nav)
   UPDATED: adminJobCardHTML() now shows "Deadline [closed_date]"
   instead of "Posted [posted_date]". If closed_date is null, the
   line is hidden. Everything else unchanged. */

function injectToast() {
  if (document.getElementById('toast')) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.id = 'toast';
  document.body.appendChild(t);
}

let __toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(__toastTimer);
  __toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

function injectDrawer() {
  if (document.getElementById('hamburgerDropdown')) return;

  const overlay = document.createElement('div');
  overlay.className = 'drawer-overlay';
  overlay.id = 'drawerOverlay';
  overlay.addEventListener('click', closeDrawer);

  const drawer = document.createElement('div');
  drawer.className = 'drawer-menu-container';
  drawer.id = 'hamburgerDropdown';
  drawer.innerHTML = `
    <div class="drawer-header">
      <div class="drawer-header-title">Ajira<span>Link</span></div>
      <button class="drawer-close-btn" aria-label="Close" id="drawerCloseBtn">
        <i class="fas fa-times"></i>
      </button>
    </div>
    <div class="drawer-item" id="drawerVisitors">
      <i class="fas fa-users"></i> Website Visitors
    </div>
    <div class="drawer-item logout-item" id="drawerLogout">
      <i class="fas fa-sign-out-alt"></i> Logout
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.appendChild(drawer);

  document.getElementById('drawerCloseBtn').addEventListener('click', closeDrawer);
  document.getElementById('drawerVisitors').addEventListener('click', () => {
    window.location.href = 'visitors.html';
  });
  document.getElementById('drawerLogout').addEventListener('click', () => {
    closeDrawer();
    doLogout();
  });
}

function openDrawer() {
  const d = document.getElementById('hamburgerDropdown');
  const o = document.getElementById('drawerOverlay');
  if (d) d.classList.add('show');
  if (o) o.classList.add('show');
}
function closeDrawer() {
  const d = document.getElementById('hamburgerDropdown');
  const o = document.getElementById('drawerOverlay');
  if (d) d.classList.remove('show');
  if (o) o.classList.remove('show');
}

function bindHamburger() {
  const btn = document.querySelector('.hamburger-menu-btn');
  if (btn) btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openDrawer();
  });
}

async function bootstrapAdminPage() {
  if (!requireAdmin()) return null;

  injectToast();
  injectDrawer();
  bindHamburger();

  const admin = await loadCurrentAdmin();
  if (!admin) return null;
  return admin;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return d.getDate() + ' ' + months[d.getMonth()] + ', ' + d.getFullYear();
}

/* Admin job card — UPDATED: "Deadline [closed_date]" instead
   of "Posted [posted_date]". Hidden when closed_date is null. */
function adminJobCardHTML(job) {
  const loc = job.location ? job.location.name : '';
  const cat = job.category ? job.category.name : '';
  const jt  = job.job_type ? job.job_type.name : '';
  const wt  = job.work_type ? job.work_type.name : '';
  const src = job.source ? job.source.name : '';
  const pos = job.positions_available
    ? (job.positions_available + (job.positions_available === 1 ? ' Position' : ' Positions'))
    : '';
  const deadline = job.closed_date ? ('Deadline ' + formatDate(job.closed_date)) : '';
  const logo = job.company_logo || (job.company_name ? job.company_name.charAt(0).toUpperCase() : '?');
  const dotClass = job.status === 'expired' ? 'source-dot expired' : 'source-dot';

  return `
    <div class="job-card" data-id="${job.id}">
      <div class="row1">
        <div class="job-card-left">
          <div class="job-logo">${escapeHtml(logo)}</div>
          <div class="job-text-wrap">
            <div class="job-title">${escapeHtml(job.title || '')}</div>
            <div class="job-company">${escapeHtml(job.company_name || '')}</div>
          </div>
        </div>
      </div>
      <div class="job-meta-clean">
        ${loc ? `<span class="meta-text-item"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(loc)}</span>` : ''}
        ${cat ? `<span class="meta-text-item"><i class="fas fa-th-large"></i> ${escapeHtml(cat)}</span>` : ''}
        ${jt  ? `<span class="meta-text-item"><i class="fas fa-clock"></i> ${escapeHtml(jt)}</span>` : ''}
        ${wt  ? `<span class="meta-text-item"><i class="fas fa-briefcase"></i> ${escapeHtml(wt)}</span>` : ''}
        ${pos ? `<span class="meta-text-item"><i class="fas fa-users"></i> ${escapeHtml(pos)}</span>` : ''}
      </div>
      <div class="job-footer">
        <div class="source-tag">
          <span class="${dotClass}"></span> ${escapeHtml(src)}
        </div>
        <button class="btn-view" data-view="${job.id}">View Job</button>
      </div>
      ${deadline ? `<div class="posted-time">${escapeHtml(deadline)}</div>` : ''}
    </div>`;
}

/* Delegated navigation on any admin page that lists job cards. */
function bindAdminJobCardNavigation() {
  document.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view]');
    if (viewBtn) {
      e.stopPropagation();
      window.location.href = 'job-details.html?id=' + encodeURIComponent(viewBtn.getAttribute('data-view'));
      return;
    }
    const card = e.target.closest('.job-card');
    if (card && card.getAttribute('data-id')) {
      window.location.href = 'job-details.html?id=' + encodeURIComponent(card.getAttribute('data-id'));
    }
  });
}

function adminSkeletonCardHTML() {
  return `
    <div class="skeleton-card">
      <div class="sk-row">
        <div class="sk-block sk-logo"></div>
        <div class="sk-lines">
          <div class="sk-block sk-line title"></div>
          <div class="sk-block sk-line company"></div>
        </div>
      </div>
      <div class="sk-meta">
        <div class="sk-block sk-chip"></div>
        <div class="sk-block sk-chip"></div>
        <div class="sk-block sk-chip"></div>
        <div class="sk-block sk-chip"></div>
      </div>
      <div class="sk-footer">
        <div class="sk-block sk-footer-left"></div>
        <div class="sk-block sk-footer-right"></div>
      </div>
      <div class="sk-block sk-time"></div>
    </div>`;
}

function renderAdminSkeleton(containerId, count) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({length: count || 4}).map(adminSkeletonCardHTML).join('');
}