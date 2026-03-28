# Delivery SOP — MLK Honor Campaign
**Version:** 1.0
**Status:** Active
**Last Updated:** 2026-03-20
**Owner:** Platform Operator

---

## Overview

This document defines the standard operating procedure for fulfilling queued
messages through the MLK Honor Campaign. All messages must be delivered via
USPS Certified Mail to the senator's official Washington, D.C. office.

This is a manual fulfillment workflow for v1. Automation (Lob.com or equivalent)
is planned for v2 when volume warrants it.

---

## Status Flow

```
queued → processing → sent
              ↓
           failed → archived
```

| Status       | Meaning                                                   |
|--------------|-----------------------------------------------------------|
| `queued`     | Payment confirmed. Message ready for preparation.         |
| `processing` | Letter has been printed and is being prepared for mailing.|
| `sent`       | USPS Certified Mail submitted. Tracking number recorded.  |
| `failed`     | Delivery attempt failed (e.g., returned mail).            |
| `archived`   | No further action. Record preserved for audit.            |

---

## Fulfillment Checklist (Per Message)

### Step 1 — Review the Queue
- [ ] Open `/admin.html` and log in
- [ ] Filter or scan for messages with `status: queued`
- [ ] Note the **senator name**, **state**, and **templateId** for each

### Step 2 — Pull the Message Body
- [ ] Open `server/public/data/message-templates.json`
- [ ] Find the template matching the `templateId`
- [ ] Copy the `title` and `body` fields — this is the letter content

### Step 3 — Prepare the Letter
- [ ] Print on plain white paper or campaign letterhead
- [ ] Letter format:
  ```
  [Date]

  The Honorable [Senator Full Name]
  United States Senate
  [Senate Office Building and Room Number]
  Washington, D.C. 20510

  Dear Senator [Last Name],

  [Template body — verbatim, no edits]

  Respectfully,
  MLK Honor Campaign
  On behalf of a concerned citizen
  ```
- [ ] Do **not** modify the message body in any way
- [ ] Do **not** include the sender's personal information

### Step 4 — Address the Envelope
- [ ] Recipient: The Honorable [Senator Full Name], U.S. Senate, Washington, D.C. 20510
- [ ] Return address: Use campaign P.O. box or designated return address
- [ ] Use a standard #10 business envelope

### Step 5 — Send via USPS Certified Mail
- [ ] Go to your nearest USPS Post Office or use Click-N-Ship
- [ ] Select **Certified Mail** (Form PS 3800)
- [ ] Request **Return Receipt** (optional but recommended — Form PS 3811 green card)
- [ ] Pay postage — typically $5.00–$7.00 with Certified Mail fee
- [ ] **Keep the tracking number (Article Number from the green label)**

### Step 6 — Update the Record
- [ ] Open `/admin.html`
- [ ] Locate the message by ID
- [ ] Click **Sent** to update status to `sent`
- [ ] Record the USPS tracking number in your local tracking log (see below)

### Step 7 — Log the Tracking Number
Maintain a local tracking log (spreadsheet or notes file) with:

| Message ID | Senator | Sent Date | USPS Tracking # | Status |
|------------|---------|-----------|-----------------|--------|
| msg_xxx    | ...     | ...       | 9400...         | Sent   |

This log is your audit trail. It is not stored in Firestore.

---

## Handling Failed Deliveries

If a letter is returned undeliverable:
1. Note the reason (wrong address, refused, unclaimed)
2. Make **one additional attempt** using the updated/correct address
3. If the second attempt also fails, update status to `failed` in admin queue
4. Update status to `archived` — no further action required
5. The service fee is non-refundable per the FAQ

---

## Senator Office Addresses

All U.S. Senate offices receive mail at:

```
The Honorable [Full Name]
United States Senate
Washington, D.C. 20510
```

For senators with specific suite numbers, consult:
- senate.gov/senators/contact
- Or the senators.json data file in `server/public/data/`

> **Note:** During heightened security periods, the Senate may route mail
> through an off-site processing facility which can add 1–2 weeks to delivery.
> This is outside our control. Mention this to users requesting tracking info.

---

## Frequency & Batching

- Check the admin queue **every 2–3 business days**
- Batch process all `queued` messages in a single USPS run when possible
- Do not let the queue exceed 10 unprocessed messages without action

---

## Escalation

| Situation | Action |
|-----------|--------|
| Stripe payment confirmed but no Firestore record | Check Firebase Functions logs; re-trigger webhook if needed |
| User requests refund | Non-refundable per policy; respond via Stripe receipt email within 48 hours |
| User requests tracking | Reply via Stripe receipt email with USPS tracking number from log |
| Letter returned twice | Archive in admin queue; no refund issued |
| Volume exceeds 20 letters/week | Evaluate Lob.com API integration for automation |

---

## v2 Automation Path (When Ready)

When volume justifies it, replace manual fulfillment with:

- **[Lob.com](https://lob.com)** — Certified Mail API that handles printing, addressing, and USPS submission programmatically
- Trigger: Stripe webhook → Cloud Function → Lob API call
- Lob returns a tracking URL stored directly on the Firestore message document
- Status auto-updates to `sent` upon Lob confirmation
- Estimated cost: ~$3–$5/letter via Lob (vs. ~$5–$7 manual)

This path keeps the Cloud Function architecture intact — it's an additive change,
not a rewrite.

---

*Internal document. Not for public distribution.*
