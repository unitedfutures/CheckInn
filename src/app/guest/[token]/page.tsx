import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { GuestForm } from './guest-form'
import { CheckCircle } from 'lucide-react'

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('*, properties(name, address)')
    .eq('guest_token', token)
    .single()

  if (!reservation) notFound()

  if (reservation.guest_info_submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">入力済みです</h2>
          <p className="text-gray-500 text-sm">宿泊者情報はすでに受け付けております。</p>
          <p className="text-gray-400 text-sm mt-1">
            チェックイン当日は玄関前のQRコードをスキャンしてください。
          </p>
        </div>
      </div>
    )
  }

  const property = reservation.properties as unknown as { name: string; address: string }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-wide">YOKOSO</h1>
          <p className="text-gray-500 text-sm mt-1">宿泊者情報のご入力</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 mb-4">
          <h2 className="font-semibold text-gray-900 mb-1">{property.name}</h2>
          {property.address && <p className="text-sm text-gray-400 mb-3">{property.address}</p>}
          <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>チェックイン</span>
              <span className="font-medium">{formatDate(reservation.checkin_date)}</span>
            </div>
            <div className="flex justify-between text-gray-600 mt-1">
              <span>チェックアウト</span>
              <span className="font-medium">{formatDate(reservation.checkout_date)}</span>
            </div>
          </div>
        </div>

        <GuestForm token={token} defaultEmail={reservation.guest_email ?? ''} />
      </div>
    </div>
  )
}
