import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Mail } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { ReservationForm } from './reservation-form'

export default async function ReservationsPage() {
  const supabase = await createClient()

  const [{ data: reservations }, { data: properties }] = await Promise.all([
    supabase
      .from('reservations')
      .select('*, properties(name)')
      .order('checkin_date', { ascending: false }),
    supabase.from('properties').select('id, name').order('name'),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">予約管理</h2>
          <p className="text-gray-500 text-sm mt-1">予約の登録・宿泊者情報の確認</p>
        </div>
        <ReservationForm properties={properties ?? []} />
      </div>

      {reservations && reservations.length > 0 ? (
        <div className="space-y-3">
          {reservations.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <div className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="hidden md:flex p-2.5 bg-indigo-50 rounded-xl">
                    <CalendarDays size={18} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 text-sm">
                        {(r.properties as unknown as { name: string })?.name}
                      </span>
                      <span className="text-xs text-gray-400">#{r.reservation_code}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {formatDate(r.checkin_date)} 〜 {formatDate(r.checkout_date)}
                      {r.guest_name && ` ／ ${r.guest_name}`}
                    </p>
                    {r.guest_email && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-400">
                        <Mail size={11} />
                        {r.guest_email}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {r.guest_info_submitted ? (
                    <Badge variant="success">情報入力済</Badge>
                  ) : (
                    <Badge variant="warning">情報未入力</Badge>
                  )}
                  <div className="text-right">
                    <p className="text-xs text-gray-400">暗証番号</p>
                    <p className="text-lg font-bold text-gray-900 font-mono tracking-widest">{r.pin_code}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">予約がありません</p>
          <p className="text-xs mt-1">右上の「予約を追加」から登録してください</p>
        </div>
      )}
    </div>
  )
}
