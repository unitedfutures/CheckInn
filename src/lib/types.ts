export type BookingStatus =
  | 'pending'          // 予約登録済み・事前チェックイン未送信
  | 'pre_checkin_sent' // 事前チェックインメール送信済み
  | 'pre_checkin_done' // 事前チェックイン入力完了
  | 'checked_in'       // 現地チェックイン完了
  | 'checked_out'      // チェックアウト済み

export interface Facility {
  id: string
  user_id: string
  name: string
  address: string | null
  qr_slug: string
  beds24_property_id: string | null
  remote_lock_device_id: string | null
  emergency_contact: string | null
  checkin_instructions: string | null
  created_at: string
}

export interface Booking {
  id: string
  facility_id: string
  user_id: string
  beds24_booking_id: string | null
  guest_email: string | null
  guest_name: string | null
  checkin_date: string
  checkout_date: string
  num_guests: number
  status: BookingStatus
  pre_checkin_token: string
  guest_qr_token: string
  created_at: string
  facilities?: Facility
}

export interface GuestRecord {
  id: string
  booking_id: string
  facility_id: string
  full_name: string
  address: string
  phone: string
  email: string
  num_guests: number
  is_foreign: boolean
  nationality: string | null
  passport_number: string | null
  passport_image_path: string | null
  face_photo_path: string | null
  terms_agreed_at: string | null
  checkin_qr_scanned_at: string | null
  checkin_completed_at: string | null
  delete_after: string
  created_at: string
  bookings?: Booking
  facilities?: Facility
}

export interface AccessCode {
  id: string
  booking_id: string
  facility_id: string
  code: string
  issued_at: string
  expires_at: string | null
  is_manual: boolean
}
