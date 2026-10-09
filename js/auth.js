/* AjiraLink Admin — Auth Guard
   - requireAdmin(): redirects to login if no token present.
   - loadCurrentAdmin(): calls /auth/me and returns the user, else null.
   The backend is the authoritative authorizer — this only protects the
   UI shell. If the token is invalid, /auth/me returns 401 and we clear
   and redirect. */

function requireAdmin() {
  const token = getToken();
  if (!token) {
    window.location.replace('login.html');
    return false;
  }
  return true;
}

async function loadCurrentAdmin() {
  try {
    const res = await api.get('/auth/me');
    return res && res.user ? res.user : null;
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      clearToken();
      window.location.replace('login.html');
      return null;
    }
    // Network failure: don't redirect, but don't crash
    return null;
  }
}

async function doLogout() {
  try {
    await api.post('/auth/logout');
  } catch (e) { /* ignore — token may already be invalid */ }
  clearToken();
  window.location.replace('login.html');
}