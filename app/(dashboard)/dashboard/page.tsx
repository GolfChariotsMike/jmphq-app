import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TrialBanner from '@/components/dashboard/TrialBanner'
import EmptyState from '@/components/dashboard/EmptyState'
import { Clock, Play, Car, Users, MapPin, AlertCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('org_id, role, organisations(name, logo_url, trial_ends_at, subscription_status)')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const org = profile.organisations as any
  const orgId = profile.org_id

  const [
    { count: vehicleCount },
    { count: staffCount },
    { count: journeyCount },
    { data: pendingJourneys },
    { data: activeJourneys },
    { data: recentJourneys },
  ] = await Promise.all([
    supabase.from('vehicles').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('users').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('journeys').select('*', { count: 'exact', head: true }).eq('org_id', orgId),
    supabase.from('journeys').select('id, purpose, outbound_from, outbound_to, outbound_depart_at, vehicles(make, model, registration)')
      .eq('org_id', orgId).eq('status', 'pending_approval').order('created_at', { ascending: false }),
    supabase.from('journeys').select('id, purpose, outbound_from, outbound_to, started_at, vehicles(make, model, registration)')
      .eq('org_id', orgId).eq('status', 'in_progress').order('started_at', { ascending: false }),
    supabase.from('journeys').select('id, purpose, status, outbound_from, outbound_to, created_at')
      .eq('org_id', orgId).order('created_at', { ascending: false }).limit(5),
  ])

  const isEmpty = !vehicleCount && !staffCount

  const trialEnds = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
  const trialDaysLeft = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000))
    : null
  const isOnTrial = org?.subscription_status === 'trial' && trialDaysLeft !== null && trialDaysLeft > 0

  const STATUS_COLORS: Record<string, string> = {
    draft: '#9a9a9a',
    pending_approval: '#F59E0B',
    approved: '#22c55e',
    in_progress: '#FF6B2B',
    completed: '#a855f7',
    rejected: '#ef4444',
  }
  const STATUS_LABELS: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending',
    approved: 'Approved',
    in_progress: 'In Progress',
    completed: 'Completed',
    rejected: 'Rejected',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {isOnTrial && <TrialBanner daysLeft={trialDaysLeft!} />}

      <div>
        <h1 className="text-2xl font-bold">
          {isEmpty ? `Welcome to JMPHQ` : `Dashboard`}
        </h1>
        <p style={{ color: 'var(--text-muted)' }} className="text-sm mt-1">
          {isEmpty ? `Let's get ${org?.name || 'your organisation'} set up.` : org?.name}
        </p>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Vehicles', value: vehicleCount ?? 0, color: 'var(--accent)', icon: Car },
              { label: 'Staff', value: staffCount ?? 0, color: '#22c55e', icon: Users },
              { label: 'Total Journeys', value: journeyCount ?? 0, color: '#F59E0B', icon: MapPin },
              { label: 'Active Today', value: activeJourneys?.length ?? 0, color: '#a855f7', icon: Play },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="rounded-2xl p-4"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${stat.color}20` }}>
                      <Icon size={16} style={{ color: stat.color }} />
                    </div>
                  </div>
                  <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
                </div>
              )
            })}
          </div>

          {/* Pending approval */}
          {pendingJourneys && pendingJourneys.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} style={{ color: '#F59E0B' }} />
                <h2 className="font-semibold text-sm">Pending Approval ({pendingJourneys.length})</h2>
              </div>
              <div className="space-y-2">
                {pendingJourneys.map((j: any) => (
                  <Link key={j.id} href={`/journeys/${j.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-white/20"
                    style={{ background: 'var(--surface)', borderColor: 'rgba(245,158,11,0.3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245,158,11,0.15)' }}>
                      <Clock size={14} style={{ color: '#F59E0B' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{j.purpose}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {j.outbound_from} → {j.outbound_to}
                        {(j.vehicles as any)?.registration ? ` · ${(j.vehicles as any).registration}` : ''}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md font-semibold" style={{ background: 'rgba(245,158,11,0.15)', color: '#F59E0B' }}>
                      Review →
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Active journeys */}
          {activeJourneys && activeJourneys.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                <h2 className="font-semibold text-sm">Active Journeys ({activeJourneys.length})</h2>
              </div>
              <div className="space-y-2">
                {activeJourneys.map((j: any) => (
                  <Link key={j.id} href={`/journeys/${j.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-white/20"
                    style={{ background: 'var(--surface)', borderColor: 'rgba(255,107,43,0.3)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,43,0.15)' }}>
                      <Play size={14} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{j.purpose}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {j.outbound_from} → {j.outbound_to}
                        {(j.vehicles as any)?.registration ? ` · ${(j.vehicles as any).registration}` : ''}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent journeys */}
          {recentJourneys && recentJourneys.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-sm">Recent Journeys</h2>
                <Link href="/journeys" className="text-xs" style={{ color: 'var(--accent)' }}>View all →</Link>
              </div>
              <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                {recentJourneys.map((j: any, i: number) => (
                  <Link key={j.id} href={`/journeys/${j.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
                    style={{ borderBottom: i < recentJourneys.length - 1 ? '1px solid var(--border)' : 'none', display: 'flex' }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{j.purpose || 'Untitled'}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {j.outbound_from && j.outbound_to ? `${j.outbound_from} → ${j.outbound_to}` : '—'}
                      </p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-md font-semibold flex-shrink-0"
                      style={{ background: `${STATUS_COLORS[j.status] || '#9a9a9a'}20`, color: STATUS_COLORS[j.status] || '#9a9a9a' }}>
                      {STATUS_LABELS[j.status] || j.status}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
