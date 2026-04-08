import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Using your hardcoded key here temporarily as an 'Admin Bypass'
const stripe = new Stripe('STRIPE_SECRET_KEY=sk_test_51TDbggDaPSp14Wyj1ADwpuSUSRuBLfyXNcZ5xqMMBpqjjqMgk8ndV9bTOk3rITLZ6ZypBAWznDyOBllCaVKrF6FD00MKLJvqww
', {
  apiVersion: '2023-10-16' as any,
});

export async function POST(req: Request) {
  try {
    const { itemId, itemTitle } = await req.json();

    // The 'Safety Net': Use your Netlify URL directly if the variable is missing
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://absolutejunkyardnetlifycom.netlify.app';

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
      // Using the Safety Net URL for the return paths
      success_url: `${baseUrl}/browse?success=true`,
      cancel_url: `${baseUrl}/post?canceled=true`,
    });

    // Check if Stripe actually gave us a URL
    if (!session.url) {
      throw new Error("Stripe failed to return a checkout URL");
    }

    return NextResponse.json({ url: session.url });

  } catch (err: any) {
    console.error('Stripe Session Error:', err);
    // This sends the actual Stripe error back to your browser console (F12)
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
