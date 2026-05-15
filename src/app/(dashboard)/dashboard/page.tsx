import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Building2, CalendarDays, Users, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ count: propertyCount }, { count: reservationCount }, { count: checkedInCount }] =
    await Promise.all([
      supabase.from('properties').select('*', { count: 'exact', head: true }),
      supabase.from('reservations').select('*', { count: 'exact', head: true }),
      supabase
        .from('reservations')
        .select('*', { count: 'exact', head: true })
        .eq('guest_info_submitted', true),
    ])

  const stats = [
    { label: '施設数', value: propertyCount ?? 0, icon: Building2, color: 'text-indigo-600 bg-indigo-50' },
    { label: '予約数（合計）', value: reservationCount ?? 0, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'チェックイン済み', value: checkedInCount ?? 0, icon: CheckCircle, color: 'text-green-600 bg-green-50' },
  ]

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">ダッシュボード</h2>
        <p className="text-gray-500 text-sm mt-1">ようこそ、{user?.email} さん</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 py-6">
              <div className={`p-3 rounded-xl ${color}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
