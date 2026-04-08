import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// HARDCODE the key here to save a 'lookup' step on a slow connection
const stripe = new Stripe('sk_test_51Q...', { 
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { itemId, itemTitle } = await req.json();

    // Use a hardcoded string for the URL instead of looking up environment variables
    // This removes any chance of the server failing to read 'process.env'
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

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('Stripe Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
