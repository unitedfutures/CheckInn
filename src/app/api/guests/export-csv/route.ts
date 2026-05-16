import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: guests } = await supabase
    .from('guest_records')
    .select('*, bookings(checkin_date, checkout_date, facilities(name))')
    .order('created_at', { ascending: false })

  if (!guests) return NextResponse.json({ error: 'データなし' }, { status: 500 })

  const headers = [
    '施設名', '宿泊者氏名', '住所', '電話番号', 'メール', '宿泊人数',
    'チェックイン日', 'チェックアウト日', '国籍', '旅券番号',
    '規約同意日時', 'チェックイン完了日時', '登録日', '削除予定日'
  ]

  const rows = guests.map(g => {
    const b = g.bookings as unknown as { checkin_date: string; checkout_date: string; facilities: { name: string } }
    return [
      b?.facilities?.name ?? '',
      g.full_name,
      g.address,
      g.phone,
      g.email,
      g.num_guests,
      b?.checkin_date ?? '',
      b?.checkout_date ?? '',
      g.nationality ?? '',
      g.passport_number ?? '',
      g.terms_agreed_at ?? '',
      g.checkin_completed_at ?? '',
      g.created_at.split('T')[0],
      g.delete_after,
    ].map(v => `"${String(v).replace(/"/g, '""')}"`)
  })

  const bom = '﻿'
  const csv = bom + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="guestbook_${new Date().toISOString().split('T')[0]}.csv"`,
    },
  })
}
