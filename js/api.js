/* AjiraLink Admin — API Client
   Same contract as public. Only documented endpoints. */

const API_BASE = 'https://friendly-bassoon-6965w77w4rxw3x64q-8000.app.github.dev/api/v1';

function getToken() { return localStorage.getItem('ajiralink_token'); }
function setToken(t) { localStorage.setItem('ajiralink_token', t); }
function clearToken() { localStorage.removeItem('ajiralink_token'); }

async function request(method, path, body) {
  const headers = { 'Accept': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  let data = null;
  try { data = await res.json(); } catch (e) { data = null; }

  if (!res.ok) {
    const msg = (data && data.message) ? data.message : ('Request failed (' + res.status + ')');
    const err = new Error(msg);
    err.status = res.status;
    err.errors = data && data.errors ? data.errors : null;
    throw err;
  }
  return data;
}

const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b),
  put: (p, b) => request('PUT', p, b),
  del: (p) => request('DELETE', p)
};

function buildQuery(params) {
  const parts = [];
  Object.keys(params).forEach(k => {
    const v = params[k];
    if (v === null || v === undefined || v === '' || v === 'All') return;
    parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
  });
  return parts.length ? ('?' + parts.join('&')) : '';
}