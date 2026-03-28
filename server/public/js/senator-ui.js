/**
 * Senator UI helpers
 * Requires window.SENATORS
 */

function groupByState(senators) {
  return senators.reduce((acc, s) => {
    if (!acc[s.state]) acc[s.state] = [];
    acc[s.state].push(s.name);
    return acc;
  }, {});
}

function populateSenatorSelect(selectEl, senators) {
  // Clear existing options (except placeholder)
  selectEl.querySelectorAll('option:not([value=""])').forEach(o => o.remove());

  const grouped = groupByState(senators);
  const states = Object.keys(grouped).sort();

  states.forEach(state => {
    const names = grouped[state].sort();

    names.forEach(name => {
      const opt = document.createElement('option');
      opt.value = `${state} — ${name}`;
      opt.textContent = `${state} — ${name}`;
      selectEl.appendChild(opt);
    });
  });
}

function attachSenatorSearch(inputEl, selectEl) {
  inputEl.addEventListener('input', () => {
    const q = inputEl.value.toLowerCase();

    Array.from(selectEl.options).forEach(opt => {
      if (!opt.value) return; // keep placeholder visible
      opt.hidden = q && !opt.textContent.toLowerCase().includes(q);
    });
  });
}

window.initSenatorUI = function () {
  const select = document.getElementById('senator');
  const search = document.getElementById('senator-search');

  if (!select || !window.SENATORS) {
    console.warn('Senator UI not initialized (missing elements)');
    return;
  }

  populateSenatorSelect(select, window.SENATORS);

  if (search) {
    attachSenatorSearch(search, select);
  }
};
