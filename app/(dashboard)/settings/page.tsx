import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrgSettings from './OrgSettings'
import ChecklistSettings from './ChecklistSettings'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('org_id, role, organisations(*)')
    .eq('id', user.id)
    .single()

  if (!profile?.org_id) redirect('/onboarding')

  const { data: checklistItems } = await supabase
    .from('checklist_config')
    .select('id, item_key, label, is_blocking, is_active, sort_order')
    .eq('org_id', profile.org_id)
    .order('sort_order')

  const org = profile.organisations as any

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <OrgSettings org={org} orgId={profile.org_id} userId={user.id} />

      <ChecklistSettings items={checklistItems || []} orgId={profile.org_id} />

      {/* Notifications placeholder */}
      <div className="card mt-6">
        <h2 className="text-lg font-bold mb-1">Notifications</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>SMS notifications via Twilio — coming soon</p>
        <div className="p-4 rounded-xl text-sm text-center" style={{ background: 'var(--surface-2)', color: 'var(--text-dim)' }}>
          🔔 SMS alerts for journey events will be available in the next update.
        </div>
      </div>
    </div>
  )
}
