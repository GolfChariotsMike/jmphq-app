'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, X } from 'lucide-react'

const ROLE_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  admin:      { label: 'Admin',      color: '#FF6B2B', bg: 'rgba(255,107,43,0.1)' },
  supervisor: { label: 'Supervisor', color: '#a855f7', bg: 'rgba(168,85,247,0.1)' },
  driver:     { label: 'Driver',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)'  },
}

interface StaffMember {
  id: string; name: string; phone: string; role: string;
  email: string; next_of_kin_name: string; next_of_kin_phone: string;
  satellite_phone: string;
}

export default function StaffPage() {
  const supabase = createClient()
  const router = useRouter()
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<StaffMember | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
    if (!profile?.org_id) { router.push('/onboarding'); return }
    const { data } = await supabase.from('users').select('*').eq('org_id', profile.org_id).order('name')
    setStaff((data as any[]) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function saveEdit() {
    if (!editing) return
    setSaving(true)
    setSaveError('')
    const { error } = await supabase.from('users').update({
      name: editing.name,
      email: editing.email,
      role: editing.role,
      next_of_kin_name: editing.next_of_kin_name,
      next_of_kin_phone: editing.next_of_kin_phone,
      satellite_phone: editing.satellite_phone,
    }).eq('id', editing.id)
    if (error) { setSaveError(error.message); setSaving(false); return }
    setEditing(null)
    load()
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {staff.length} team member{staff.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/staff/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add staff
        </Link>
      </div>

      {!staff.length ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--surface)', border: '2px dashed var(--border-bright)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.1)' }}>
            <Users size={28} style={{ color: '#22c55e' }} />
          </div>
          <div>
            <div className="font-semibold mb-1">No staff yet</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add drivers and supervisors to your team.</p>
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
                  <tr key={s.id} style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                          style={{ background: role.bg, color: role.color }}>
                          {s.name?.charAt(0)?.toUpperCase() ?? '?'}
                        </div>
                        <span className="font-medium">{s.name || <span style={{ color: 'var(--text-dim)' }}>Unnamed</span>}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{s.phone || '—'}</td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ color: role.color, background: role.bg }}>
                        {role.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>{s.next_of_kin_name || '—'}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => { setEditing({ ...s }); setSaveError('') }}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg transition-all hover:opacity-80"
                        style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                        Edit
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setEditing(null)}>
          <div className="w-full max-w-md rounded-2xl p-6 space-y-4"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold">Edit staff member</h2>
              <button onClick={() => setEditing(null)} style={{ color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {[
              { label: 'Full name', field: 'name', placeholder: 'John Smith' },
              { label: 'Email', field: 'email', placeholder: 'john@company.com' },
              { label: 'Next of kin name', field: 'next_of_kin_name', placeholder: 'Jane Smith' },
              { label: 'Next of kin phone', field: 'next_of_kin_phone', placeholder: '04XX XXX XXX' },
              { label: 'Satellite phone', field: 'satellite_phone', placeholder: 'SPOT / Garmin ID' },
            ].map(({ label, field, placeholder }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input className="input" placeholder={placeholder}
                  value={(editing as any)[field] || ''}
                  onChange={e => setEditing({ ...editing, [field]: e.target.value })} />
              </div>
            ))}

            <div>
              <label className="label">Role</label>
              <select className="input" value={editing.role}
                onChange={e => setEditing({ ...editing, role: e.target.value })}>
                <option value="driver">Driver</option>
                <option value="supervisor">Supervisor</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {saveError && <p className="text-sm" style={{ color: 'var(--red)' }}>{saveError}</p>}

            <div className="flex gap-3 pt-2">
              <button className="btn-primary flex-1" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save changes'}
              </button>
              <button onClick={() => setEditing(null)}
                className="flex-1 rounded-xl px-4 py-3 text-sm font-semibold"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
