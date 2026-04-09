import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// 1. Ensure this matches your package.json version exactly
const stripe = new Stripe('sk_test_YOUR_KEY_HERE', {
  apiVersion: '2024-04-10', 
});

export async function POST(req: Request) {
  try {
    // 2. We are hardcoding these for ONE test to bypass connection blips
    const itemTitle = "Test Item";
    const siteUrl = 'https://absolutejunkyardnetlifycom.netlify.app';

    console.log("Initiating Stripe Session...");

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: `Listing Fee: ${itemTitle}` },
          unit_amount: 100, // $1.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${siteUrl}/browse?success=true`,
      cancel_url: `${siteUrl}/post?canceled=true`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a URL" }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('STRIPE_DIAGNOSTIC:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
