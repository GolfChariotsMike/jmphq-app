import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendApprovalRequest } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { journeyId } = await req.json()
  if (!journeyId) return NextResponse.json({ error: 'Missing journeyId' }, { status: 400 })

  const supabase = await createClient()

  // Get journey + driver details
  const { data: journey } = await supabase
    .from('journeys')
    .select('*, driver:driver_id(name, email), org:org_id(id, approval_notify_roles)')
    .eq('id', journeyId)
    .single()

  if (!journey) return NextResponse.json({ error: 'Journey not found' }, { status: 404 })

  const org = journey.org as any
  const notifyRoles: string[] = org?.approval_notify_roles || ['admin', 'manager']

  // Get all users in the org with a notify role who have an email
  const { data: approvers } = await supabase
    .from('users')
    .select('name, email')
    .eq('org_id', org.id)
    .in('role', notifyRoles)
    .not('email', 'is', null)

  if (!approvers?.length) return NextResponse.json({ ok: true, note: 'No approvers found' })

  const driver = journey.driver as any
  await Promise.all(approvers.map(a =>
    sendApprovalRequest({
      to: a.email,
      approverName: a.name,
      driverName: driver?.name || 'Unknown driver',
      purpose: journey.purpose,
      from: journey.outbound_from,
      destination: journey.outbound_to,
      departAt: journey.outbound_depart_at,
      journeyId,
    })
  ))

  return NextResponse.json({ ok: true, sent: approvers.length })
}
