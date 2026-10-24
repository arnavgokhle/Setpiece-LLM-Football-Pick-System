// ============================================================
// SETPIECE — Stripe Client
// Currently MOCKED. To activate:
// 1. npm install stripe @stripe/stripe-js
// 2. Set STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
//    STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_ID_MONTHLY in .env.local
// 3. Uncomment the real implementation below and remove the mock
// ============================================================

export const STRIPE_PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_MONTHLY || "price_mock";

// Mock checkout session creator
export async function createCheckoutSession(priceId: string, userId: string) {
  console.log("[MOCK] Creating checkout session for price:", priceId, "user:", userId);
  // In production, this would return a Stripe checkout URL
  return { url: "/pricing?mock=checkout_created", sessionId: "mock_session_id" };
}

/* ── REAL IMPLEMENTATION (uncomment when ready) ────────────
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function createCheckoutSession(priceId: string, userId: string) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscription=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?subscription=cancelled`,
    metadata: { userId },
  });
  return { url: session.url, sessionId: session.id };
}
*/
