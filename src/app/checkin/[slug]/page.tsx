import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckinFlow } from './checkin-flow'

export default async function FacilityCheckinPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: facility } = await supabase
    .from('facilities')
    .select('id, name, address, checkin_instructions, emergency_contact')
    .eq('qr_slug', slug)
    .single()

  if (!facility) notFound()

  return <CheckinFlow facility={facility} />
}
