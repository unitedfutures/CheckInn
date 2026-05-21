import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Building2, QrCode, RefreshCw } from 'lucide-react'
import { FacilityForm } from './facility-form'
import { FacilityQR } from './facility-qr'
import { Beds24SyncButton } from './beds24-sync-button'
import { Beds24ImportButton } from './beds24-import-button'
import { PreCheckinUrlDisplay } from './pre-checkin-url-generator'
import { FormConfigEditor, DEFAULT_FORM_CONFIG } from './form-config-editor'
import type { FormConfig } from './form-config-editor'

export default async function FacilitiesPage() {
  const supabase = await createClient()
  const { data: facilities } = await supabase
    .from('facilities')
    .select('*, bookings(count)')
    .order('created_at', { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">施設管理</h2>
          <p className="text-gray-500 text-sm mt-1">施設の登録・事前登録URL発行・QRコード・Beds24連携</p>
        </div>
        <div className="flex items-start gap-3">
          <Beds24ImportButton />
          <FacilityForm />
        </div>
      </div>

      {facilities && facilities.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {facilities.map((f) => {
            const formConfig: FormConfig = { ...DEFAULT_FORM_CONFIG, ...(f.form_config as Partial<FormConfig> ?? {}) }
            return (
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

                  {/* ① 事前登録URL（最上段・目立つ配置） */}
                  <PreCheckinUrlDisplay qrSlug={f.qr_slug} appUrl={appUrl} />

                  {/* ② QRコード表示・Beds24 */}
                  <div className="border-t border-gray-100 pt-3 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <QrCode size={13} className="text-indigo-500" />
                      <p className="text-xs font-semibold text-indigo-700">チェックインQR（施設玄関に掲示）</p>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      印刷して施設玄関付近に貼ってください。ゲストがQRコードを読み込みチェックインを完了します。
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
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
                  </div>

                  {/* ③ 施設設定（最大人数 + フォーム項目） */}
                  <div className="border-t border-gray-100 pt-3">
                    <FormConfigEditor
                      facilityId={f.id}
                      currentConfig={formConfig}
                      currentMaxGuests={f.max_guests ?? 10}
                    />
                  </div>

                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">施設が登録されていません</p>
          <p className="text-xs mt-1">「Beds24から施設をインポート」または「施設を追加」から登録してください</p>
        </div>
      )}
    </div>
  )
}
