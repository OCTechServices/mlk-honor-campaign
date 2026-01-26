async function loadQueue() {
  const tbody = document.getElementById('queue-body');

  try {
    const res = await fetch('/admin/queue');
    const messages = await res.json();

    if (!messages.length) {
      tbody.innerHTML =
        '<tr><td colspan="5">Queue is empty</td></tr>';
      return;
    }

    tbody.innerHTML = '';

    messages
      .slice()
      .reverse()
      .forEach(msg => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${msg.id}</td>
          <td>${msg.senator}</td>
          <td>${msg.status}</td>
          <td>${new Date(msg.created_at).toLocaleString()}</td>
          <td style="font-size:12px;">${msg.stripe_session_id}</td>
        `;
        tbody.appendChild(tr);
      });
  } catch (err) {
    console.error(err);
    tbody.innerHTML =
      '<tr><td colspan="5">Failed to load queue</td></tr>';
  }
}

loadQueue();
