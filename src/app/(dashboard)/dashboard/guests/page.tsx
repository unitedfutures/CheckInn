import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle, Globe, Download } from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/utils'
import { CsvDownloadButton } from './csv-download-button'

export default async function GuestsPage() {
  const supabase = await createClient()

  const [{ data: guests }, { data: facilities }] = await Promise.all([
    supabase
      .from('guest_records')
      .select('*, bookings(checkin_date, checkout_date, guest_qr_token, facilities(name))')
      .order('created_at', { ascending: false }),
    supabase.from('facilities').select('id, name'),
  ])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">宿泊者名簿</h2>
          <p className="text-gray-500 text-sm mt-1">旅館業法準拠 ／ 3年間保存</p>
        </div>
        <CsvDownloadButton />
      </div>

      {guests && guests.length > 0 ? (
        <div className="space-y-3">
          {guests.map((g) => {
            const booking = g.bookings as unknown as {
              checkin_date: string
              checkout_date: string
              facilities: { name: string }
            }
            return (
              <Card key={g.id} className="hover:shadow-sm transition-shadow">
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="hidden sm:flex p-2.5 bg-gray-50 rounded-xl shrink-0">
                      <Users size={18} className="text-gray-500" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{g.full_name}</span>
                        {g.is_foreign && (
                          <Badge variant="info"><Globe size={10} className="mr-1" />{g.nationality}</Badge>
                        )}
                        {g.num_guests > 1 && (
                          <span className="text-xs text-gray-400">{g.num_guests}名</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {booking?.facilities?.name} ／ {formatDate(booking?.checkin_date)} 〜 {formatDate(booking?.checkout_date)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{g.address} ／ {g.phone}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 text-right">
                    {g.checkin_completed_at ? (
                      <Badge variant="success">
                        <CheckCircle size={11} className="mr-1" />
                        チェックイン済み
                      </Badge>
                    ) : (
                      <Badge variant="warning">未チェックイン</Badge>
                    )}
                    {g.terms_agreed_at && (
                      <span className="text-xs text-gray-400">規約同意: {formatDateTime(g.terms_agreed_at)}</span>
                    )}
                    {g.checkin_completed_at && (
                      <span className="text-xs text-gray-400">チェックイン: {formatDateTime(g.checkin_completed_at)}</span>
                    )}
                    <span className="text-xs text-gray-300">削除予定: {formatDate(g.delete_after)}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Users size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">宿泊者名簿がありません</p>
          <p className="text-xs mt-1">宿泊者が事前チェックインを完了すると自動で登録されます</p>
        </div>
      )}
    </div>
  )
}
