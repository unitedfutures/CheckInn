import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  const { property_id, guest_name } = body

  if (!property_id || !guest_name) {
    return NextResponse.json({ error: '施設IDとお名前は必須です' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]

  // 今日がチェックイン日 or 滞在中の予約を名前で検索（部分一致・大文字小文字無視）
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, guest_name, checkin_date, checkout_date, num_guests, pin_code, guest_info_submitted')
    .eq('property_id', property_id)
    .lte('checkin_date', today)
    .gte('checkout_date', today)

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ error: '本日の予約が見つかりません' }, { status: 404 })
  }

  const normalize = (s: string) => s.replace(/\s/g, '').toLowerCase()
  const inputName = normalize(guest_name)

  const matched = reservations.find((r) =>
    r.guest_name && normalize(r.guest_name).includes(inputName)
  )

  if (!matched) {
    return NextResponse.json({ error: 'お名前と一致する予約が見つかりません' }, { status: 404 })
  }

  if (!matched.guest_info_submitted) {
    return NextResponse.json({ error: '宿泊者情報の事前入力が必要です。メールのリンクから情報を入力してください。' }, { status: 403 })
  }

  return NextResponse.json({
    guest_name: matched.guest_name,
    checkin_date: matched.checkin_date,
    checkout_date: matched.checkout_date,
    num_guests: matched.num_guests,
    pin_code: matched.pin_code,
  })
}
