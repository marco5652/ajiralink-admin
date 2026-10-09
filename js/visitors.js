/* AjiraLink ADMIN-VISITORS — visitors.html
   Endpoint: GET /admin/analytics/visitors
   Returns: AnalyticsResource
   { total_visitors, today_visitors, last_7_days, last_14_days, last_30_days } */

document.addEventListener('DOMContentLoaded', async () => {
  const admin = await bootstrapAdminPage();
  if (!admin) return;

  showVisitorsSkeleton();

  try {
    const res = await api.get('/admin/analytics/visitors');
    const data = res && res.data ? res.data : null;
    if (!data) {
      renderVisitors({
        total_visitors: 0,
        today_visitors: 0,
        last_7_days: 0,
        last_14_days: 0,
        last_30_days: 0
      });
    } else {
      renderVisitors(data);
    }
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      clearToken();
      window.location.replace('login.html');
      return;
    }
    showToast(err.message || 'Failed to load analytics');
    // Render zeros on failure (Screen Spec: "No data available → metrics show 0")
    renderVisitors({
      total_visitors: 0,
      today_visitors: 0,
      last_7_days: 0,
      last_14_days: 0,
      last_30_days: 0
    });
  }
});

function showVisitorsSkeleton() {
  const body = document.getElementById('visitors-body-content');
  if (!body) return;

  let cards = '';
  for (let i = 0; i < 4; i++) {
    cards += `
      <div class="visitor-skeleton-card">
        <div class="vs-card-left">
          <div class="sk-block vs-card-icon"></div>
          <div class="vs-card-text">
            <div class="sk-block vs-card-label"></div>
            <div class="sk-block vs-card-sub"></div>
          </div>
        </div>
        <div class="sk-block vs-card-value"></div>
      </div>`;
  }

  body.innerHTML = `
    <div class="visitors-skeleton-summary">
      <div class="sk-block vs-summary-line"></div>
      <div class="sk-block vs-summary-value"></div>
      <div class="sk-block vs-summary-sub"></div>
    </div>
    <div class="visitors-grid">${cards}</div>`;
}

function renderVisitors(data) {
  const body = document.getElementById('visitors-body-content');
  if (!body) return;

  const fmt = (n) => (typeof n === 'number' ? n.toLocaleString('en-US') : String(n || 0));

  body.innerHTML = `
    <div class="visitors-summary">
      <div class="summary-label">Total Visitors</div>
      <div class="summary-value">${fmt(data.total_visitors)}</div>
      <div class="summary-sub">All-time website visitors</div>
    </div>

    <div class="visitors-grid">
      <div class="visitor-card">
        <div class="vc-left">
          <div class="vc-icon"><i class="fas fa-sun"></i></div>
          <div>
            <div class="vc-label">Today Visitors</div>
            <div class="vc-sub">Leo</div>
          </div>
        </div>
        <div class="vc-value">${fmt(data.today_visitors)}</div>
      </div>

      <div class="visitor-card">
        <div class="vc-left">
          <div class="vc-icon"><i class="fas fa-calendar-week"></i></div>
          <div>
            <div class="vc-label">Last 7 Days</div>
            <div class="vc-sub">Siku 7 zilizopita</div>
          </div>
        </div>
        <div class="vc-value">${fmt(data.last_7_days)}</div>
      </div>

      <div class="visitor-card">
        <div class="vc-left">
          <div class="vc-icon"><i class="fas fa-calendar-alt"></i></div>
          <div>
            <div class="vc-label">Last 14 Days</div>
            <div class="vc-sub">Siku 14 zilizopita</div>
          </div>
        </div>
        <div class="vc-value">${fmt(data.last_14_days)}</div>
      </div>

      <div class="visitor-card">
        <div class="vc-left">
          <div class="vc-icon"><i class="fas fa-calendar-check"></i></div>
          <div>
            <div class="vc-label">Last 30 Days</div>
            <div class="vc-sub">Siku 30 zilizopita</div>
          </div>
        </div>
        <div class="vc-value">${fmt(data.last_30_days)}</div>
      </div>
    </div>`;
}