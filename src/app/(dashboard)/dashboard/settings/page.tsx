import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PLANS } from '@/lib/stripe/client'
import { SubscribeButton } from './subscribe-button'
import { PortalButton } from './portal-button'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_name, plan, subscription_status, stripe_customer_id')
    .eq('id', user!.id)
    .single()

  const currentPlan = profile?.plan ?? 'free'
  const isActive = profile?.subscription_status === 'active'

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">設定</h2>
        <p className="text-gray-500 text-sm mt-1">アカウント・プラン管理</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <h3 className="font-semibold text-gray-900">アカウント情報</h3>
        </CardHeader>
        <CardContent>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">メールアドレス</dt>
              <dd className="font-medium text-gray-900">{user?.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">現在のプラン</dt>
              <dd>
                <Badge variant={isActive ? 'success' : 'default'}>
                  {currentPlan === 'pro' ? 'プロ' : currentPlan === 'starter' ? 'スターター' : '無料'}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-900 mb-1">プランを選択</h3>
        <p className="text-sm text-gray-500">月額サブスクリプション（税込）</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {Object.entries(PLANS).map(([key, plan]) => (
          <Card key={key} className={currentPlan === key && isActive ? 'ring-2 ring-indigo-500' : ''}>
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                {currentPlan === key && isActive && <Badge variant="success">利用中</Badge>}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-4">
                ¥{plan.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/月</span>
              </p>
              <ul className="space-y-1.5 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="text-green-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              {currentPlan === key && isActive ? (
                <PortalButton />
              ) : (
                <SubscribeButton priceId={plan.priceId} planName={plan.name} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {isActive && profile?.stripe_customer_id && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">請求履歴・支払い方法の変更</p>
              <PortalButton label="Stripeポータルを開く" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
