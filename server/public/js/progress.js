(function () {
  const $ = (id) => document.getElementById(id);

  function money(n) {
    if (typeof n !== 'number') return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(n);
  }

  function dateFmt(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString();
  }

  async function load() {
    try {
      const res = await fetch('/metrics', { cache: 'no-store' });
      if (!res.ok) throw new Error('Metrics unavailable');

      const data = await res.json();

      $('letters-total').textContent = data.letters?.total ?? '—';
      $('letters-pending').textContent = data.letters?.pending ?? '—';
      $('letters-sent').textContent = data.letters?.sent ?? '—';

      const raised = data.donation?.raised;
      const cap    = data.donation?.cap ?? 300;
      $('donation-raised').textContent = money(raised);
      $('donation-cap').textContent    = money(cap);

      if (typeof raised === 'number') {
        const pct = Math.min((raised / cap) * 100, 100).toFixed(1);
        $('donation-bar').style.width = pct + '%';
      }

      $('last-updated').textContent = dateFmt(data.lastUpdated);

      // State participation map
      if (data.states && Object.keys(data.states).length > 0) {
        const cells = document.querySelectorAll('.state-cell');
        cells.forEach(cell => cell.classList.remove('participated'));

        Object.keys(data.states).forEach(abbr => {
          const cell = document.querySelector(`.state-cell[data-state="${abbr}"]`);
          if (cell) cell.classList.add('participated');
        });

        const count = Object.keys(data.states).length;
        $('state-count').textContent = `${count} state${count !== 1 ? 's' : ''}`;
        $('state-map-card').style.display = '';
      }
    } catch (err) {
      console.error(err);
      $('status-pill').textContent = 'Unavailable';
    }
  }

  load();
  setInterval(load, 60000);
})();
