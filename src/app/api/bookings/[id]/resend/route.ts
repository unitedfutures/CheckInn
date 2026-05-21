import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { sendPreCheckinEmail } from '@/lib/brevo/emails'

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: booking } = await supabase
    .from('bookings')
    .select('*, facilities(name)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!booking?.guest_email) return NextResponse.json({ error: 'メールアドレスがありません' }, { status: 400 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  await sendPreCheckinEmail({
    to: booking.guest_email,
    guestName: booking.guest_name ?? '',
    token: booking.pre_checkin_token,
    propertyName: (booking.facilities as { name: string })?.name ?? '',
    checkinDate: booking.checkin_date,
    checkoutDate: booking.checkout_date,
    appUrl,
  })

  await supabase.from('bookings').update({ status: 'pre_checkin_sent' }).eq('id', id)
  return NextResponse.json({ success: true })
}
