# MLK Honor Campaign

A civic correspondence service honoring the legacy of Dr. Martin Luther King Jr. through respectful, values-driven messages to elected officials.

This platform enables individuals to send a calm, principled message to a U.S. Senator encouraging fidelity to democratic norms, moral leadership, and the rule of law.

This is **not** protest software.  
This is **not** lobbying.  
This is **not** a fundraising platform.

It is a civic expression service designed with operational integrity, transparency, and respect.

---

## Purpose

Inspired by Dr. King’s commitment to nonviolent civic engagement, the MLK Honor Campaign provides a structured way for citizens to express concern and expectation of accountability in a respectful, dignified manner.

Messages are:
- Pre-written
- Values-based
- Nonviolent
- Non-threatening
- Non-customized
- Delivered as written

The goal is **civic expression**, not persuasion, pressure, or political targeting.

---

## How It Works

1. A user selects a U.S. Senator.
2. The user selects one of several predefined message templates.
3. The user reviews the message content (read-only).
4. A fixed service fee is paid via Stripe.
5. Upon successful payment:
   - The message is queued
   - Logged immutably
   - Prepared for respectful delivery

No user-written content is accepted.

---

## What This Platform Is Not

- ❌ Not a donation platform  
- ❌ Not a PAC or advocacy organization  
- ❌ Not lobbying software  
- ❌ Not mass-messaging automation  
- ❌ Not targeted political persuasion  

This service does not solicit responses, track engagement, or attempt to influence outcomes beyond respectful communication.

---

## Transparency & Integrity

- All message templates are publicly viewable.
- Messages are delivered exactly as previewed.
- No personalization beyond recipient selection.
- No data resale.
- Minimal metadata collection (only what is operationally required).
- Stripe handles all payment processing.

---

## Technical Overview

- Node.js + Express
- Stripe Checkout + Webhooks
- Render deployment
- File-based message queue (v1)
- Static frontend served from `/public`

---

## Status

**v1 — Live**

Future enhancements may include:
- Expanded transparency tooling
- Additional oversight mechanisms
- Improved archival workflows

These are intentionally deferred to preserve launch clarity and stability.

---

## License

MIT (or replace with your preferred license)
