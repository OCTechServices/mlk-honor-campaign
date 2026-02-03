# Firestore Data Schema — MLK Honor Campaign (v1.0.0)

Status: LOCKED  
Last Updated: 2026-02-02

---

## Collections

/payments
/messages

---

## Collection: payments

Authoritative Source: Stripe Webhook  
Write Access: Cloud Functions only

Document ID:
{stripe_session_id}

Fields:
- sessionId (string)
- amount (number, USD)
- currency (string)
- status (string: paid)
- createdAt (timestamp)

---

## Collection: messages

Authoritative Source: Stripe Webhook  
Write Access: Cloud Functions only

Document ID:
msg_{stripe_session_id}

Fields:
- senator (string)
- state (string | null)
- templateId (string)
- campaign (string)
- paymentSessionId (string)
- status (string: queued | processing | sent)
- createdAt (timestamp)

---

## Notes

- No PII stored
- No client-side writes
- Public read-only transparency
- Backfill intentionally not supported

---

Version:
v1.0.0
