import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
})

export const PLANS = {
  starter: {
    name: 'スターター',
    price: 4980,
    priceId: process.env.STRIPE_PRICE_ID_STARTER!,
    features: ['施設3件まで', '予約100件/月', 'メール送信', 'QRコード発行'],
  },
  pro: {
    name: 'プロ',
    price: 14800,
    priceId: process.env.STRIPE_PRICE_ID_PRO!,
    features: ['施設無制限', '予約無制限', 'メール送信', 'QRコード発行', '優先サポート'],
  },
}
