import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getBookings } from '@/lib/beds24/client'
import { sendPreCheckinEmail } from '@/lib/brevo/emails'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { facility_id } = await request.json()
  if (!facility_id) return NextResponse.json({ error: 'facility_id is required' }, { status: 400 })

  // ユーザーのBeds24 APIキーをprofilesから取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('beds24_api_key')
    .eq('id', user.id)
    .single()

  if (!profile?.beds24_api_key) {
    return NextResponse.json({ error: 'Beds24 APIキーが設定されていません。設定ページから登録してください。' }, { status: 400 })
  }

  const { data: facility } = await supabase
    .from('facilities')
    .select('beds24_property_id, name')
    .eq('id', facility_id)
    .eq('user_id', user.id)
    .single()

  if (!facility?.beds24_property_id) {
    return NextResponse.json({ error: 'Beds24 Property IDが設定されていません。施設設定から登録してください。' }, { status: 400 })
  }

  const today = new Date()
  const dateFrom = today.toISOString().split('T')[0]
  const dateTo = new Date(new Date().setMonth(today.getMonth() + 3)).toISOString().split('T')[0]

  let beds24Bookings
  try {
    beds24Bookings = await getBookings(facility.beds24_property_id, dateFrom, dateTo, profile.beds24_api_key)
  } catch (e) {
    return NextResponse.json({ error: 'Beds24との通信に失敗しました。APIキーを確認してください。' }, { status: 502 })
  }

  let synced = 0
  let skipped = 0
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  for (const b of beds24Bookings) {
    const { data: existing } = await supabase
      .from('bookings')
      .select('id')
      .eq('beds24_booking_id', b.bookId)
      .single()

    if (existing) { skipped++; continue }

    const guestName = `${b.guestLastName} ${b.guestFirstName}`.trim()
    const numGuests = (b.numAdult || 0) + (b.numChild || 0)

    const { data: newBooking } = await supabase
      .from('bookings')
      .insert({
        facility_id,
        user_id: user.id,
        beds24_booking_id: b.bookId,
        guest_email: b.guestEmail,
        guest_name: guestName,
        checkin_date: b.firstNight,
        checkout_date: b.lastNight,
        num_guests: numGuests || 1,
        status: b.guestEmail ? 'pre_checkin_sent' : 'pending',
      })
      .select()
      .single()

    if (newBooking && b.guestEmail) {
      await sendPreCheckinEmail({
        to: b.guestEmail,
        guestName,
        token: newBooking.pre_checkin_token,
        propertyName: facility.name,
        checkinDate: b.firstNight,
        checkoutDate: b.lastNight,
        appUrl,
      })
    }

    synced++
  }

  return NextResponse.json({ synced, skipped, total: beds24Bookings.length })
}
