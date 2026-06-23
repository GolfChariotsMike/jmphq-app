'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewStaffPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: '',
    name: '',
    phone: '',
    email: '',
    role: 'driver',
    next_of_kin_name: '',
    next_of_kin_phone: '',
    satellite_phone: '',
  })

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.phone) {
      setError('Name and phone number are required')
      return
    }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase
      .from('users').select('org_id').eq('id', user.id).single()

    // Check if a user with this phone already exists in the org
    const formattedPhone = form.phone.startsWith('+') ? form.phone : `+61${form.phone.replace(/^0/, '')}`

    const { error: err } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(), // placeholder — will be replaced when they sign in
        org_id: profile!.org_id,
        full_name: form.full_name.trim(),
        name: form.full_name.trim(),
        phone: formattedPhone,
        email: form.email.trim() || null,
        role: form.role,
        next_of_kin_name: form.next_of_kin_name.trim() || null,
        next_of_kin_phone: form.next_of_kin_phone.trim() || null,
        satellite_phone: form.satellite_phone.trim() || null,
      })

    if (err) { setError(err.message); setLoading(false); return }

    router.push('/staff')
  }

  return (
    <div className="max-w-xl">
      <Link href="/staff" className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to staff
      </Link>

      <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <Users size={24} style={{ color: 'var(--green)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-1">Add staff member</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          They'll receive an SMS invite to set up their account.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name *</label>
              <input className="input" placeholder="Jane Smith" value={form.full_name}
                onChange={e => set('full_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="jane@company.com" value={form.email}
                onChange={e => set('email', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Mobile number *</label>
              <input className="input" type="tel" placeholder="0412 345 678" value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="driver">Driver</option>
                <option value="supervisor">Supervisor</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="rounded-xl p-4 space-y-4" style={{ background: 'var(--surface-2)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              Emergency contacts
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Next of kin name</label>
                <input className="input" placeholder="John Smith" value={form.next_of_kin_name}
                  onChange={e => set('next_of_kin_name', e.target.value)} />
              </div>
              <div>
                <label className="label">Next of kin phone</label>
                <input className="input" type="tel" placeholder="0412 345 678" value={form.next_of_kin_phone}
                  onChange={e => set('next_of_kin_phone', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="label">Satellite phone (if applicable)</label>
              <input className="input" placeholder="+61 8 9999 0000" value={form.satellite_phone}
                onChange={e => set('satellite_phone', e.target.value)} />
            </div>
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Add staff member'}
          </button>
        </form>
      </div>
    </div>
  )
}
