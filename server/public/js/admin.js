/* ============================================================
   Admin Queue — MLK Honor Campaign
   ============================================================ */

let TEMPLATES = [];
let SENATORS  = [];

function getToken() {
  return sessionStorage.getItem('mlk_admin_pw') || '';
}

// ── Pre-load static data ──────────────────────────────────────
async function loadStaticData() {
  const [tRes, sRes] = await Promise.all([
    fetch('/data/message-templates.json'),
    fetch('/data/senators.json'),
  ]);
  TEMPLATES = await tRes.json();
  SENATORS  = await sRes.json();
}

// ── Queue ─────────────────────────────────────────────────────
async function loadQueue() {
  const tbody = document.querySelector('#queue-table tbody');
  tbody.innerHTML = '<tr><td colspan="5" style="opacity:.6;">Loading…</td></tr>';

  try {
    const res = await fetch('/admin/queue', {
      headers: { 'X-Admin-Token': getToken() }
    });

    if (res.status === 401) {
      tbody.innerHTML = '<tr><td colspan="5" style="color:#e05c5c;">Session expired — please reload and re-enter your password.</td></tr>';
      return;
    }

    if (!res.ok) throw new Error('HTTP ' + res.status);

    const messages = await res.json();

    if (!messages.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="opacity:.6;">Queue is empty.</td></tr>';
      return;
    }

    tbody.innerHTML = '';
    messages.forEach(msg => {
      const tr = document.createElement('tr');
      const printedLine = msg.printedAt
        ? `<div style="font-size:10px;color:#888;margin-top:3px;">Printed ${new Date(msg.printedAt).toLocaleString()}</div>`
        : '';
      tr.innerHTML = `
        <td style="font-size:11px;opacity:.7;">${msg.id}</td>
        <td>${msg.senator}</td>
        <td class="status ${msg.status}">${msg.status}${printedLine}</td>
        <td>${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '—'}</td>
        <td class="actions">${renderButtons(msg)}</td>
      `;
      tbody.appendChild(tr);
      wireButtons(tr, msg);
    });
  } catch (err) {
    console.error(err);
    tbody.innerHTML = '<tr><td colspan="5" style="color:#e05c5c;">Failed to load queue.</td></tr>';
  }
}

// ── Buttons ───────────────────────────────────────────────────
function renderButtons(msg) {
  if (msg.status === 'archived') return '—';
  const all = [
    { action: 'processing', label: '🖨 Print & Process' },
    { action: 'sent',       label: 'Sent' },
    { action: 'failed',     label: 'Failed' },
    { action: 'archived',   label: 'Archive' },
  ];
  const buttons = all
    .filter(b => b.action !== msg.status)
    .map(b => `<button data-action="${b.action}">${b.label}</button>`)
    .join('');

  const reprint = msg.status === 'processing'
    ? `<button data-action="reprint">🖨 Reprint</button>`
    : '';

  return reprint + buttons;
}

function wireButtons(row, msg) {
  row.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', async () => {
      const status = btn.dataset.action;

      if (status === 'processing') {
        // Status update deferred — fires after print dialog closes via afterprint
        openLetterWindow(msg);
        return;
      }

      if (status === 'reprint') {
        // Reprint only — no status change
        openLetterWindow(msg, { silent: true });
        return;
      }

      await updateStatus(btn, msg.id, status, false);
    });
  });
}

// ── Status update ─────────────────────────────────────────────
async function updateStatus(btn, id, status, markPrinted) {
  if (btn) { btn.disabled = true; btn.textContent = '…'; }

  try {
    const res = await fetch('/admin/update-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': getToken()
      },
      body: JSON.stringify({ id, status, markPrinted })
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    await loadQueue();
  } catch (err) {
    console.error(err);
    if (btn) { btn.disabled = false; btn.textContent = 'Retry'; }
  }
}

// ── Called by letter window after print dialog closes ─────────
window.recordPrint = function (id) {
  updateStatus(null, id, 'processing', true);
};

// ── Letter print window ───────────────────────────────────────
function openLetterWindow(msg, opts = {}) {
  const silent = opts.silent === true;
  const template = TEMPLATES.find(t => t.id === msg.templateId);
  if (!template) {
    alert('Template not found for id: ' + msg.templateId);
    return;
  }

  const senatorName = msg.senator || 'Unknown Senator';
  const lastName    = senatorName.trim().split(' ').pop();
  const today       = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const letterHTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Letter — ${senatorName}</title>
  <style>
    @page { margin: 1in; }
    body {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 12pt;
      line-height: 1.7;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 0;
    }
    .letter  { max-width: 6.5in; margin: 0 auto; }
    .date    { margin-bottom: 28pt; }
    .address { margin-bottom: 28pt; line-height: 1.5; }
    .salutation { margin-bottom: 18pt; }
    .body    { margin-bottom: 28pt; text-align: justify; }
    .closing { margin-bottom: 6pt; }
    .signature { margin-top: 36pt; }
    .meta {
      margin-top: 48pt;
      padding-top: 12pt;
      border-top: 1px solid #ccc;
      font-size: 9pt;
      color: #555;
    }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
<div class="letter">

  <div class="date">${today}</div>

  <div class="address">
    The Honorable ${senatorName}<br>
    United States Senate<br>
    Washington, D.C. 20510
  </div>

  <div class="salutation">Dear Senator ${lastName},</div>

  <div class="body">${template.body}</div>

  <div class="closing">Respectfully,</div>
  <div class="signature">
    MLK Honor Campaign<br>
    On behalf of a concerned citizen<br><br>
    <em style="font-size:10pt;color:#555;">Sent via the MLK Honor Campaign — mlk-honor-campaign.web.app</em>
  </div>

  <div class="meta no-print">
    <strong>Internal reference</strong><br>
    Transaction ID: ${msg.id}<br>
    Template: ${template.title} (${msg.templateId})<br>
    Senator: ${senatorName}<br>
    Queued: ${msg.createdAt ? new Date(msg.createdAt).toLocaleString() : '—'}
  </div>

</div>
<script>
  // Fire after print dialog closes — success or cancel
  window.addEventListener('afterprint', function () {
    if (!${silent} && window.opener && !window.opener.closed) {
      window.opener.recordPrint('${msg.id}');
    }
    window.close();
  });
  window.print();
<\/script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Pop-up blocked. Please allow pop-ups for this site and try again.');
    return;
  }
  win.document.write(letterHTML);
  win.document.close();
}

// ── Init ──────────────────────────────────────────────────────
(async () => {
  await loadStaticData();
  await loadQueue();
})();
