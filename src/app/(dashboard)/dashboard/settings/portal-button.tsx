'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PortalButton({ label = 'プランを管理' }: { label?: string }) {
  const [loading, setLoading] = useState(false)

  const handlePortal = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url } = await res.json()
    if (url) window.location.href = url
    setLoading(false)
  }

  return (
    <Button variant="outline" className="w-full" onClick={handlePortal} loading={loading}>
      {label}
    </Button>
  )
}
