import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Mail, Send } from 'lucide-react'
import { formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils'
import { BookingForm } from './booking-form'
import { ResendEmailButton } from './resend-email-button'

export default async function BookingsPage() {
  const supabase = await createClient()
  const [{ data: bookings }, { data: facilities }] = await Promise.all([
    supabase.from('bookings').select('*, facilities(name)').order('checkin_date', { ascending: false }),
    supabase.from('facilities').select('id, name').order('name'),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">予約管理</h2>
          <p className="text-gray-500 text-sm mt-1">予約の登録・事前チェックイン状況の確認</p>
        </div>
        <BookingForm facilities={facilities ?? []} />
      </div>

      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Card key={b.id} className="hover:shadow-sm transition-shadow">
              <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="hidden sm:flex p-2.5 bg-indigo-50 rounded-xl shrink-0">
                    <CalendarDays size={18} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {(b.facilities as unknown as { name: string })?.name}
                      </span>
                      {b.beds24_booking_id && (
                        <span className="text-xs text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">Beds24</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(b.checkin_date)} 〜 {formatDate(b.checkout_date)}
                      {b.guest_name && ` ／ ${b.guest_name}`}（{b.num_guests}名）
                    </p>
                    {b.guest_email && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                        <Mail size={11} /> {b.guest_email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={getStatusVariant(b.status)}>{getStatusLabel(b.status)}</Badge>
                  {b.guest_email && (b.status === 'pending' || b.status === 'pre_checkin_sent') && (
                    <ResendEmailButton bookingId={b.id} />
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">予約がありません</p>
          <p className="text-xs mt-1">「予約を追加」または施設ページからBeds24同期してください</p>
        </div>
      )}
    </div>
  )
}
