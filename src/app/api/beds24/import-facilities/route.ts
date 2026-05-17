import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getProperties } from '@/lib/beds24/client'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Beds24 APIキーを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('beds24_api_key')
    .eq('id', user.id)
    .single()

  if (!profile?.beds24_api_key) {
    return NextResponse.json({ error: 'Beds24 APIキーが設定されていません。設定ページから登録してください。' }, { status: 400 })
  }

  // Beds24から物件一覧を取得
  let properties
  try {
    properties = await getProperties(profile.beds24_api_key)
  } catch {
    return NextResponse.json({ error: 'Beds24との通信に失敗しました。APIキーを確認してください。' }, { status: 502 })
  }

  if (!properties.length) {
    return NextResponse.json({ imported: 0, skipped: 0, message: 'Beds24に物件が登録されていません' })
  }

  // 既存施設のbeds24_property_idを取得
  const { data: existing } = await supabase
    .from('facilities')
    .select('beds24_property_id')
    .eq('user_id', user.id)
    .not('beds24_property_id', 'is', null)

  const existingIds = new Set((existing ?? []).map(f => f.beds24_property_id))

  let imported = 0
  let skipped = 0

  for (const prop of properties) {
    if (existingIds.has(prop.propId)) {
      skipped++
      continue
    }

    // 住所を結合
    const address = [prop.address, prop.city, prop.country].filter(Boolean).join(' ')

    await supabase.from('facilities').insert({
      user_id: user.id,
      name: prop.name,
      address: address || null,
      beds24_property_id: prop.propId,
    })

    imported++
  }

  return NextResponse.json({ imported, skipped, total: properties.length })
}
