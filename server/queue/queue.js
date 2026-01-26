// server/queue/queue.js

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getTemplateById } = require('../templates/templates');

const QUEUE_FILE = path.join(__dirname, 'messages.json');

// --------------------
// Helpers
// --------------------
function ensureQueueFile() {
  if (!fs.existsSync(QUEUE_FILE)) {
    fs.writeFileSync(QUEUE_FILE, JSON.stringify([], null, 2));
  }
}

function loadQueue() {
  ensureQueueFile();
  return JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
}

function saveQueue(queue) {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
}

function generateMessageId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `msg_${date}_${rand}`;
}

function sha256(input) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

// --------------------
// Workflow rules
// --------------------
const STATUSES = ['queued', 'approved', 'sent', 'failed', 'archived'];

const TRANSITIONS = {
  queued: ['approved', 'archived'],
  approved: ['sent', 'failed', 'archived'],
  failed: ['approved', 'archived'],
  sent: ['archived'],
  archived: []
};

// --------------------
// Core logic
// --------------------
function renderMessage(templateBody, senatorLabel) {
  const senatorName = senatorLabel.includes('—')
    ? senatorLabel.split('—').pop().trim()
    : senatorLabel;

  return templateBody
    .replaceAll('{SENATOR}', senatorLabel)
    .replaceAll('{SENATOR_NAME}', senatorName);
}

function enqueueMessage({ senator, campaign, stripeSessionId, templateId }) {
  const queue = loadQueue();

  if (!templateId) {
    throw new Error('Missing templateId during enqueue');
  }

  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Invalid message template id: ${templateId}`);
  }

  const rendered = renderMessage(template.body, senator);
  const hash = sha256(`${campaign}||${senator}||${templateId}||${rendered}`);
  const now = new Date().toISOString();

  const record = {
    id: generateMessageId(),
    campaign: campaign || 'mlk_honor_campaign',
    senator,

    // Immutable snapshot
    message_template_id: templateId,
    message_title: template.title,
    message_body_rendered: rendered,
    message_hash_sha256: hash,
    locked_at: now,

    // Workflow
    status: 'queued',
    status_history: [{ status: 'queued', at: now }],

    // Stripe
    stripe_session_id: stripeSessionId,

    created_at: now,
    updated_at: now
  };

  queue.push(record);
  saveQueue(queue);

  return record;
}

function updateStatus(id, newStatus) {
  if (!STATUSES.includes(newStatus)) {
    throw new Error('Invalid status');
  }

  const messages = loadQueue();
  const msg = messages.find(m => m.id === id);
  if (!msg) {
    throw new Error('Message not found');
  }

  const allowed = TRANSITIONS[msg.status] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid transition: ${msg.status} → ${newStatus}`);
  }

  const now = new Date().toISOString();
  msg.status = newStatus;
  msg.updated_at = now;
  msg.status_history.push({ status: newStatus, at: now });

  saveQueue(messages);
  return msg;
}

// --------------------
// Exports (FINAL)
// --------------------
module.exports = {
  enqueueMessage,
  updateStatus,
  STATUSES
};
