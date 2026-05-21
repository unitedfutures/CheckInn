import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { RegisterForm } from './register-form'
import type { FormConfig } from '@/app/(dashboard)/dashboard/facilities/form-config-editor'
import { DEFAULT_FORM_CONFIG } from '@/app/(dashboard)/dashboard/facilities/form-config-editor'

export default async function RegisterPage({ params }: { params: Promise<{ qr_slug: string }> }) {
  const { qr_slug } = await params
  const supabase = await createClient()

  const { data: facility } = await supabase
    .from('facilities')
    .select('id, name, address, form_config')
    .eq('qr_slug', qr_slug)
    .single()

  if (!facility) notFound()

  const formConfig: FormConfig = { ...DEFAULT_FORM_CONFIG, ...(facility.form_config as Partial<FormConfig> ?? {}) }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white py-8 px-4">
      <div className="w-full max-w-lg mx-auto">

        {/* ヘッダー */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-wide">CheckInn</h1>
          <p className="text-gray-500 text-sm mt-1">事前チェックイン登録</p>
        </div>

        {/* 施設情報 */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">{facility.name}</h2>
          {facility.address && (
            <p className="text-sm text-gray-400">{facility.address}</p>
          )}
        </div>

        {/* 登録フォーム */}
        <RegisterForm
          qrSlug={qr_slug}
          facilityName={facility.name}
          formConfig={formConfig as Record<string, string>}
        />

      </div>
    </div>
  )
}
