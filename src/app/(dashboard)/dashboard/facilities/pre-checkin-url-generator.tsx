'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Link2, Copy, CheckCircle, ChevronDown, ChevronUp, Mail, Plus } from 'lucide-react'

interface Props {
  facilityId: string
  appUrl: string
}

export function PreCheckinUrlGenerator({ facilityId, appUrl }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ url: string; emailSent: boolean } | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: '',
    checkin_date: today,
    checkout_date: '',
    num_guests: 1,
  })

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const res = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facility_id: facilityId, ...form }),
    })
    const data = await res.json()
    setLoading(false)
    if (!res.ok) { setError(data.error || 'エラーが発生しました'); return }
    setResult({
      url: `${appUrl}/pre-checkin/${data.pre_checkin_token}`,
      emailSent: !!form.guest_email,
    })
    router.refresh()
  }

  const handleCopy = async () => {
    if (!result) return
    await navigator.clipboard.writeText(result.url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const reset = () => {
    setResult(null)
    setForm({ guest_name: '', guest_email: '', checkin_date: today, checkout_date: '', num_guests: 1 })
    setError('')
  }

  // --- 発行済み表示 ---
  if (result) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <CheckCircle size={15} className="text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-700">事前登録URLを発行しました</p>
        </div>
        {result.emailSent && (
          <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-100 rounded-lg px-3 py-1.5">
            <Mail size={12} />
            ゲストのメールアドレスに自動送信しました
          </div>
        )}
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-white border border-green-200 rounded-lg px-3 py-2 truncate text-gray-600 font-mono">
            {result.url}
          </code>
          <Button size="sm" variant={copied ? 'primary' : 'outline'} onClick={handleCopy} className="shrink-0 gap-1.5">
            {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
            {copied ? 'コピー済み' : 'コピー'}
          </Button>
        </div>
        <button onClick={reset} className="text-xs text-green-600 hover:underline">
          + 別の予約を作成する
        </button>
      </div>
    )
  }

  // --- 折りたたみフォーム ---
  return (
    <div className="border border-indigo-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-indigo-50 hover:bg-indigo-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <Plus size={14} className="text-indigo-600" />
          <span className="text-sm font-semibold text-indigo-700">事前登録URLを発行する</span>
        </div>
        {open
          ? <ChevronUp size={14} className="text-indigo-400" />
          : <ChevronDown size={14} className="text-indigo-400" />}
      </button>

      {open && (
        <div className="p-4 space-y-3 bg-white">
          <p className="text-xs text-gray-400">
            ゲスト情報を入力してURLを発行します。メールアドレスを入力すると自動送信します（任意）。
          </p>

          <div className="grid grid-cols-2 gap-2">
            <Input
              id="gname" label="ゲスト名（任意）" placeholder="山田 太郎"
              value={form.guest_name} onChange={e => set('guest_name', e.target.value)}
            />
            <Input
              id="gemail" type="email" label="メールアドレス（任意）" placeholder="guest@example.com"
              value={form.guest_email} onChange={e => set('guest_email', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              id="cin" type="date" label="チェックイン日 *"
              value={form.checkin_date} onChange={e => set('checkin_date', e.target.value)} required
            />
            <Input
              id="cout" type="date" label="チェックアウト日 *"
              value={form.checkout_date} onChange={e => set('checkout_date', e.target.value)} required
            />
          </div>
          <div className="w-1/2 pr-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">宿泊人数</label>
            <select
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={form.num_guests}
              onChange={e => set('num_guests', parseInt(e.target.value))}
            >
              {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}名</option>)}
            </select>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <Button
            className="w-full" loading={loading}
            disabled={!form.checkin_date || !form.checkout_date}
            onClick={handleSubmit}
          >
            <Link2 size={14} className="mr-1.5" />
            URLを発行{form.guest_email ? ' してメール送信' : 'する'}
          </Button>
        </div>
      )}
    </div>
  )
}
