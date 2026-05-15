import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generatePin } from '@/lib/utils'
import { sendGuestInfoRequestEmail } from '@/lib/resend/emails'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { property_id, reservation_code, guest_email, checkin_date, checkout_date, num_guests, notes } = body

  if (!property_id || !reservation_code || !checkin_date || !checkout_date) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const pin_code = generatePin()

  const { data, error } = await supabase
    .from('reservations')
    .insert({
      property_id,
      user_id: user.id,
      reservation_code,
      guest_email,
      checkin_date,
      checkout_date,
      num_guests: num_guests || 1,
      pin_code,
      notes,
    })
    .select('*, properties(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ゲストのメールアドレスがあれば情報入力メールを送信
  if (guest_email && data) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await sendGuestInfoRequestEmail({
      to: guest_email,
      guestToken: data.guest_token,
      propertyName: (data.properties as unknown as { name: string })?.name ?? '',
      checkinDate: checkin_date,
      checkoutDate: checkout_date,
      appUrl,
    })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

  const { error } = await supabase
    .from('reservations')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
