import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Navigation } from 'lucide-react'
import JourneyActions from './JourneyActions'
import RepeatJourneyButton from './RepeatJourneyButton'

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Draft', color: '#9a9a9a' },
  pending_approval: { label: 'Pending Approval', color: '#F59E0B' },
  approved: { label: 'Approved', color: '#22c55e' },
  in_progress: { label: 'In Progress', color: '#FF6B2B' },
  completed: { label: 'Completed', color: '#a855f7' },
  rejected: { label: 'Rejected', color: '#ef4444' },
}

const TIMELINE = ['draft', 'pending_approval', 'approved', 'in_progress', 'completed']

export default async function JourneyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const { id } = await params

  const { data: journey } = await supabase
    .from('journeys')
    .select(`
      *,
      vehicles(id, make, model, name, registration),
      driver:driver_id(id, name, phone)
    `)
    .eq('id', id)
    .eq('org_id', profile.org_id)
    .single()

  if (!journey) notFound()

  const { data: passengers } = await supabase
    .from('journey_passengers')
    .select('*')
    .eq('journey_id', id)

  const { data: checkpoints } = await supabase
    .from('checkpoints')
    .select('*')
    .eq('journey_id', id)
    .order('sort_order')

  const { data: checklists } = await supabase
    .from('journey_checklists')
    .select('*')
    .eq('journey_id', id)

  // Get checklist config for labels
  const { data: checklistConfig } = await supabase
    .from('checklist_config')
    .select('item_key, label, is_blocking')
    .eq('org_id', profile.org_id)

  const { data: approvals } = await supabase
    .from('approvals')
    .select('*, approver:approver_id(name)')
    .eq('journey_id', id)
    .order('created_at', { ascending: false })

  const cfg = STATUS_CONFIG[journey.status] || { label: journey.status, color: '#9a9a9a' }
  const isSupervisor = profile.role === 'supervisor' || profile.role === 'admin'
  const currentStep = TIMELINE.indexOf(journey.status)

  const vehicle = journey.vehicles as any
  const driver = journey.driver as any
  // driver uses 'name' column not 'full_name'

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/journeys" className="p-2 rounded-xl hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{journey.purpose || 'Journey Detail'}</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Created {new Date(journey.created_at).toLocaleDateString('en-AU')}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg text-sm font-semibold"
          style={{ background: `${cfg.color}20`, color: cfg.color }}>
          {cfg.label}
        </div>
      </div>

      {/* Status timeline */}
      <div className="card mb-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>STATUS TIMELINE</p>
        <div className="flex items-center gap-0">
          {TIMELINE.map((s, i) => {
            const done = currentStep >= i
            const scfg = STATUS_CONFIG[s]
            return (
              <div key={s} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full border-2"
                    style={{
                      background: done ? cfg.color : 'transparent',
                      borderColor: done ? cfg.color : 'var(--border-bright)',
                    }} />
                  <span className="text-center leading-tight mt-1" style={{ color: done ? 'var(--text)' : 'var(--text-dim)', fontSize: 9 }}>
                    {scfg?.label || s}
                  </span>
                </div>
                {i < TIMELINE.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1"
                    style={{ background: currentStep > i ? cfg.color : 'var(--border)' }} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="card">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>JOURNEY INFO</p>
          <div className="space-y-2 text-sm">
            <Row label="Vehicle" value={vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration})` : '—'} />
            <Row label="Driver" value={driver?.name || '—'} />
            <Row label="Radio" value={journey.radio_channel || '—'} />
            <Row label="Type" value={journey.journey_type === 'lead_convoy' ? 'Lead convoy' : 'Single vehicle'} />
            {journey.route_distance_km && <Row label="Distance" value={`${journey.route_distance_km} km`} />}
            {journey.fatigue_acknowledged && <Row label="Fatigue" value="✓ Acknowledged" />}
          </div>
        </div>

        <div className="card">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>ROUTE</p>
          <div className="space-y-2 text-sm">
            <Row label="From" value={journey.outbound_from || '—'} />
            <Row label="To" value={journey.outbound_to || '—'} />
            {journey.outbound_depart_at && <Row label="Depart" value={new Date(journey.outbound_depart_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })} />}
            {journey.outbound_arrive_at && <Row label="Arrive" value={new Date(journey.outbound_arrive_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })} />}
            {!journey.is_one_way && journey.return_from && (
              <>
                <div className="border-t my-2" style={{ borderColor: 'var(--border)' }} />
                <Row label="Return from" value={journey.return_from || '—'} />
                <Row label="Return to" value={journey.return_to || '—'} />
              </>
            )}
            {journey.outbound_from && journey.outbound_to && (
              <a
                href={`https://maps.google.com/maps?saddr=${encodeURIComponent(journey.outbound_from)}&daddr=${encodeURIComponent(journey.outbound_to)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs flex items-center gap-1"
                style={{ color: 'var(--accent)' }}
              >
                <Navigation size={12} /> View on Google Maps
              </a>
            )}
          </div>
        </div>
      </div>

      {passengers && passengers.length > 0 && (
        <div className="card mb-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>PASSENGERS ({passengers.length})</p>
          <div className="space-y-3">
            {passengers.map((p: any) => (
              <div key={p.id} className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <p className="font-medium text-sm">{p.full_name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {p.phone && `📱 ${p.phone}`}
                  {p.next_of_kin_name && ` · NOK: ${p.next_of_kin_name}${p.next_of_kin_phone ? ` (${p.next_of_kin_phone})` : ''}`}
                </p>
                {p.signature_url && <p className="text-xs mt-1" style={{ color: 'var(--green)' }}>✓ Signed</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {checkpoints && checkpoints.length > 0 && (
        <div className="card mb-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>CHECKPOINTS</p>
          <div className="space-y-2">
            {checkpoints.map((cp: any, i: number) => (
              <div key={cp.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: cp.checked_in_at ? 'var(--green)' : 'var(--border-bright)', color: cp.checked_in_at ? '#fff' : 'var(--text-dim)' }}>
                  {cp.checked_in_at ? '✓' : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{cp.name}</p>
                  {cp.expected_at && (
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      Expected: {new Date(cp.expected_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                  {cp.checked_in_at && (
                    <p className="text-xs" style={{ color: 'var(--green)' }}>
                      Checked in: {new Date(cp.checked_in_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: 'var(--border)', color: 'var(--text-muted)' }}>
                  {cp.leg}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {checklists && checklists.length > 0 && (
        <div className="card mb-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>PRE-JOURNEY CHECKLIST</p>
          <div className="space-y-2">
            {checklists.map((cl: any) => (
              <div key={cl.id} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <span className="text-sm font-bold flex-shrink-0" style={{ color: cl.response ? 'var(--green)' : 'var(--red)' }}>
                  {cl.response ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <p className="text-sm">{(checklistConfig?.find((c: any) => c.item_key === cl.item_key))?.label || cl.item_key}</p>
                  {cl.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Note: {cl.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-4">
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>APPROVAL</p>

        {approvals && approvals.length > 0 ? (
          <div className="space-y-2 mb-4">
            {approvals.map((a: any) => (
              <div key={a.id} className="p-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                <p className="text-sm font-medium" style={{ color: a.status === 'approved' ? 'var(--green)' : 'var(--red)' }}>
                  {a.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  by {(a.approver as any)?.name || 'Unknown'} · {new Date(a.created_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
                {a.notes && <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Note: {a.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            {journey.status === 'pending_approval' ? 'Awaiting supervisor approval.' : 'No approvals yet.'}
          </p>
        )}

        {isSupervisor && journey.status === 'pending_approval' && (
          <JourneyActions journeyId={journey.id} userId={user.id} />
        )}

        {journey.status === 'in_progress' && isSupervisor && (
          <JourneyActions journeyId={journey.id} userId={user.id} status={journey.status} />
        )}
      </div>

      {journey.status === 'completed' && (
        <div className="flex justify-end mt-2">
          <RepeatJourneyButton journey={journey} />
        </div>
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}
