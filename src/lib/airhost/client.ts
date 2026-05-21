/**
 * Airhost Connect API クライアント
 * API仕様: https://api-connect.airhost.co/api/v1/
 *
 * ※ Airhostの実際のAPIキーと物件IDはダッシュボード > 設定 > 外部連携から設定してください。
 */

const AIRHOST_BASE_URL = 'https://api-connect.airhost.co/api/v1'

async function airhostFetch(path: string, apiKey: string) {
  const res = await fetch(`${AIRHOST_BASE_URL}${path}`, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Airhost API error ${res.status}: ${text}`)
  }

  return res.json()
}

export interface AirhostProperty {
  id: string
  name: string
  address?: string
}

export interface AirhostBooking {
  uid: string           // 予約ID
  property_id: string   // 物件ID
  guest_name: string    // ゲスト氏名
  guest_email: string   // ゲストメール
  check_in: string      // チェックイン日 (YYYY-MM-DD)
  check_out: string     // チェックアウト日 (YYYY-MM-DD)
  number_of_guests: number
  status: string        // confirmed / cancelled など
}

export async function getAirhostProperties(apiKey: string): Promise<AirhostProperty[]> {
  const data = await airhostFetch('/properties', apiKey)
  return data.properties ?? data ?? []
}

export async function getAirhostBookings(
  propertyId: string,
  dateFrom: string,
  dateTo: string,
  apiKey: string
): Promise<AirhostBooking[]> {
  const params = new URLSearchParams({
    property_id: propertyId,
    check_in_start: dateFrom,
    check_in_end: dateTo,
    status: 'confirmed',
  })
  const data = await airhostFetch(`/bookings?${params}`, apiKey)
  return data.bookings ?? data ?? []
}
