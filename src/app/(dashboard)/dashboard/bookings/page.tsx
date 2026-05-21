import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Mail, AlertTriangle, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react'
import { formatDate, getStatusLabel, getStatusVariant } from '@/lib/utils'
import { BookingForm } from './booking-form'
import { ResendEmailButton } from './resend-email-button'

// ─── OTA照合ロジック ──────────────────────────────────────────────────────

type OtaBooking = {
  id: string
  facility_id: string
  ota_source: string
  guest_name: string | null
  guest_email: string | null
  checkin_date: string
  checkout_date: string
  num_guests: number
  facilities: { name: string } | null
}

type GuestRegistration = {
  booking_id: string
  full_name: string
  email: string
  num_guests: number
  booking: {
    facility_id: string
    checkin_date: string
    checkout_date: string
    num_guests: number
  } | null
}

type ValidationResult = {
  status: 'ok' | 'mismatch' | 'unregistered'
  issues: string[]
  registration: GuestRegistration | null
}

function validateOtaBooking(
  ota: OtaBooking,
  registrations: GuestRegistration[]
): ValidationResult {
  // 同じ施設・チェックイン日で照合（1日の誤差を許容）
  const match = registrations.find(r => {
    if (!r.booking) return false
    if (r.booking.facility_id !== ota.facility_id) return false
    const otaDate = new Date(ota.checkin_date).getTime()
    const regDate = new Date(r.booking.checkin_date).getTime()
    return Math.abs(otaDate - regDate) <= 86400000 // 1日以内
  })

  if (!match) {
    return { status: 'unregistered', issues: ['ゲストが事前登録を完了していません'], registration: null }
  }

  const issues: string[] = []

  // 人数チェック
  const otaNum = ota.num_guests
  const regNum = match.booking?.num_guests ?? match.num_guests
  if (otaNum > 0 && regNum > 0 && otaNum !== regNum) {
    issues.push(`人数不一致：OTA ${otaNum}名 / 登録 ${regNum}名`)
  }

  // チェックアウト日チェック
  if (match.booking && ota.checkout_date !== match.booking.checkout_date) {
    issues.push(`チェックアウト日不一致：OTA ${formatDate(ota.checkout_date)} / 登録 ${formatDate(match.booking.checkout_date)}`)
  }

  // メールチェック（OTAにメールがある場合）
  if (ota.guest_email && match.email &&
      ota.guest_email.toLowerCase() !== match.email.toLowerCase()) {
    issues.push(`メールアドレス不一致：OTA ${ota.guest_email} / 登録 ${match.email}`)
  }

  return {
    status: issues.length > 0 ? 'mismatch' : 'ok',
    issues,
    registration: match,
  }
}

// ─── ステータスバッジ ─────────────────────────────────────────────────────

function OtaStatusBadge({ result }: { result: ValidationResult }) {
  if (result.status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
        <CheckCircle2 size={12} /> 照合OK
      </span>
    )
  }
  if (result.status === 'mismatch') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
        <AlertTriangle size={12} /> 不一致
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-full px-2.5 py-1">
      <XCircle size={12} /> 未登録
    </span>
  )
}

// ─── ページ ───────────────────────────────────────────────────────────────

export default async function BookingsPage() {
  const supabase = await createClient()
  const [{ data: bookings }, { data: facilities }] = await Promise.all([
    supabase.from('bookings').select('*, facilities(name)').order('checkin_date', { ascending: false }),
    supabase.from('facilities').select('id, name').order('name'),
  ])

  // OTA予約と自己登録を分離
  const otaBookings = (bookings ?? []).filter(b => b.ota_source != null) as OtaBooking[]
  const selfBookings = (bookings ?? []).filter(b => b.ota_source == null)

  // 今後の照合対象（過去30日〜将来）
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)
  const upcomingOta = otaBookings.filter(b => new Date(b.checkin_date) >= cutoff)

  // ゲスト登録データを取得
  const { data: guestRecords } = await supabase
    .from('guest_records')
    .select('booking_id, full_name, email, num_guests, booking:bookings(facility_id, checkin_date, checkout_date, num_guests)')
    .order('created_at', { ascending: false })

  const registrations = (guestRecords ?? []) as unknown as GuestRegistration[]

  // 照合結果
  const validationMap = new Map<string, ValidationResult>()
  for (const ota of upcomingOta) {
    validationMap.set(ota.id, validateOtaBooking(ota, registrations))
  }

  const alertCount = upcomingOta.filter(b => {
    const r = validationMap.get(b.id)
    return r && r.status !== 'ok'
  }).length

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">予約管理</h2>
          <p className="text-gray-500 text-sm mt-1">予約の登録・事前チェックイン状況の確認</p>
        </div>
        <BookingForm facilities={facilities ?? []} />
      </div>

      {/* ── OTA照合サマリー ── */}
      {upcomingOta.length > 0 && (
        <div className={`rounded-xl border p-4 mb-6 ${
          alertCount > 0
            ? 'bg-amber-50 border-amber-200'
            : 'bg-green-50 border-green-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={16} className={alertCount > 0 ? 'text-amber-600' : 'text-green-600'} />
            <p className={`text-sm font-semibold ${alertCount > 0 ? 'text-amber-800' : 'text-green-800'}`}>
              OTA照合ステータス（直近・今後の予約 {upcomingOta.length}件）
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="flex items-center gap-1.5 text-green-700">
              <CheckCircle2 size={14} />
              照合OK：{upcomingOta.filter(b => validationMap.get(b.id)?.status === 'ok').length}件
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <AlertTriangle size={14} />
              不一致：{upcomingOta.filter(b => validationMap.get(b.id)?.status === 'mismatch').length}件
            </span>
            <span className="flex items-center gap-1.5 text-red-700">
              <XCircle size={14} />
              未登録：{upcomingOta.filter(b => validationMap.get(b.id)?.status === 'unregistered').length}件
            </span>
          </div>
        </div>
      )}

      {/* ── 予約一覧 ── */}
      {bookings && bookings.length > 0 ? (
        <div className="space-y-3">
          {bookings.map((b) => {
            const isOta = b.ota_source != null
            const validation = isOta ? validationMap.get(b.id) : undefined

            return (
              <Card key={b.id} className={`hover:shadow-sm transition-shadow ${
                validation?.status === 'unregistered' ? 'border-red-200' :
                validation?.status === 'mismatch' ? 'border-amber-200' : ''
              }`}>
                <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="hidden sm:flex p-2.5 bg-indigo-50 rounded-xl shrink-0 mt-0.5">
                      <CalendarDays size={18} className="text-indigo-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">
                          {(b.facilities as unknown as { name: string })?.name}
                        </span>
                        {b.ota_source === 'beds24' && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Beds24</span>
                        )}
                        {b.ota_source === 'airhost' && (
                          <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">Airhost</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        {formatDate(b.checkin_date)} 〜 {formatDate(b.checkout_date)}
                        {b.guest_name && ` ／ ${b.guest_name}`}（{b.num_guests}名）
                      </p>
                      {b.guest_email && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-400">
                          <Mail size={11} /> {b.guest_email}
                        </div>
                      )}

                      {/* 照合エラーの詳細 */}
                      {validation && validation.issues.length > 0 && (
                        <ul className="mt-2 space-y-0.5">
                          {validation.issues.map((issue, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded px-2 py-1">
                              <AlertTriangle size={11} className="mt-0.5 shrink-0" />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {validation && <OtaStatusBadge result={validation} />}
                    <Badge variant={getStatusVariant(b.status)}>{getStatusLabel(b.status)}</Badge>
                    {b.guest_email && (b.status === 'pending' || b.status === 'pre_checkin_sent') && (
                      <ResendEmailButton bookingId={b.id} />
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-16 text-gray-400">
          <CalendarDays size={48} className="mx-auto mb-4 opacity-30" />
          <p className="text-sm">予約がありません</p>
          <p className="text-xs mt-1">施設ページからBeds24またはAirhost同期してください</p>
        </div>
      )}
    </div>
  )
}
