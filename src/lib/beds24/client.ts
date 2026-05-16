const BEDS24_BASE_URL = 'https://beds24.com/api/v2'

export async function beds24Fetch(path: string, options?: RequestInit) {
  const apiKey = process.env.BEDS24_API_KEY
  if (!apiKey) throw new Error('BEDS24_API_KEY not set')

  const res = await fetch(`${BEDS24_BASE_URL}${path}`, {
    ...options,
    headers: {
      'token': apiKey,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Beds24 API error ${res.status}: ${text}`)
  }

  return res.json()
}

export interface Beds24Booking {
  bookId: string
  propId: string
  roomId: string
  guestFirstName: string
  guestLastName: string
  guestEmail: string
  numAdult: number
  numChild: number
  firstNight: string  // YYYY-MM-DD
  lastNight: string
  status: string
}

export async function getBookings(propertyId: string, dateFrom: string, dateTo: string): Promise<Beds24Booking[]> {
  const data = await beds24Fetch(
    `/getbookings?propId=${propertyId}&firstNight=${dateFrom}&lastNight=${dateTo}&includeInvoice=false`
  )
  return data.bookings ?? []
}
