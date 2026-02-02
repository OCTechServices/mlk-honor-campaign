/* ============================================================
   Imports & Initialization
   ============================================================ */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const Stripe = require('stripe');

admin.initializeApp();

/* ============================================================
   Secrets (Gen-2)
   ============================================================ */
const STRIPE_SECRET_KEY = defineSecret('STRIPE_SECRET_KEY');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');

/* ============================================================
   Create Stripe Checkout Session (PUBLIC → SERVER)
   ============================================================ */
exports.createCheckoutSession = onRequest(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET_KEY],
  },
  async (req, res) => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).send('Method Not Allowed');
      }

      const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
        apiVersion: '2023-10-16',
      });

      const {
        amount = 700, // $7 default
        senator = 'unknown',
        state = 'unknown',
        templateId = 'mlk_civic_01',
      } = req.body || {};

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'MLK Honor Campaign Letter',
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          senator,
          state,
          templateId,
        },
        success_url:
          'https://mlk-honor-campaign.web.app/success.html',
        cancel_url:
          'https://mlk-honor-campaign.web.app/cancel.html',
      });

      return res.status(200).json({ url: session.url });
    } catch (err) {
      console.error('createCheckoutSession error:', err);
      return res.status(500).json({ error: 'checkout_unavailable' });
    }
  }
);

/* ============================================================
   Stripe Webhook — Authoritative Write
   ============================================================ */
exports.stripeWebhook = onRequest(
  {
    region: 'us-central1',
    secrets: [STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET],
    rawBody: true,
  },
  async (req, res) => {
    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    const stripe = new Stripe(STRIPE_SECRET_KEY.value(), {
      apiVersion: '2023-10-16',
    });

    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        STRIPE_WEBHOOK_SECRET.value()
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      if (!session.amount_total) {
        return res.json({ received: true });
      }

      const db = admin.firestore();

      // Payment (idempotent)
      await db.collection('payments').doc(session.id).set(
        {
          sessionId: session.id,
          amount: session.amount_total / 100,
          currency: session.currency,
          status: 'paid',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Message (idempotent)
      await db.collection('messages').doc(`msg_${session.id}`).set(
        {
          senator: session.metadata?.senator || 'unknown',
          state: session.metadata?.state || null,
          templateId: session.metadata?.templateId || 'mlk_civic_01',
          campaign: 'mlk_honor_campaign',
          paymentSessionId: session.id,
          status: 'queued',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    return res.json({ received: true });
  }
);

/* ============================================================
   Public Metrics — Read Only
   ============================================================ */
exports.publicMetrics = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    try {
      res.set('Cache-Control', 'public, max-age=30, s-maxage=30');

      const db = admin.firestore();

      const totalLettersAgg = await db.collection('messages').count().get();
      const pendingLettersAgg = await db
        .collection('messages')
        .where('status', 'in', ['queued', 'processing'])
        .count()
        .get();
      const sentLettersAgg = await db
        .collection('messages')
        .where('status', '==', 'sent')
        .count()
        .get();

      const paidSnap = await db
        .collection('payments')
        .where('status', '==', 'paid')
        .select('amount')
        .get();

      let raised = 0;
      paidSnap.forEach((doc) => {
        if (typeof doc.data().amount === 'number') raised += doc.data().amount;
      });

      raised = Math.round(raised * 100) / 100;

      return res.json({
        letters: {
          total: totalLettersAgg.data().count || 0,
          pending: pendingLettersAgg.data().count || 0,
          sent: sentLettersAgg.data().count || 0,
        },
        donation: {
          raised,
          cap: 300,
          paidCount: paidSnap.size,
        },
        lastUpdated: new Date().toISOString(),
        source: 'firestore',
      });
    } catch (err) {
      return res.status(500).json({ error: 'metrics_unavailable' });
    }
  }
);

/* ============================================================
   Admin Dashboard — Internal Read Only
   ============================================================ */
exports.adminDashboard = onRequest(
  { region: 'us-central1' },
  async (req, res) => {
    try {
      res.set('Cache-Control', 'no-store');
      const db = admin.firestore();

      const totalLettersAgg = await db.collection('messages').count().get();
      const pendingLettersAgg = await db
        .collection('messages')
        .where('status', '==', 'queued')
        .count()
        .get();
      const sentLettersAgg = await db
        .collection('messages')
        .where('status', '==', 'sent')
        .count()
        .get();

      const paidSnap = await db
        .collection('payments')
        .where('status', '==', 'paid')
        .select('amount')
        .get();

      let raised = 0;
      paidSnap.forEach((d) => {
        if (typeof d.data().amount === 'number') raised += d.data().amount;
      });

      raised = Math.round(raised * 100) / 100;

      const states = {};
      const templates = {};

      const msgSnap = await db
        .collection('messages')
        .select('state', 'templateId')
        .get();

      msgSnap.forEach((doc) => {
        const d = doc.data();
        if (d.state) states[d.state] = (states[d.state] || 0) + 1;
        if (d.templateId)
          templates[d.templateId] = (templates[d.templateId] || 0) + 1;
      });

      return res.json({
        letters: {
          total: totalLettersAgg.data().count || 0,
          pending: pendingLettersAgg.data().count || 0,
          sent: sentLettersAgg.data().count || 0,
        },
        donation: { raised, cap: 300 },
        states,
        templates,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      return res.status(500).json({ error: 'dashboard_unavailable' });
    }
  }
);
