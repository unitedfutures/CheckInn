import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { facility_id, survey_config } = await request.json()
  if (!facility_id) return NextResponse.json({ error: 'facility_id is required' }, { status: 400 })

  const { error } = await supabase
    .from('facilities')
    .update({ survey_config, updated_at: new Date().toISOString() })
    .eq('id', facility_id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
