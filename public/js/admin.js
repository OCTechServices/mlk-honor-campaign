async function loadQueue() {
  const res = await fetch('/admin/queue');
  const messages = await res.json();

  const tbody = document.querySelector('#queue-table tbody');
  tbody.innerHTML = '';

  messages.forEach(msg => {
    const tr = document.createElement('tr');

    tr.innerHTML = `
      <td>${msg.id}</td>
      <td>${msg.senator}</td>
      <td class="status ${msg.status}">${msg.status}</td>
      <td>${new Date(msg.created_at).toLocaleString()}</td>
      <td class="actions">
        ${renderButtons(msg)}
      </td>
    `;

    tbody.appendChild(tr);

    wireButtons(tr, msg.id);
  });
}

function renderButtons(msg) {
  if (msg.status === 'archived') return '';

  return `
    <button data-action="approved">Approve</button>
    <button data-action="sent">Sent</button>
    <button data-action="failed">Fail</button>
    <button data-action="archived">Archive</button>
  `;
}

function wireButtons(row, id) {
  const buttons = row.querySelectorAll('button');

  buttons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.action;

      await fetch('/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });

      await loadQueue();
    });
  });
}

// Initial load
loadQueue();
