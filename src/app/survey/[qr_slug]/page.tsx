import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SurveyForm } from './survey-form'
import type { SurveyConfig } from './survey-form'

const DEFAULT_SURVEY_CONFIG: SurveyConfig = {
  standard: {
    overall:     true,
    cleanliness: true,
    facilities:  true,
    location:    true,
    revisit:     false,
    comment:     true,
  },
  custom: [],
}

export default async function SurveyPage({ params }: { params: Promise<{ qr_slug: string }> }) {
  const { qr_slug } = await params
  const supabase = await createClient()

  const { data: facility } = await supabase
    .from('facilities')
    .select('id, name, address, survey_config')
    .eq('qr_slug', qr_slug)
    .single()

  if (!facility) notFound()

  const config: SurveyConfig = {
    ...DEFAULT_SURVEY_CONFIG,
    ...(facility.survey_config as Partial<SurveyConfig> ?? {}),
    standard: {
      ...DEFAULT_SURVEY_CONFIG.standard,
      ...((facility.survey_config as Partial<SurveyConfig>)?.standard ?? {}),
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-white py-8 px-4">
      <div className="w-full max-w-lg mx-auto">

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-indigo-600 tracking-wide">CheckInn</h1>
          <p className="text-gray-500 text-sm mt-1">宿泊アンケート</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">{facility.name}</h2>
          {facility.address && <p className="text-sm text-gray-400">{facility.address}</p>}
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            ご宿泊いただきありがとうございました。<br />
            今後のサービス向上のため、ぜひご感想をお聞かせください。
          </p>
        </div>

        <SurveyForm
          qrSlug={qr_slug}
          facilityName={facility.name}
          config={config}
        />
      </div>
    </div>
  )
}
