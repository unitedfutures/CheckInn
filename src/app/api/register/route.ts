import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 公開エンドポイント（認証不要）— service_role で RLS をバイパス
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const qrSlug      = formData.get('qr_slug') as string
    const basic       = JSON.parse(formData.get('basic') as string)
    const booking     = JSON.parse(formData.get('booking') as string)
    const passport    = JSON.parse(formData.get('passport') as string)
    const passportFile = formData.get('passport_image') as File | null
    const faceFile    = formData.get('face_photo') as File | null

    if (!qrSlug || !basic.full_name || !basic.email || !booking.checkin_date || !booking.checkout_date) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }

    // 施設を qr_slug で検索
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id, user_id, name, emergency_contact')
      .eq('qr_slug', qrSlug)
      .single()

    if (facilityError || !facility) {
      return NextResponse.json({ error: '施設が見つかりません' }, { status: 404 })
    }

    // 予約レコードを作成（オーナーの user_id を使用）
    const { data: newBooking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        facility_id:  facility.id,
        user_id:      facility.user_id,
        guest_name:   basic.full_name,
        guest_email:  basic.email,
        checkin_date:  booking.checkin_date,
        checkout_date: booking.checkout_date,
        num_guests:    booking.num_guests || 1,
        status:       'pre_checkin_done',
      })
      .select('id, guest_qr_token')
      .single()

    if (bookingError || !newBooking) {
      return NextResponse.json({ error: bookingError?.message ?? '予約の作成に失敗しました' }, { status: 500 })
    }

    // パスポート画像アップロード
    let passport_image_path: string | null = null
    if (passportFile && basic.is_foreign) {
      const arrayBuffer = await passportFile.arrayBuffer()
      const ext = passportFile.name.split('.').pop() ?? 'jpg'
      const path = `${newBooking.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(path, Buffer.from(arrayBuffer), { contentType: passportFile.type, upsert: true })
      if (!uploadError) passport_image_path = path
    }

    // 顔写真アップロード
    let face_photo_path: string | null = null
    if (faceFile) {
      const arrayBuffer = await faceFile.arrayBuffer()
      const ext = faceFile.name.split('.').pop() ?? 'jpg'
      const path = `${newBooking.id}/face_${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('passport-images')
        .upload(path, Buffer.from(arrayBuffer), { contentType: faceFile.type, upsert: true })
      if (!uploadError) face_photo_path = path
    }

    // IPアドレス取得
    const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'

    // guest_records に保存
    const { data: guestRecord, error: recordError } = await supabase
      .from('guest_records')
      .insert({
        booking_id:           newBooking.id,
        facility_id:          facility.id,
        full_name:            basic.full_name,
        email:                basic.email,
        phone:                basic.phone || null,
        address:              basic.address || null,
        age:                  basic.age ?? null,
        nationality:          basic.is_foreign ? passport.nationality : (basic.nationality || null),
        num_guests:           booking.num_guests || 1,
        is_foreign:           basic.is_foreign,
        passport_number:      basic.is_foreign ? passport.passport_number : null,
        passport_image_path,
        face_photo_path,
        checkin_time:         booking.checkin_time || null,
        checkout_time:        booking.checkout_time || null,
        previous_location:    booking.previous_location || null,
        next_destination:     booking.next_destination || null,
        terms_agreed_at:      new Date().toISOString(),
        terms_ip_address:     ip,
      })
      .select('id')
      .single()

    if (recordError || !guestRecord) {
      return NextResponse.json({ error: recordError?.message ?? 'ゲスト情報の保存に失敗しました' }, { status: 500 })
    }

    return NextResponse.json({ success: true, guest_record_id: guestRecord.id })
  } catch (e) {
    console.error('[/api/register] error:', e)
    return NextResponse.json({ error: 'サーバーエラーが発生しました' }, { status: 500 })
  }
}
