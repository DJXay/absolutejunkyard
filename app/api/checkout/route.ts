import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Use the modern API version that matches your Stripe v15 library
const stripe = new Stripe('sk_test_YOUR_KEY_HERE', {
  apiVersion: '2024-04-10', 
});

export async function POST(req: Request) {
  try {
    const { itemId, itemTitle } = await req.json();

    // Direct hardcoded URL to eliminate DNS lookups or Env var delays
    const siteUrl = 'https://absolutejunkyardnetlifycom.netlify.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Listing Fee: ${itemTitle}`,
          },
          unit_amount: 100, // $1.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      metadata: { itemId: itemId },
      success_url: `${siteUrl}/browse?success=true`,
      cancel_url: `${siteUrl}/post?canceled=true`,
    });

    if (!session.url) throw new Error("No URL from Stripe");

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('SERVER_ERROR:', err.message);
    // This will send the EXACT Stripe error back to your console
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
