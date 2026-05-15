import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckinFlow } from './checkin-flow'

export default async function CheckinPage({ params }: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = await params
  const supabase = await createClient()

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, address')
    .eq('qr_slug', propertyId)
    .single()

  if (!property) notFound()

  return <CheckinFlow property={property} />
}
