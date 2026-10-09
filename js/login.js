/* AjiraLink ADMIN-LOGIN — login.html */

document.addEventListener('DOMContentLoaded', () => {
  injectToast();

  // If already logged in, send them home.
  if (getToken()) {
    window.location.replace('index.html');
    return;
  }

  const btn = document.getElementById('loginBtn');
  const email = document.getElementById('login-email');
  const pwd = document.getElementById('login-password');

  btn.addEventListener('click', doLogin);
  pwd.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
  email.addEventListener('keydown', (e) => { if (e.key === 'Enter') pwd.focus(); });
});

function togglePassword(id, btn) {
  const input = document.getElementById(id);
  if (!input) return;
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) { icon.classList.remove('fa-eye'); icon.classList.add('fa-eye-slash'); }
  } else {
    input.type = 'password';
    if (icon) { icon.classList.remove('fa-eye-slash'); icon.classList.add('fa-eye'); }
  }
}

async function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const btn = document.getElementById('loginBtn');

  if (!email || !password) {
    showToast('Please enter email and password');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await api.post('/auth/login', { email, password });
    if (res && res.token) {
      setToken(res.token);
      showToast(res.message || 'Welcome back!');
      setTimeout(() => { window.location.replace('index.html'); }, 400);
    } else {
      throw new Error('Invalid response from server');
    }
  } catch (err) {
    showToast(err.message || 'Login failed');
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}