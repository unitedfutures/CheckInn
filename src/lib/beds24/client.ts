const BEDS24_BASE_URL = 'https://beds24.com/api/v2'

export async function beds24Fetch(path: string, apiKey: string, options?: RequestInit) {
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
  firstNight: string
  lastNight: string
  status: string
}

export async function getBookings(
  propertyId: string,
  dateFrom: string,
  dateTo: string,
  apiKey: string
): Promise<Beds24Booking[]> {
  const data = await beds24Fetch(
    `/getbookings?propId=${propertyId}&firstNight=${dateFrom}&lastNight=${dateTo}&includeInvoice=false`,
    apiKey
  )
  return data.bookings ?? []
}
