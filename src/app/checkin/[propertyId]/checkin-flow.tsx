'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MapPin, KeyRound, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Property {
  id: string
  name: string
  address: string
}

interface ReservationResult {
  guest_name: string
  checkin_date: string
  checkout_date: string
  num_guests: number
  pin_code: string
}

type Step = 'input' | 'confirmed' | 'error'

export function CheckinFlow({ property }: { property: Property }) {
  const [step, setStep] = useState<Step>('input')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [reservation, setReservation] = useState<ReservationResult | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCheckin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const res = await fetch(`/api/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id: property.id, guest_name: name }),
    })

    const data = await res.json()

    if (!res.ok) {
      setErrorMsg(data.error || 'チェックインに失敗しました')
      setStep('error')
      setLoading(false)
      return
    }

    setReservation(data)
    setStep('confirmed')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 to-indigo-700 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-widest">YOKOSO</h1>
          <p className="text-indigo-200 text-sm mt-1">セルフチェックイン</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
          <MapPin size={18} className="text-indigo-200 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-white">{property.name}</p>
            {property.address && <p className="text-indigo-200 text-sm mt-0.5">{property.address}</p>}
          </div>
        </div>

        {step === 'input' && (
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">チェックイン</h2>
            <p className="text-gray-500 text-sm mb-5">予約時のお名前を入力してください</p>

            <form onSubmit={handleCheckin} className="space-y-4">
              <Input
                id="name"
                label="お名前"
                placeholder="山田 太郎"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" size="lg" loading={loading}>
                チェックイン
              </Button>
            </form>
          </div>
        )}

        {step === 'confirmed' && reservation && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
            <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {reservation.guest_name} 様
            </h2>
            <p className="text-gray-500 text-sm mb-1">
              {formatDate(reservation.checkin_date)} 〜 {formatDate(reservation.checkout_date)}
            </p>
            <p className="text-gray-400 text-sm mb-6">{reservation.num_guests}名</p>

            <div className="bg-indigo-50 rounded-2xl px-6 py-5 mb-4">
              <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                <KeyRound size={18} />
                <span className="text-sm font-medium">暗証番号</span>
              </div>
              <p className="text-5xl font-bold text-indigo-700 tracking-[0.3em]">
                {reservation.pin_code}
              </p>
            </div>

            <p className="text-xs text-gray-400">
              この番号を玄関の鍵に入力してください。<br />
              お忘れの場合は再度QRコードをスキャンしてください。
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 text-center">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">確認できませんでした</h2>
            <p className="text-gray-500 text-sm mb-5">{errorMsg}</p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setStep('input'); setName(''); setErrorMsg('') }}
            >
              もう一度試す
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
