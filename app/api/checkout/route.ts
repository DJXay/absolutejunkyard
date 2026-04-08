import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { itemId, itemTitle, mode } = await req.json();

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
      // The metadata is the "Breadcrumb" that tells our webhook which item was paid for
      metadata: {
        itemId: itemId,
        type: 'seller_listing_fee',
      },
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/browse?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/post?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error('Stripe Session Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
