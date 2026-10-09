/* AjiraLink ADMIN-HOME — index.html
   UPDATED:
   - Previous + Browse More buttons for pagination (both tabs).
   - Previous visible only when state.page > 1.
   - Browse More visible only when state.page < state.lastPage.
   - Jobs list is always replaced (no append). */

const state = {
  status: 'published',
  page: 1,
  lastPage: 1,
  total: 0,
  loading: false
};

let currentAdmin = null;

document.addEventListener('DOMContentLoaded', async () => {
  currentAdmin = await bootstrapAdminPage();
  if (!currentAdmin) return;

  bindAdminJobCardNavigation();
  bindTabs();
  bindPostJob();

  renderAdminSkeleton('job-list', 4);
  await loadJobs(1);
});

function bindTabs() {
  document.querySelectorAll('.top-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
      const newStatus = tab.getAttribute('data-status');
      if (newStatus === state.status || state.loading) return;

      state.status = newStatus;
      state.page = 1;

      document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      renderAdminSkeleton('job-list', 4);
      await loadJobs(1);
    });
  });
}

function bindPostJob() {
  const btn = document.getElementById('postJobBtn');
  if (btn) btn.addEventListener('click', () => {
    window.location.href = 'job-create.html';
  });
}

/* loadJobs(page)
   The jobs list is ALWAYS replaced (no append). */
async function loadJobs(page) {
  if (state.loading) return;
  state.loading = true;

  hidePagination();

  renderAdminSkeleton('job-list', 4);

  try {
    const query = buildQuery({ status: state.status, page: page });
    const res = await api.get('/admin/jobs' + query);
    const items = (res && res.data) ? res.data : [];
    const meta = res && res.meta ? res.meta : {};

    state.page = meta.current_page || page;
    state.lastPage = meta.last_page || 1;
    state.total = typeof meta.total === 'number' ? meta.total : items.length;

    renderList(items);
    updatePaginationButtons();

  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      clearToken();
      window.location.replace('login.html');
      return;
    }
    showToast(err.message || 'Failed to load jobs');
    const list = document.getElementById('job-list');
    if (list) list.innerHTML = emptyStateHTML(state.status);
    hidePagination();
  } finally {
    state.loading = false;
  }
}

function renderList(items) {
  const list = document.getElementById('job-list');
  if (!list) return;

  if (items.length) {
    list.innerHTML = items.map(adminJobCardHTML).join('');
  } else {
    list.innerHTML = emptyStateHTML(state.status);
  }

  ensurePaginationWrapper();
}

function ensurePaginationWrapper() {
  let wrap = document.getElementById('admin-browse-more-wrap');
  if (wrap) return;

  wrap = document.createElement('div');
  wrap.className = 'browse-more-wrapper';
  wrap.id = 'admin-browse-more-wrap';
  wrap.style.display = 'none';
  wrap.innerHTML = `
    <button class="btn-browse-more" id="adminPrevBtn" style="display:none;">Previous</button>
    <button class="btn-browse-more" id="adminBrowseMoreBtn">Browse More</button>
  `;
  const scroll = document.querySelector('.scroll-area');
  if (scroll) scroll.appendChild(wrap);

  document.getElementById('adminBrowseMoreBtn').addEventListener('click', async () => {
    if (state.page >= state.lastPage) return;
    await loadJobs(state.page + 1);
  });
  document.getElementById('adminPrevBtn').addEventListener('click', async () => {
    if (state.page <= 1) return;
    await loadJobs(state.page - 1);
  });
}

/* Show/hide Previous and Browse More based on state. */
function updatePaginationButtons() {
  const wrap = document.getElementById('admin-browse-more-wrap');
  const btnMore = document.getElementById('adminBrowseMoreBtn');
  const btnPrev = document.getElementById('adminPrevBtn');
  if (!wrap) return;

  const hasMorePages = state.page < state.lastPage;
  const hasPrevPage  = state.page > 1;

  if (!hasMorePages && !hasPrevPage) {
    wrap.style.display = 'none';
    return;
  }

  wrap.style.display = '';

  if (btnPrev) {
    btnPrev.style.display = hasPrevPage ? '' : 'none';
    btnPrev.textContent = 'Previous';
  }
  if (btnMore) {
    btnMore.style.display = hasMorePages ? '' : 'none';
    btnMore.textContent = 'Browse More';
  }
}

function hidePagination() {
  const wrap = document.getElementById('admin-browse-more-wrap');
  if (wrap) wrap.style.display = 'none';
  const btnMore = document.getElementById('adminBrowseMoreBtn');
  const btnPrev = document.getElementById('adminPrevBtn');
  if (btnMore) btnMore.style.display = 'none';
  if (btnPrev) btnPrev.style.display = 'none';
}

function emptyStateHTML(status) {
  const label = status === 'expired' ? 'expired' : 'active';
  return `
    <div class="empty-state">
      <div class="empty-icon-wrap">
        <i class="fas fa-briefcase empty-icon-large"></i>
      </div>
      <h3>No ${escapeHtml(label)} jobs</h3>
      <p>There are no ${escapeHtml(label)} jobs to show at the moment.</p>
    </div>`;
}