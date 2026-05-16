import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, CalendarDays, Users, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { count: facilityCount },
    { count: bookingCount },
    { count: checkedInCount },
    { count: guestCount },
  ] = await Promise.all([
    supabase.from('facilities').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'checked_in'),
    supabase.from('guest_records').select('*', { count: 'exact', head: true }),
  ])

  const stats = [
    { label: '施設数', value: facilityCount ?? 0, icon: Building2, color: 'text-indigo-600 bg-indigo-50' },
    { label: '予約数', value: bookingCount ?? 0, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'チェックイン済み', value: checkedInCount ?? 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
    { label: '宿泊者名簿（累計）', value: guestCount ?? 0, icon: Users, color: 'text-orange-600 bg-orange-50' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-500 text-sm mt-1">ようこそ、{user?.email} さん</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className={`p-3 rounded-xl ${color} shrink-0`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="font-semibold text-indigo-900 mb-2">チェックインフロー</h3>
        <div className="flex items-center gap-2 text-sm text-indigo-700 flex-wrap">
          <span className="bg-white border border-indigo-200 rounded-lg px-3 py-1">① Beds24予約同期</span>
          <span className="text-indigo-400">→</span>
          <span className="bg-white border border-indigo-200 rounded-lg px-3 py-1">② 事前チェックインメール送信</span>
          <span className="text-indigo-400">→</span>
          <span className="bg-white border border-indigo-200 rounded-lg px-3 py-1">③ 宿泊者情報・規約同意</span>
          <span className="text-indigo-400">→</span>
          <span className="bg-white border border-indigo-200 rounded-lg px-3 py-1">④ 現地QR照合・顔写真</span>
          <span className="text-indigo-400">→</span>
          <span className="bg-white border border-indigo-200 rounded-lg px-3 py-1">⑤ 暗証番号表示</span>
        </div>
      </div>
    </div>
  )
}
