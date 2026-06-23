import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendApprovalResult } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { journeyId, status, notes } = await req.json()
  if (!journeyId || !status) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const supabase = await createClient()

  const { data: journey } = await supabase
    .from('journeys')
    .select('purpose, driver:driver_id(name, email)')
    .eq('id', journeyId)
    .single()

  if (!journey) return NextResponse.json({ error: 'Journey not found' }, { status: 404 })

  const driver = journey.driver as any
  if (!driver?.email) return NextResponse.json({ ok: true, note: 'Driver has no email' })

  await sendApprovalResult({
    to: driver.email,
    driverName: driver.name,
    purpose: journey.purpose,
    status,
    notes,
    journeyId,
  })

  return NextResponse.json({ ok: true })
}
