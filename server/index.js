// server/index.js

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { enqueueMessage } = require('./queue/queue');

const app = express();
const PORT = process.env.PORT || 4242;

// ✅ Static root (THIS MATCHES YOUR FOLDER TREE)
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Base URL (Render or local)
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

/* =====================================================
   🔔 STRIPE WEBHOOK — MUST BE FIRST
   ===================================================== */
app.post('/webhook', express.raw({ type: '*/*' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Webhook verification failed:', err.message);
    return res.status(400).send('Webhook Error');
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    enqueueMessage({
      senator: session.metadata?.selected_senator || 'Unknown',
      templateId: session.metadata?.template_id || 'unknown',
      campaign: session.metadata?.campaign || 'mlk_honor_campaign',
      stripeSessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency || 'usd',
      status: 'paid',
      timestamp: new Date().toISOString(),
    });

    console.log('✅ Paid session recorded:', session.id);
  }

  res.json({ received: true });
});

/* =====================================================
   🧱 NORMAL APP MIDDLEWARE
   ===================================================== */
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

/* --------------------
   Health Check
-------------------- */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* --------------------
   Create Checkout Session
-------------------- */
app.post('/create-checkout-session', async (req, res) => {
  const { senator, templateId } = req.body;

  if (!senator || !templateId) {
    return res.status(400).json({ error: 'Missing senator or templateId' });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'required',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: 700,
            product_data: {
              name: 'Civic Correspondence Service — MLK Honor Campaign',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        selected_senator: senator,
        template_id: templateId,
        campaign: 'mlk_honor_campaign',
      },
      success_url: `${BASE_URL}/success.html`,
      cancel_url: `${BASE_URL}/index.html`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Stripe checkout failed' });
  }
});

/* --------------------
   Admin Dashboard JSON API
-------------------- */
app.get('/admin/api/dashboard', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'queue', 'messages.json');
    const messages = fs.existsSync(filePath)
      ? JSON.parse(fs.readFileSync(filePath, 'utf8'))
      : [];

    const letters = { total: 0, pending: 0, sent: 0 };
    const templates = {};
    const states = {};
    let raised = 0;

    for (const m of messages) {
      // Count only real paid Stripe records
      if (m.stripeSessionId && m.amount > 0) {
        letters.total++;
        letters.pending++;

        raised += m.amount;

        if (m.templateId) {
          templates[m.templateId] = (templates[m.templateId] || 0) + 1;
        }

        if (m.state) {
          states[m.state] = (states[m.state] || 0) + 1;
        }
      }
    }

    res.json({
      letters,
      templates,
      states,
      donation: {
        raised,
        cap: Number(process.env.DONATION_CAP || 300),
      },
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Dashboard failed' });
  }
});

/* --------------------
   Start Server
-------------------- */
app.listen(PORT, () => {
  console.log(`✅ MLK Honor Campaign running on port ${PORT}`);
});
