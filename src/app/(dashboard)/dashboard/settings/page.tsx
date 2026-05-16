import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Key, Mail, Lock } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">設定</h2>
        <p className="text-gray-500 text-sm mt-1">アカウント・連携サービスの設定</p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">アカウント情報</h3>
            </div>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">メールアドレス</dt>
                <dd className="text-gray-900 font-medium">{user?.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">会社名</dt>
                <dd className="text-gray-900">{profile?.company_name ?? '未設定'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">プラン</dt>
                <dd className="text-gray-900">{profile?.plan ?? 'free'}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">外部サービス連携状況</h3>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                { name: 'Beds24', desc: '予約情報の自動同期', status: '施設ごとに設定' },
                { name: 'RemoteLOCK', desc: 'スマートロック連動', status: '施設ごとに設定' },
                { name: 'Resend', desc: 'メール送信', status: '設定済み' },
              ].map(({ name, desc, status }) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-xs text-gray-400">{desc}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">{status}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">APIキーの変更は .env.local ファイルを編集してください。</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock size={18} className="text-gray-500" />
              <h3 className="font-semibold text-gray-900">データ保存・削除ポリシー</h3>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex gap-2"><span className="text-green-500">✓</span> 宿泊者名簿：旅館業法に基づき3年間保存後、自動削除</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> 顔写真・パスポート画像：暗号化してSupabase Storageに保存</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> 通信：HTTPS必須（Vercel自動対応）</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> 規約同意：タイムスタンプ・IPアドレスを記録</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
