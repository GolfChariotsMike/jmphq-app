'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell } from 'lucide-react'

const ALL_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'driver', label: 'Driver' },
]

export default function NotificationSettings({ orgId, notifyRoles: initial }: { orgId: string; notifyRoles: string[] }) {
  const supabase = createClient()
  const [roles, setRoles] = useState<string[]>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggle(role: string) {
    setRoles(r => r.includes(role) ? r.filter(x => x !== role) : [...r, role])
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('organisations').update({ approval_notify_roles: roles }).eq('id', orgId)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="card mt-6">
      <div className="flex items-center gap-2 mb-1">
        <Bell size={18} style={{ color: 'var(--accent)' }} />
        <h2 className="text-lg font-bold">Approval Notifications</h2>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        Which roles receive an email when a journey is submitted for approval?
      </p>

      <div className="space-y-2 mb-5">
        {ALL_ROLES.map(r => (
          <label key={r.value} className="flex items-center justify-between p-3 rounded-xl cursor-pointer"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div>
              <p className="text-sm font-medium">{r.label}</p>
              {r.value === 'driver' && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Not recommended — drivers submit journeys, not approve them</p>
              )}
              {(r.value === 'admin' || r.value === 'manager') && (
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Recommended</p>
              )}
            </div>
            <input
              type="checkbox"
              checked={roles.includes(r.value)}
              onChange={() => toggle(r.value)}
              style={{ accentColor: 'var(--accent)', width: 18, height: 18 }}
            />
          </label>
        ))}
      </div>

      <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
        Staff must have an email address set on their profile to receive notifications.
      </p>

      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save'}
      </button>
    </div>
  )
}
