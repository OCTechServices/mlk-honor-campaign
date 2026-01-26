// server/templates/templates.js

const TEMPLATES = [
  {
    id: 'mlk_justice_dignity',
    title: 'Justice, Dignity, and the Rule of Law',
    body: `
Dear {SENATOR},

I write to you in the spirit of Dr. Martin Luther King Jr.’s enduring call
for justice, dignity, and moral courage in public service.

At this moment in our history, leadership grounded in the rule of law,
respect for democratic institutions, and fidelity to truth is essential.
I urge you to act in a manner that reflects these values and honors the
responsibility entrusted to your office.

History remembers those who choose principle over convenience.

Respectfully,
A concerned constituent
`.trim()
  },

  {
    id: 'mlk_nonviolence_accountability',
    title: 'Nonviolence, Accountability, and Democratic Norms',
    body: `
Dear {SENATOR},

Dr. King taught us that nonviolence is not passive—it is a demand for
accountability grounded in love for democracy and humanity.

I respectfully ask that you uphold democratic norms, protect the integrity
of our institutions, and demonstrate leadership rooted in accountability
and ethical governance.

Your actions today shape the moral record of tomorrow.

Sincerely,
A concerned constituent
`.trim()
  }
];

// --------------------
// Public API
// --------------------
function getTemplateById(id) {
  return TEMPLATES.find(t => t.id === id);
}

function listTemplates() {
  return TEMPLATES.map(({ id, title }) => ({ id, title }));
}

module.exports = {
  getTemplateById,
  listTemplates
};
