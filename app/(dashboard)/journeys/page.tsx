import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Clock, CheckCircle, XCircle, Play, MapPin } from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: '#9a9a9a', icon: Clock },
  pending_approval: { label: 'Pending', color: '#F59E0B', icon: Clock },
  approved: { label: 'Approved', color: '#22c55e', icon: CheckCircle },
  in_progress: { label: 'In Progress', color: '#FF6B2B', icon: Play },
  completed: { label: 'Completed', color: '#a855f7', icon: CheckCircle },
  rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle },
}

export default async function JourneysPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('org_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const sp = await searchParams
  const statusFilter = sp?.status

  let query = supabase
    .from('journeys')
    .select('id, purpose, outbound_from, outbound_to, outbound_depart_at, status, journey_type, created_at, vehicles(make, model, registration)')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter)
  }

  const { data: journeys } = await query

  const allStatuses = ['all', 'draft', 'pending_approval', 'approved', 'in_progress', 'completed']

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Journeys</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {journeys?.length ?? 0} journey{(journeys?.length ?? 0) !== 1 ? 's' : ''} found
          </p>
        </div>
        <Link href="/journeys/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New journey
        </Link>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 flex-wrap mb-6">
        {allStatuses.map(s => {
          const active = (statusFilter || 'all') === s
          const cfg = s !== 'all' ? STATUS_CONFIG[s] : null
          return (
            <Link
              key={s}
              href={`/journeys${s !== 'all' ? `?status=${s}` : ''}`}
              className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: active ? 'var(--accent)' : 'var(--surface)',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                color: active ? '#fff' : 'var(--text-muted)',
              }}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label ?? s}
            </Link>
          )
        })}
      </div>

      {/* Journey list */}
      {!journeys || journeys.length === 0 ? (
        <div className="card text-center py-12">
          <MapPin size={40} className="mx-auto mb-3" style={{ color: 'var(--text-dim)' }} />
          <p className="font-medium mb-1">No journeys yet</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Create your first journey to get started.</p>
          <Link href="/journeys/new" className="btn-primary">New journey</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((j: any) => {
            const cfg = STATUS_CONFIG[j.status] || { label: j.status, color: '#9a9a9a', icon: Clock }
            const Icon = cfg.icon
            return (
              <Link
                key={j.id}
                href={`/journeys/${j.id}`}
                className="flex items-center gap-4 p-4 rounded-2xl border transition-all hover:border-white/20"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', display: 'flex' }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cfg.color}20` }}>
                  <Icon size={18} style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{j.purpose || 'Untitled journey'}</p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    {j.outbound_from && j.outbound_to ? `${j.outbound_from} → ${j.outbound_to}` : 'Route not set'}
                    {(j.vehicles as any)?.registration ? ` · ${(j.vehicles as any).registration}` : ''}
                  </p>
                  {j.outbound_depart_at && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      {new Date(j.outbound_depart_at).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                </div>
                <div className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: `${cfg.color}20`, color: cfg.color }}>
                  {cfg.label}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
