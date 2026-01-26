async function loadMessageTemplates() {
  const select = document.getElementById('message-template');
  const previewTitle = document.getElementById('template-title');
  const previewExcerpt = document.getElementById('template-excerpt');

  try {
    const res = await fetch('/data/message-templates.json');
    const templates = await res.json();

    templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.title;
      opt.dataset.excerpt = t.excerpt;
      select.appendChild(opt);
    });

    select.addEventListener('change', () => {
      const selected = select.options[select.selectedIndex];
      previewTitle.textContent = selected.textContent || '';
      previewExcerpt.textContent = selected.dataset.excerpt || '';
    });

  } catch (err) {
    console.error('Failed to load message templates', err);
  }
}

window.loadMessageTemplates = loadMessageTemplates;
