import { NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'
import { getRpID, getOrigin } from '@/lib/passkey/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { credential, facility_id }: { credential: AuthenticationResponseJSON; facility_id: string } =
      await request.json()

    if (!credential || !facility_id) {
      return NextResponse.json({ error: '必須パラメータが不足しています' }, { status: 400 })
    }

    // チャレンジを取得
    const { data: challengeRecord, error: challengeError } = await supabase
      .from('passkey_challenges')
      .select('id, challenge')
      .eq('type', 'authentication')
      .eq('facility_id', facility_id)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (challengeError || !challengeRecord) {
      return NextResponse.json({ error: 'チャレンジが見つからないか期限切れです' }, { status: 400 })
    }

    // credential.id からゲスト情報を取得
    const { data: guestRecord, error: guestError } = await supabase
      .from('guest_records')
      .select('id, booking_id, passkey_credential_id, passkey_public_key, passkey_counter')
      .eq('passkey_credential_id', credential.id)
      .single()

    if (guestError || !guestRecord) {
      return NextResponse.json({ error: '登録されたパスキーが見つかりません' }, { status: 404 })
    }

    if (!guestRecord.passkey_public_key) {
      return NextResponse.json({ error: 'パスキーの公開鍵が見つかりません' }, { status: 400 })
    }

    // base64 から Uint8Array に変換
    const credentialPublicKey = Buffer.from(guestRecord.passkey_public_key, 'base64')

    // 認証レスポンスを検証
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challengeRecord.challenge,
      expectedOrigin: getOrigin(),
      expectedRPID: getRpID(),
      credential: {
        id: guestRecord.passkey_credential_id,
        publicKey: credentialPublicKey,
        counter: guestRecord.passkey_counter ?? 0,
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'パスキーの認証に失敗しました' }, { status: 400 })
    }

    // カウンターを更新
    await supabase
      .from('guest_records')
      .update({ passkey_counter: verification.authenticationInfo.newCounter })
      .eq('id', guestRecord.id)

    // 予約情報を取得して検証
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, checkin_date, checkout_date, facility_id, status')
      .eq('id', guestRecord.booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: '予約情報が見つかりません' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    if (booking.facility_id !== facility_id) {
      return NextResponse.json({ error: 'この施設の予約ではありません' }, { status: 400 })
    }

    if (booking.checkin_date > today) {
      return NextResponse.json({
        error: `チェックイン日（${booking.checkin_date}）より前のため入室できません。`
      }, { status: 400 })
    }

    if (booking.checkout_date < today) {
      return NextResponse.json({ error: 'チェックアウト日を過ぎています。' }, { status: 400 })
    }

    if (booking.status !== 'pre_checkin_done') {
      if (booking.status === 'checked_in') {
        // すでにチェックイン済みの場合は既存PINを返す
        const { data: code } = await supabase
          .from('access_codes')
          .select('pin_code')
          .eq('booking_id', booking.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (code) return NextResponse.json({ pin_code: (code as { pin_code: string }).pin_code })
      }
      return NextResponse.json({ error: '事前登録が完了していません。' }, { status: 400 })
    }

    // PINコードを生成
    const pin_code = Math.floor(1000 + Math.random() * 9000).toString()

    const now = new Date().toISOString()
    const checkoutDate = new Date(booking.checkout_date)
    checkoutDate.setHours(23, 59, 59)

    // access_codes に保存
    await supabase.from('access_codes').insert({
      booking_id: booking.id,
      facility_id,
      pin_code,
      valid_from: now,
      valid_until: checkoutDate.toISOString(),
    })

    // guest_records の checked_in_at を更新
    await supabase
      .from('guest_records')
      .update({ checked_in_at: now })
      .eq('id', guestRecord.id)

    // bookings の status を checked_in に更新
    await supabase
      .from('bookings')
      .update({ status: 'checked_in', updated_at: now })
      .eq('id', booking.id)

    // チャレンジを削除
    await supabase.from('passkey_challenges').delete().eq('id', challengeRecord.id)

    return NextResponse.json({ pin_code })
  } catch (e) {
    console.error('auth-verify error:', e)
    return NextResponse.json({ error: 'パスキー認証に失敗しました' }, { status: 500 })
  }
}
