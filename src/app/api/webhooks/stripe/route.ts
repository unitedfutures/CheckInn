import { stripe } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createClient()

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const status = sub.status
      const priceId = sub.items.data[0]?.price.id

      const { STRIPE_PRICE_ID_STARTER, STRIPE_PRICE_ID_PRO } = process.env
      const plan = priceId === STRIPE_PRICE_ID_PRO ? 'pro'
        : priceId === STRIPE_PRICE_ID_STARTER ? 'starter' : 'free'

      await supabase
        .from('profiles')
        .update({
          stripe_subscription_id: sub.id,
          subscription_status: status,
          plan,
        })
        .eq('stripe_customer_id', customerId)
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabase
        .from('profiles')
        .update({ subscription_status: 'canceled', plan: 'free' })
        .eq('stripe_subscription_id', sub.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
