import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAirhostBookings } from '@/lib/airhost/client'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { facility_id } = await request.json()
  if (!facility_id) return NextResponse.json({ error: 'facility_id is required' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('airhost_api_key')
    .eq('id', user.id)
    .single()

  if (!profile?.airhost_api_key) {
    return NextResponse.json({ error: 'Airhost APIキーが設定されていません。設定ページから登録してください。' }, { status: 400 })
  }

  const { data: facility } = await supabase
    .from('facilities')
    .select('airhost_property_id, name')
    .eq('id', facility_id)
    .eq('user_id', user.id)
    .single()

  if (!facility?.airhost_property_id) {
    return NextResponse.json({ error: 'Airhost Property IDが設定されていません。施設設定から登録してください。' }, { status: 400 })
  }

  const today = new Date()
  const dateFrom = today.toISOString().split('T')[0]
  const dateTo = new Date(new Date().setMonth(today.getMonth() + 3)).toISOString().split('T')[0]

  let airhostBookings
  try {
    airhostBookings = await getAirhostBookings(
      facility.airhost_property_id,
      dateFrom,
      dateTo,
      profile.airhost_api_key
    )
  } catch (e) {
    return NextResponse.json({ error: 'Airhostとの通信に失敗しました。APIキーを確認してください。' }, { status: 502 })
  }

  let synced = 0
  let skipped = 0

  for (const b of airhostBookings) {
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('airhost_booking_id', b.uid)
      .single()

    if (existing) { skipped++; continue }

    await supabase.from('bookings').insert({
      facility_id,
      user_id:            user.id,
      airhost_booking_id: b.uid,
      ota_source:         'airhost',
      guest_email:        b.guest_email,
      guest_name:         b.guest_name,
      checkin_date:       b.check_in,
      checkout_date:      b.check_out,
      num_guests:         b.number_of_guests || 1,
      status:             'pending',
    })

    synced++
  }

  return NextResponse.json({ synced, skipped, total: airhostBookings.length })
}
