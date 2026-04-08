import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16' as any,
});

// We use the Service Role Key here because the Webhook needs "God Mode" to update status
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Handle the successful payment
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const itemId = session.metadata?.itemId;

    if (itemId) {
      console.log(`Payment confirmed for item: ${itemId}. Flipping status to available.`);
      
      const { error } = await supabase
        .from('items')
        .update({ status: 'available' }) // The item is now visible to the community!
        .eq('id', itemId);

      if (error) console.error('Database Update Error:', error);
    }
  }

  return NextResponse.json({ received: true });
}
