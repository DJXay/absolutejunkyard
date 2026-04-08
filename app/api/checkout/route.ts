import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(STRIPE_SECRET_KEY=sk_test_51TDbggDaPSp14Wyj1ADwpuSUSRuBLfyXNcZ5xqMMBpqjjqMgk8ndV9bTOk3rITLZ6ZypBAWznDyOBllCaVKrF6FD00MKLJvqww
, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { itemId, itemTitle } = await req.json();

    // Create a Stripe Checkout Session for the $1.00 Listing Fee
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Listing Fee: ${itemTitle}`,
              description: 'AbsoluteJunkyard.com Seller Listing Fee',
            },
            unit_amount: 100, // $1.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        itemId: itemId,
        type: 'seller_listing_fee',
      },
      // CHANGED: Using SITE_URL to match your Netlify environment
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/browse?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/post?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Session Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
