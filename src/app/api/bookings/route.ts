import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPreCheckinEmail } from '@/lib/resend/emails'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const facilityId = searchParams.get('facility_id')

  let query = supabase
    .from('bookings')
    .select('*, facilities(name)')
    .eq('user_id', user.id)
    .order('checkin_date', { ascending: false })

  if (facilityId) query = query.eq('facility_id', facilityId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { facility_id, guest_email, guest_name, checkin_date, checkout_date, num_guests } = body

  if (!facility_id || !checkin_date || !checkout_date) {
    return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({ facility_id, user_id: user.id, guest_email, guest_name, checkin_date, checkout_date, num_guests: num_guests || 1 })
    .select('*, facilities(name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // メールアドレスがあれば事前チェックインメールを送信
  if (guest_email && data) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    await sendPreCheckinEmail({
      to: guest_email,
      guestName: guest_name || '',
      token: data.pre_checkin_token,
      propertyName: (data.facilities as { name: string })?.name ?? '',
      checkinDate: checkin_date,
      checkoutDate: checkout_date,
      appUrl,
    })

    await supabase.from('bookings').update({ status: 'pre_checkin_sent' }).eq('id', data.id)
    data.status = 'pre_checkin_sent'
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

  const { error } = await supabase.from('bookings').delete().eq('id', id).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
