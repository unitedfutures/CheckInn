import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendCheckinQrEmail } from '@/lib/resend/emails'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()

  // service_role キーが必要なため、anon クライアントで booking を取得
  const { data: booking } = await supabase
    .from('bookings')
    .select('*, facilities(name, emergency_contact)')
    .eq('pre_checkin_token', token)
    .single()

  if (!booking) return NextResponse.json({ error: '予約が見つかりません' }, { status: 404 })
  if (booking.status !== 'pending' && booking.status !== 'pre_checkin_sent') {
    return NextResponse.json({ error: 'すでに登録済みです' }, { status: 400 })
  }

  const formData = await request.formData()
  const basic = JSON.parse(formData.get('basic') as string)
  const passport = JSON.parse(formData.get('passport') as string)
  const passportFile = formData.get('passport_image') as File | null

  // IPアドレス取得
  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'

  let passport_image_path: string | null = null

  // パスポート画像アップロード
  if (passportFile && basic.is_foreign) {
    const arrayBuffer = await passportFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const ext = passportFile.name.split('.').pop() ?? 'jpg'
    const path = `${booking.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('passport-images')
      .upload(path, buffer, { contentType: passportFile.type, upsert: true })

    if (!uploadError) passport_image_path = path
  }

  // guest_records に保存
  const { error: recordError } = await supabase.from('guest_records').insert({
    booking_id: booking.id,
    facility_id: booking.facility_id,
    full_name: basic.full_name,
    address: basic.address,
    phone: basic.phone,
    email: basic.email,
    num_guests: basic.num_guests,
    is_foreign: basic.is_foreign,
    nationality: basic.is_foreign ? passport.nationality : null,
    passport_number: basic.is_foreign ? passport.passport_number : null,
    passport_image_path,
    terms_agreed_at: new Date().toISOString(),
    terms_ip_address: ip,
  })

  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 500 })

  // booking ステータス更新
  await supabase.from('bookings')
    .update({ status: 'pre_checkin_done', updated_at: new Date().toISOString() })
    .eq('id', booking.id)

  // チェックイン用QRコードをメール送信
  const facility = booking.facilities as unknown as { name: string; emergency_contact: string | null }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  await sendCheckinQrEmail({
    to: basic.email,
    guestName: basic.full_name,
    guestQrToken: booking.guest_qr_token,
    propertyName: facility.name,
    checkinDate: booking.checkin_date,
    emergencyContact: facility.emergency_contact,
    appUrl,
  })

  return NextResponse.json({ success: true })
}
