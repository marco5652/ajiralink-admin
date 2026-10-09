/* AjiraLink Admin — Lookup loader
   Populates any <select> from a documented lookup endpoint.
   If preserveValue is true, keeps the current selection. */

async function loadLookup(endpoint, selectEl, placeholder, preserveValue) {
  if (!selectEl) return;
  const current = preserveValue ? selectEl.value : null;
  selectEl.innerHTML = '<option value="">Loading...</option>';
  try {
    const res = await api.get(endpoint);
    const items = (res && res.data) ? res.data : [];
    let html = '';
    if (placeholder) html += `<option value="">${escapeHtml(placeholder)}</option>`;
    items.forEach(item => {
      html += `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`;
    });
    selectEl.innerHTML = html;
    if (current) {
      const match = Array.from(selectEl.options).find(o => o.value === current);
      if (match) selectEl.value = current;
    }
  } catch (err) {
    selectEl.innerHTML = '<option value="">Failed to load</option>';
    showToast('Failed to load options');
  }
}