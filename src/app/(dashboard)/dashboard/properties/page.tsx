import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, QrCode, Plus } from 'lucide-react'
import { PropertyForm } from './property-form'
import { PropertyQR } from './property-qr'

export default async function PropertiesPage() {
  const supabase = await createClient()
  const { data: properties } = await supabase
    .from('properties')
    .select('*, reservations(count)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">施設管理</h2>
          <p className="text-gray-500 text-sm mt-1">施設の登録・QRコード発行</p>
        </div>
        <PropertyForm />
      </div>

      {properties && properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <Card key={property.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 size={18} className="text-indigo-600 mt-0.5" />
                    <h3 className="font-semibold text-gray-900">{property.name}</h3>
                  </div>
                  <Badge variant="info">
                    {(property.reservations as unknown as { count: number }[])?.[0]?.count ?? 0}件
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {property.address && (
                  <p className="text-sm text-gray-500 mb-3">{property.address}</p>
                )}
                {property.description && (
                  <p className="text-sm text-gray-400 mb-4 line-clamp-2">{property.description}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2 mb-4">
                  <QrCode size={14} />
                  <span className="font-mono truncate">{property.qr_slug}</span>
                </div>
                <PropertyQR property={property} />
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
