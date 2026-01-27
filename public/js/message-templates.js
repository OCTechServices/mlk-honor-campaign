let MESSAGE_TEMPLATES = [];

async function loadMessageTemplates() {
  try {
    const res = await fetch('/data/message-templates.json');
    MESSAGE_TEMPLATES = await res.json();

    const select = document.getElementById('message-template');

    MESSAGE_TEMPLATES.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t.id;
      opt.textContent = t.title;
      select.appendChild(opt);
    });

    select.addEventListener('change', handleTemplateChange);
  } catch (err) {
    console.error('Failed to load message templates', err);
  }
}

function handleTemplateChange() {
  const templateId = document.getElementById('message-template').value;
  const template = MESSAGE_TEMPLATES.find(t => t.id === templateId);

  if (!template) return;

  document.getElementById('template-title').textContent = template.title;
  document.getElementById('template-body').textContent = template.body;
}
