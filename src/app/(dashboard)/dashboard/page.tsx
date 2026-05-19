import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, CalendarDays, Users, CheckCircle, Settings, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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

      {/* 初期設定 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Settings size={15} className="text-gray-500" />
          <h3 className="font-semibold text-gray-700 text-sm">初期設定（最初に1度だけ）</h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-wrap">
          <Link href="/dashboard/facilities" className="bg-white border border-gray-300 rounded-lg px-3 py-1 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
            施設を登録してQRコードを発行
          </Link>
          <span className="text-gray-300">／</span>
          <Link href="/dashboard/settings" className="bg-white border border-gray-300 rounded-lg px-3 py-1 hover:border-indigo-400 hover:text-indigo-600 transition-colors">
            Beds24連携を設定（任意）
          </Link>
        </div>
      </div>

      {/* 通常フロー */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
        <h3 className="font-semibold text-indigo-900 mb-3">通常の運用フロー</h3>
        <div className="flex items-center gap-2 text-sm text-indigo-700 flex-wrap">
          <div className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5">
            <span className="text-indigo-400 text-xs mr-1">①</span>事前登録URLをゲストに送付
          </div>
          <ArrowRight size={14} className="text-indigo-300 shrink-0" />
          <div className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5">
            <span className="text-indigo-400 text-xs mr-1">②</span>ゲストが情報・顔写真・パスキーを登録
          </div>
          <ArrowRight size={14} className="text-indigo-300 shrink-0" />
          <div className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5">
            <span className="text-indigo-400 text-xs mr-1">③</span>当日：QRスキャン → Face ID認証
          </div>
          <ArrowRight size={14} className="text-indigo-300 shrink-0" />
          <div className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 font-medium text-green-700 border-green-200 bg-green-50">
            暗証番号を表示して入室
          </div>
        </div>
      </div>
    </div>
  )
}
