# mlk-honor-campaign
# Tier 1 — Enterprise Grade | OCTech Services
# Last Updated: 2026-03-28 | Version: 3.2

---

## 1. Project Purpose

MLK Honor Campaign is a civic correspondence platform that enables citizens to send respectful, values-driven messages to U.S. Senators — honoring the legacy of Dr. Martin Luther King Jr. through principled civic engagement. Citizens select a senator, choose a pre-written message template, and pay a fixed service fee via Stripe. Messages are queued, logged immutably, and delivered via USPS Certified Mail.

This is **not** protest software, lobbying, or fundraising. It is a structured civic expression service built with operational integrity, transparency, and respect for democratic norms.

**Tier:** 1 — Enterprise Grade (reclassified from T2)
**Type:** Civic correspondence platform — payments, admin, queue management
**Stack:** Firebase Cloud Functions + Firebase Hosting + Firestore + Stripe
**Commercial Intent:** Active — Stripe-powered service fees
**Firebase Project:** `mlk-honor-campaign`
**Deployment:** Firebase Hosting (frontend) + Firebase Cloud Functions (backend)
**Git:** Initialized ✅
**Status:** Active

---

## 2. Architecture Overview

**Frontend:** Static HTML/CSS/JS — `server/public/` directory
- `index.html` — landing, senator selection, message selection, checkout
- `admin.html` — admin queue management (authenticated)
- `admin/dashboard.html` — admin stats dashboard (authenticated)
- `faq.html`, `how-it-works.html`, `progress.html`, `spread.html`, `success.html`
- `js/` — senator-ui, admin, message-templates, progress, senators
- `data/` — `senators.json`, `message-templates.json` (all public content)
- `assets/qr/` — QR code for campaign

**Backend:** Firebase Cloud Functions — `server/index.js`
**Cloud Functions:**
- `createCheckoutSession` → Stripe checkout creation (public)
- `stripeWebhook` → authoritative payment + message write (webhook)
- `checkoutSession` → success page session lookup (public)
- `publicMetrics` → public campaign metrics (public)
- `adminDashboard` → admin stats (authenticated)
- `adminQueue` → message queue read (authenticated)
- `adminUpdateStatus` → queue status mutation (authenticated)

**Database:** Firestore — `firestore.rules` at root
**Auth:** SHA-256 token hash verified server-side on every admin request
**Payments:** Stripe Checkout + Webhook (signature verified)
**Queue:** Firestore `messages` collection — append-only, immutable log
**Templates:** `server/public/data/message-templates.json`
**Hosting:** Firebase Hosting (`server/public/`) — Render is not in use

---

## 3. Working Rules

- Message templates are the core product — never modify without legal and editorial review
- No user-written content is accepted — templates are fixed and pre-approved
- Admin dashboard access must be strictly authenticated — never publicly accessible
- Message queue is an immutable log — never delete queue entries
- All Stripe events must be verified via webhook signature before processing
- Senator data (`senators.json`) must be kept current and accurate
- Small, reviewable changes only — especially on payment and queue logic
- Content changes (templates, senator list) require review — not solo edits
- server/index.js and admin.js reviewed 2026-03-28 — confirmed clean, no hardcoded secrets

---

## 4. Commands

```bash
# Install server dependencies
cd server && npm install

# Start local server
cd server && npm start
# or
cd server && node index.js

# Deploy to Firebase Hosting
firebase deploy --only hosting

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy Firestore rules
firebase deploy --only firestore:rules

# View Firebase logs
firebase functions:log
```

---

## 5. Code Standards

- Message templates in `server/public/data/message-templates.json` — single source of truth
- Senator data in `server/public/data/senators.json` — keep current and verified
- All Stripe webhook events must use `stripe.webhooks.constructEvent()` for verification
- Admin routes must require authentication on every request — server-side only
- Queue entries are append-only — no delete or modify operations on queue
- Explicit error handling on all payment, queue, and admin API paths
- Never log PII (email, name, payment info) to console or files

---

## 6. Security / Data Handling

- Stripe keys stored in Firebase Secret Manager via `defineSecret()` — confirmed ✅
- Admin dashboard routes verify SHA-256 token hash server-side on every request — confirmed ✅
- server/index.js reviewed 2026-03-28 — no hardcoded secrets — confirmed ✅
- Firestore rules lock payments and messages to no public read/write — confirmed ✅ (2026-03-28)
- Message queue is an immutable audit log — preserve integrity at all times
- No citizen personal data resale — as stated in platform transparency policy
- Minimal metadata collection — only what is operationally required
- `.gitignore` covers `.env` files — verified ✅

---

## 7. Definition of Done

- [ ] Payment flow tested end-to-end in Stripe test mode
- [ ] Webhook signature verification confirmed
- [ ] Admin dashboard access requires authentication
- [ ] Message queued and logged correctly after payment
- [ ] Senator list is accurate and current
- [ ] No secrets hardcoded in server/index.js or admin.js
- [ ] Change is small and reviewable

---

## 8. Tooling Guidance

- **Playwright:** ✅ Approved — multi-page checkout and admin flow requires end-to-end validation
- **Stripe CLI:** Use `stripe listen` for local webhook testing
- **Skills:** qa-validation, pm-summary
- **Agents:** reviewer, pm-analyst
- **Hooks:** pre-tool-use (block queue mutations, hardcoded secret patterns), session-end

---

## 9. Voice & Tone — Non-Negotiable

The platform exists to honor a legacy and give citizens a principled way to engage their government. That purpose must be felt in every word, every design choice, and every interaction.

### The anchor
This is a human platform. Built by people who care, for people who care. It is not a SaaS product. It is not a growth tool. It is a civic expression service — and it must read and feel like one.

### Writing principles
- **Direct and human** — Write the way a principled person speaks. Not marketing copy. Not legal boilerplate. Not startup enthusiasm.
- **Dignity over cleverness** — No wordplay, no slogans, no conversion tactics. Every word should hold up under scrutiny.
- **Civic language** — Use the vocabulary of civic life: senator, letter, citizen, deliver, accountability, legacy, principle. Avoid: user, submit, product, tier, unlock, get started.
- **Brevity with weight** — Short sentences. No padding. Every sentence should earn its place.

### Design principles
- **Warmth over polish** — The platform should feel handmade with care, not manufactured at scale.
- **Context before action** — Users should understand what they are doing and why before they are asked to pay. The hero, the quote, the preview — all of this is context.
- **The quote is not decoration** — MLK's words set the moral frame for the entire interaction. Treat them with that weight.
- **No dark patterns** — No urgency manipulation, no inflated social proof, no hidden costs. Transparency is part of the mission.

### What to avoid
- Corporate language (leverage, seamless, powerful, robust, streamline)
- Conversion-optimized copy (Act now, Limited time, Join thousands)
- Passive voice that dilutes responsibility
- Any language that makes the $7 feel like a trick or a barrier

### Applies to
UI copy, message templates, admin dashboard labels, error messages, FAQ language, email receipts, and any future content. When in doubt, read it aloud. If it sounds like an ad, rewrite it.

---

## 10. Firestore Schema

All reads and writes to Firestore go exclusively through Cloud Functions. Direct client SDK access is denied by Firestore rules.

### Collection: `payments`
| Field | Type | Notes |
|---|---|---|
| `sessionId` | string | Stripe checkout session ID (also the document ID) |
| `amount` | number | In dollars (e.g. `7.00`) |
| `currency` | string | Always `usd` |
| `status` | string | Always `paid` (set on webhook confirmation) |
| `createdAt` | timestamp | Server timestamp — set on write |

**Document ID:** Stripe session ID (`cs_xxx...`)

### Collection: `messages`
| Field | Type | Notes |
|---|---|---|
| `senator` | string | Full name from senator selection |
| `state` | string \| null | State abbreviation |
| `templateId` | string | e.g. `mlk_civic_01` |
| `campaign` | string | Always `mlk_honor_campaign` |
| `paymentSessionId` | string | Links to `payments` document |
| `status` | string | `queued` → `processing` → `sent` \| `failed` \| `archived` |
| `createdAt` | timestamp | Server timestamp |
| `updatedAt` | timestamp \| null | Set on status change |
| `printedAt` | timestamp \| null | Set when admin clicks Print & Process |

**Document ID:** `msg_{stripeSessionId}`

---

## 11. Deployment Architecture (Confirmed 2026-03-28)

- **Firebase Hosting** — serves `server/public/` (all frontend HTML/JS/CSS/data)
- **Firebase Cloud Functions** — serves all backend logic (`server/index.js`)
- **Render / render.yaml** — STALE. Render is not in use. `render.yaml` is a legacy artifact from a prior Express-based architecture. Do not deploy to Render.

---

## 12. Open Items / Next Steps

- [x] Review server/index.js for any hardcoded Stripe or Firebase keys — ✅ Clean
- [x] Review admin.js for hardcoded config — ✅ Clean (token via sessionStorage only)
- [x] Document Firestore collections and schema — ✅ See Section 10
- [x] Confirm admin authentication implementation — ✅ SHA-256 hash verified server-side on every request
- [x] Confirm Render deployment configuration is current — ✅ Render is not in use; Firebase only
- [x] Fix price manipulation vulnerability (amount hardcoded server-side) — ✅ Done 2026-03-28
- [x] Lock Firestore rules (payments + messages public read removed) — ✅ Done 2026-03-28
- [x] Remove dead unauthenticated admin-queue.js — ✅ Done 2026-03-28
- [ ] Evaluate moving message queue to Firestore v2 (already on Firestore — evaluate tracking number field)
- [ ] Add USPS tracking number field to messages schema when volume warrants Lob.com integration
