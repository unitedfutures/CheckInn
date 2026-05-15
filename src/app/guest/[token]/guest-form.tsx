'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckCircle } from 'lucide-react'

export function GuestForm({ token, defaultEmail }: { token: string; defaultEmail: string }) {
  const [form, setForm] = useState({
    guest_name: '',
    guest_email: defaultEmail,
    guest_phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch(`/api/guest/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || 'エラーが発生しました')
      setLoading(false)
      return
    }

    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-gray-900 mb-2">ありがとうございます</h3>
        <p className="text-gray-500 text-sm">
          宿泊者情報を受け付けました。<br />
          チェックイン当日は玄関前のQRコードをスキャンしてください。
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="font-semibold text-gray-900 mb-4">宿泊者情報</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="guest_name"
          label="お名前 *"
          placeholder="山田 太郎"
          value={form.guest_name}
          onChange={(e) => set('guest_name', e.target.value)}
          required
        />
        <Input
          id="guest_email"
          type="email"
          label="メールアドレス *"
          placeholder="example@email.com"
          value={form.guest_email}
          onChange={(e) => set('guest_email', e.target.value)}
          required
        />
        <Input
          id="guest_phone"
          type="tel"
          label="電話番号 *"
          placeholder="090-0000-0000"
          value={form.guest_phone}
          onChange={(e) => set('guest_phone', e.target.value)}
          required
        />

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          送信する
        </Button>
      </form>
    </div>
  )
}
