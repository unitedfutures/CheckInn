'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AirhostSyncButton({ facilityId }: { facilityId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/airhost/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ facility_id: facilityId }),
      })
      const data = await res.json()
      if (res.ok) {
        setResult(`${data.synced}件を同期しました`)
        router.refresh()
      } else {
        setResult(data.error || 'エラーが発生しました')
      }
    } catch {
      setResult('通信エラー')
    }
    setLoading(false)
    setTimeout(() => setResult(null), 4000)
  }

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" className="w-full" onClick={handleSync} loading={loading}>
        <RefreshCw size={14} className="mr-1.5" /> Airhost同期
      </Button>
      {result && (
        <p className="absolute -bottom-6 left-0 right-0 text-center text-xs text-indigo-600 whitespace-nowrap">{result}</p>
      )}
    </div>
  )
}
