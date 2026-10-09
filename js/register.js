/* AjiraLink ADMIN-REGISTER — register.html
   Endpoint: POST /auth/register (documented, restricted).
   On success: redirect to login. No auto-login (per Screen Spec). */

document.addEventListener('DOMContentLoaded', () => {
  injectToast();

  const btn = document.getElementById('registerBtn');
  btn.addEventListener('click', doRegister);
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

async function doRegister() {
  const full_name = document.getElementById('reg-name').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;
  const confirm  = document.getElementById('reg-confirm').value;
  const btn = document.getElementById('registerBtn');

  if (!full_name || !email || !password || !confirm) {
    showToast('Please fill in all fields');
    return;
  }
  if (password !== confirm) {
    showToast('Passwords do not match');
    return;
  }
  if (password.length < 8) {
    showToast('Password must be at least 8 characters');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Registering...';

  try {
    await api.post('/auth/register', {
      full_name,
      email,
      password,
      password_confirmation: confirm
    });
    showToast('Account created successfully!');
    setTimeout(() => { window.location.replace('login.html'); }, 800);
  } catch (err) {
    // Surface first validation error if present
    let msg = err.message || 'Registration failed';
    if (err.errors) {
      const firstKey = Object.keys(err.errors)[0];
      if (firstKey && err.errors[firstKey][0]) msg = err.errors[firstKey][0];
    }
    showToast(msg);
    btn.disabled = false;
    btn.textContent = 'Register';
  }
}