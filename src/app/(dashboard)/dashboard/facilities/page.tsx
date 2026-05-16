import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, QrCode, RefreshCw } from 'lucide-react'
import { FacilityForm } from './facility-form'
import { FacilityQR } from './facility-qr'
import { Beds24SyncButton } from './beds24-sync-button'

export default async function FacilitiesPage() {
  const supabase = await createClient()
  const { data: facilities } = await supabase
    .from('facilities')
    .select('*, bookings(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">施設管理</h2>
          <p className="text-gray-500 text-sm mt-1">施設の登録・QRコード発行・Beds24連携</p>
        </div>
        <FacilityForm />
      </div>

      {facilities && facilities.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {facilities.map((f) => (
            <Card key={f.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 size={18} className="text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">{f.name}</h3>
                    </div>
                    {f.address && <p className="text-xs text-gray-400 mt-0.5 ml-6">{f.address}</p>}
                  </div>
                  <Badge variant="info">
                    {(f.bookings as unknown as { count: number }[])?.[0]?.count ?? 0}件
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
                  <QrCode size={13} />
                  <span className="font-mono truncate">{f.qr_slug}</span>
                </div>

                {f.beds24_property_id && (
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-2">
                    <RefreshCw size={13} />
                    <span>Beds24 ID: {f.beds24_property_id}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <FacilityQR facility={f} />
                  {f.beds24_property_id && <Beds24SyncButton facilityId={f.id} />}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">施設が登録されていません</p>
          <p className="text-xs mt-1">右上の「施設を追加」から登録してください</p>
        </div>
      )}
    </div>
  )
}
