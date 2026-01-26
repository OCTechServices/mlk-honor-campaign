// server/index.js

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const express = require('express');
const path = require('path');
const fs = require('fs');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { enqueueMessage, updateStatus } = require('./queue/queue');

const app = express();
const PORT = 4242;
const PUBLIC_DIR = path.join(__dirname, '../public');

// =====================================================
// 🔔 STRIPE WEBHOOK — MUST BE FIRST
// =====================================================
app.post(
  '/webhook',
  express.raw({ type: '*/*' }),
  (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).send('Webhook signature verification failed');
    }

    console.log('🔔 Stripe event:', event.type);

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        enqueueMessage({
          senator: session.metadata.selected_senator,
          campaign: session.metadata.campaign,
          templateId: session.metadata.template_id,
          stripeSessionId: session.id,
        });

        console.log('✅ Message enqueued from webhook:', session.id);
      } catch (err) {
        console.error('❌ Queue error:', err.message);
        return res.status(500).send('Queue error');
      }
    }

    res.json({ received: true });
  }
);

// =====================================================
// 🧱 NORMAL APP MIDDLEWARE (AFTER WEBHOOK)
// =====================================================
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

// --------------------
// Health Check
// --------------------
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --------------------
// Create Checkout Session
// --------------------
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { senator, templateId } = req.body;

    if (!senator || !templateId) {
      return res.status(400).json({ error: 'Missing senator or templateId' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      billing_address_collection: 'required',

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Civic Correspondence Service — MLK Honor Campaign',
            },
            unit_amount: 700,
          },
          quantity: 1,
        },
      ],

      metadata: {
        selected_senator: senator,
        template_id: templateId,
        campaign: 'mlk_honor_campaign',
      },

      success_url:
        'http://localhost:4242/success.html?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:4242/index.html',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('❌ Stripe error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// --------------------
// Admin Queue
// --------------------
app.get('/admin/queue', (req, res) => {
  try {
    const filePath = path.join(__dirname, 'queue', 'messages.json');
    const messages = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Unable to read queue' });
  }
});

// --------------------
// Start Server
// --------------------
app.listen(PORT, () => {
  console.log(`✅ MLK Honor Campaign running at http://localhost:${PORT}`);
});
