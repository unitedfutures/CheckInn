'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Property {
  id: string
  name: string
}

export function ReservationForm({ properties }: { properties: Property[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    property_id: '',
    reservation_code: '',
    guest_email: '',
    checkin_date: '',
    checkout_date: '',
    num_guests: '1',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, num_guests: parseInt(form.num_guests) }),
    })

    if (res.ok) {
      setOpen(false)
      setForm({ property_id: '', reservation_code: '', guest_email: '', checkin_date: '', checkout_date: '', num_guests: '1', notes: '' })
      router.refresh()
    }
    setLoading(false)
  }

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }))

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus size={16} className="mr-1.5" />
        予約を追加
      </Button>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">予約を追加</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">施設 *</label>
                <select
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={form.property_id}
                  onChange={(e) => set('property_id', e.target.value)}
                  required
                >
                  <option value="">施設を選択</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <Input
                id="reservation_code"
                label="予約番号 *"
                placeholder="例：RES-20260501"
                value={form.reservation_code}
                onChange={(e) => set('reservation_code', e.target.value)}
                required
              />
              <Input
                id="guest_email"
                type="email"
                label="宿泊者メールアドレス（任意）"
                placeholder="guest@example.com"
                value={form.guest_email}
                onChange={(e) => set('guest_email', e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3">
                <Input
                  id="checkin_date"
                  type="date"
                  label="チェックイン *"
                  value={form.checkin_date}
                  onChange={(e) => set('checkin_date', e.target.value)}
                  required
                />
                <Input
                  id="checkout_date"
                  type="date"
                  label="チェックアウト *"
                  value={form.checkout_date}
                  onChange={(e) => set('checkout_date', e.target.value)}
                  required
                />
              </div>

              <Input
                id="num_guests"
                type="number"
                label="宿泊人数"
                min="1"
                value={form.num_guests}
                onChange={(e) => set('num_guests', e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備考</label>
                <textarea
                  className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                  value={form.notes}
                  onChange={(e) => set('notes', e.target.value)}
                />
              </div>

              {form.guest_email && (
                <p className="text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
                  ✉️ 登録後、宿泊者情報入力メールを自動送信します
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                  キャンセル
                </Button>
                <Button type="submit" className="flex-1" loading={loading}>
                  追加する
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
