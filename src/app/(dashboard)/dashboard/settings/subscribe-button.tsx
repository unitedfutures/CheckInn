'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function SubscribeButton({ priceId, planName }: { priceId: string; planName: string }) {
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <Button className="w-full" onClick={handleSubscribe} loading={loading}>
      {planName}に申し込む
    </Button>
  )
}
