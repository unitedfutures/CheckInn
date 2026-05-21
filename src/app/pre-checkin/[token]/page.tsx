import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { PreCheckinForm } from './pre-checkin-form'
import { CheckCircle } from 'lucide-react'

export default async function PreCheckinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, facilities(name, address, emergency_contact, form_config)')
    .eq('pre_checkin_token', token)
    .single()

  if (!booking) notFound()

  if (booking.status === 'pre_checkin_done' || booking.status === 'checked_in' || booking.status === 'checked_out') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">事前登録済みです</h2>
          <p className="text-gray-500 text-sm">
            チェックイン用QRコードをメールでお送り済みです。<br />
            当日は施設玄関のQRコードをスキャンしてください。
          </p>
        </div>
      </div>
    )
  }

  const facility = booking.facilities as unknown as { name: string; address: string; emergency_contact: string; form_config?: Record<string, string> }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4">
      <div className="w-full max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-wide">CheckInn</h1>
          <p className="text-gray-500 text-sm mt-1">事前チェックイン登録</p>
        </div>

        {/* 予約情報 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">{facility.name}</h2>
          {facility.address && <p className="text-sm text-gray-400 mb-3">{facility.address}</p>}
          <div className="bg-indigo-50 rounded-xl px-4 py-3 text-sm grid grid-cols-2 gap-2">
            <div>
              <p className="text-xs text-gray-500">チェックイン</p>
              <p className="font-semibold text-gray-800">{formatDate(booking.checkin_date)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">チェックアウト</p>
              <p className="font-semibold text-gray-800">{formatDate(booking.checkout_date)}</p>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <PreCheckinForm
          token={token}
          bookingId={booking.id}
          defaultEmail={booking.guest_email ?? ''}
          defaultName={booking.guest_name ?? ''}
          numGuests={booking.num_guests}
          formConfig={facility.form_config ?? {}}
        />
      </div>
    </div>
  )
}
