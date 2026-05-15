import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = await createClient()

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, guest_info_submitted')
    .eq('guest_token', token)
    .single()

  if (!reservation) {
    return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  }

  if (reservation.guest_info_submitted) {
    return NextResponse.json({ error: 'すでに情報が登録されています' }, { status: 400 })
  }

  const body = await request.json()
  const { guest_name, guest_email, guest_phone } = body

  if (!guest_name || !guest_email || !guest_phone) {
    return NextResponse.json({ error: '必須項目を入力してください' }, { status: 400 })
  }

  const { error } = await supabase
    .from('reservations')
    .update({
      guest_name,
      guest_email,
      guest_phone,
      guest_info_submitted: true,
    })
    .eq('id', reservation.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
