import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import EmptyState from '@/components/dashboard/EmptyState'
import TrialBanner from '@/components/dashboard/TrialBanner'

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

  const { count: vehicleCount } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  const { count: staffCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  const { count: journeyCount } = await supabase
    .from('journeys')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', profile.org_id)

  const isEmpty = !vehicleCount && !staffCount

  // Trial days remaining
  const trialEnds = org?.trial_ends_at ? new Date(org.trial_ends_at) : null
  const trialDaysLeft = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / 86400000))
    : null
  const isOnTrial = org?.subscription_status === 'trial' && trialDaysLeft !== null && trialDaysLeft > 0

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
              { label: 'Vehicles', value: vehicleCount ?? 0, color: 'var(--accent)' },
              { label: 'Staff', value: staffCount ?? 0, color: '#22c55e' },
              { label: 'Total Journeys', value: journeyCount ?? 0, color: '#F59E0B' },
              { label: 'Active Today', value: 0, color: '#a855f7' },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl p-4"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="text-3xl font-black mb-1" style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className="text-sm" style={{ color: 'var(--text-muted)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
