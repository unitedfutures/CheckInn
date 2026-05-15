import { Resend } from 'resend'
import { formatDate } from '@/lib/utils'

const resend = new Resend(process.env.RESEND_API_KEY)
const from = process.env.RESEND_FROM_EMAIL || 'noreply@yokoso.jp'

interface GuestInfoRequestParams {
  to: string
  guestToken: string
  propertyName: string
  checkinDate: string
  checkoutDate: string
  appUrl: string
}

export async function sendGuestInfoRequestEmail(params: GuestInfoRequestParams) {
  const { to, guestToken, propertyName, checkinDate, checkoutDate, appUrl } = params
  const formUrl = `${appUrl}/guest/${guestToken}`

  await resend.emails.send({
    from,
    to,
    subject: `【YOKOSO】${propertyName} ご宿泊の宿泊者情報をご入力ください`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
        <h1 style="color: #4f46e5; font-size: 24px; margin-bottom: 8px;">YOKOSO</h1>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 32px;">セルフチェックインシステム</p>

        <p>このたびは <strong>${propertyName}</strong> へのご予約ありがとうございます。</p>
        <p>チェックインをスムーズに行うため、以下のリンクから宿泊者情報のご入力をお願いします。</p>

        <div style="background: #f9fafb; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px; color: #6b7280;">宿泊期間</p>
          <p style="margin: 4px 0 0; font-size: 16px; font-weight: 600;">
            ${formatDate(checkinDate)} 〜 ${formatDate(checkoutDate)}
          </p>
        </div>

        <a href="${formUrl}" style="display: inline-block; background: #4f46e5; color: white; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 600; font-size: 15px; margin: 8px 0 24px;">
          宿泊者情報を入力する
        </a>

        <p style="font-size: 13px; color: #9ca3af;">
          ※ このリンクはご本人専用です。チェックイン後は無効になります。<br>
          ※ ご不明な点はご予約の宿泊施設までお問い合わせください。
        </p>
      </div>
    `,
  })
}
