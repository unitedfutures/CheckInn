'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ResendEmailButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    await fetch(`/api/bookings/${bookingId}/resend`, { method: 'POST' })
    setLoading(false)
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleResend} loading={loading}
      className={sent ? 'text-green-600' : 'text-gray-500'}>
      <Send size={13} className="mr-1" />
      {sent ? '送信済み' : '再送'}
    </Button>
  )
}
