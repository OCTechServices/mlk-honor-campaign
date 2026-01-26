# MLK Honor Campaign

A civic correspondence service honoring the legacy of Dr. Martin Luther King Jr. through respectful, values-driven messages to elected officials.

This platform enables individuals to send calm, principled messages to U.S. Senators encouraging fidelity to democratic norms, moral leadership, and the rule of law.

---

## What This Is

- A **civic expression service**
- A **message creation + delivery workflow**
- A **non-partisan, non-protest tool**
- A **Stripe-backed operational system**

Messages are queued, reviewed, and delivered respectfully.  
No response is implied or required.

---

## What This Is NOT

- ❌ Not lobbying software  
- ❌ Not a protest platform  
- ❌ Not a fundraising or donation tool  
- ❌ Not bulk advocacy automation  

Each message is intentional, immutable, and auditable.

---

## How It Works

1. User selects:
   - A U.S. Senator
   - A pre-approved message template
2. User completes Stripe checkout
3. Message is:
   - Rendered
   - Hashed (SHA-256)
   - Locked and queued
4. Admin reviews and delivers message
5. Status transitions are recorded for audit

---

## Message Integrity

Each message record includes:
- Rendered message body
- Immutable hash
- Template ID
- Senator
- Timestamp
- Full status history

Once queued, message content **cannot be altered**.

---

## Technology Stack

- Node.js + Express
- Stripe Checkout + Webhooks
- File-based queue (v1)
- Static frontend (HTML / CSS / JS)

---

## Deployment

This service is designed to run on:
- Render (recommended)
- Fly.io
- Any Node-compatible host

---

## License

MIT (operational integrity expected)
