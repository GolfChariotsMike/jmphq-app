import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, Shield, Car, User } from 'lucide-react'

const ROLE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  admin:      { label: 'Admin',      color: '#FF6B2B', bg: 'rgba(255,107,43,0.1)' },
  supervisor: { label: 'Supervisor', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  driver:     { label: 'Driver',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
}

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: staff } = await supabase
    .from('users')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)
    .order('full_name', { ascending: true })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {staff?.length ?? 0} team member{staff?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/staff/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add staff
        </Link>
      </div>

      {!staff?.length ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--surface)', border: '2px dashed var(--border-bright)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)' }}>
            <Users size={28} style={{ color: 'var(--green)' }} />
          </div>
          <div>
            <div className="font-semibold mb-1">No staff yet</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Add drivers and supervisors to your team.
            </p>
          </div>
          <Link href="/staff/new" className="btn-primary">Add staff member</Link>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Phone</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Role</th>
                <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Next of Kin</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {staff.map((s, i) => {
                const role = ROLE_STYLES[s.role] ?? ROLE_STYLES.driver
                return (
                  <tr key={s.id}
                    style={{
                      background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg)',
                      borderBottom: '1px solid var(--border)'
                    }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: role.bg, color: role.color }}>
                          {s.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium">{s.full_name || <span style={{ color: 'var(--text-dim)' }}>Unnamed</span>}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{s.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full"
                        style={{ color: role.color, background: role.bg }}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {s.next_of_kin_name || '—'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/staff/${s.id}/edit`}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        Edit
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
