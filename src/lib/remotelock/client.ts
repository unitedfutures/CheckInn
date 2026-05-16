const REMOTELOCK_BASE_URL = 'https://api.remotelock.jp/v1'

async function remoteLockFetch(path: string, options?: RequestInit) {
  const token = process.env.REMOTELOCK_ACCESS_TOKEN
  if (!token) throw new Error('REMOTELOCK_ACCESS_TOKEN not set')

  const res = await fetch(`${REMOTELOCK_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`RemoteLOCK API error ${res.status}: ${text}`)
  }

  return res.json()
}

export async function createAccessCode(params: {
  deviceId: string
  name: string
  pin: string
  startsAt: string   // ISO8601
  endsAt: string
}) {
  return remoteLockFetch(`/devices/${params.deviceId}/access_persons`, {
    method: 'POST',
    body: JSON.stringify({
      access_person: {
        type: 'access_code',
        name: params.name,
        pin: params.pin,
        starts_at: params.startsAt,
        ends_at: params.endsAt,
      },
    }),
  })
}

export async function deleteAccessCode(deviceId: string, accessPersonId: string) {
  return remoteLockFetch(`/devices/${deviceId}/access_persons/${accessPersonId}`, {
    method: 'DELETE',
  })
}
