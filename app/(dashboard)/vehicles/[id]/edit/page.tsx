'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Car, ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function EditVehiclePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [pageLoading, setPageLoading] = useState(true)
  const [form, setForm] = useState({
    make: '', model: '', registration: '', colour: '', year: '', vehicle_type: 'owned',
  })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data } = await supabase.from('vehicles').select('*').eq('id', id).single()
      if (!data) { router.push('/vehicles'); return }
      setForm({
        make: data.make || '',
        model: data.model || '',
        registration: data.registration || '',
        colour: data.colour || '',
        year: data.year ? String(data.year) : '',
        vehicle_type: data.vehicle_type || 'owned',
      })
      setPageLoading(false)
    }
    load()
  }, [id])

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.make || !form.model || !form.registration) {
      setError('Make, model and registration are required')
      return
    }
    setLoading(true)
    setError('')

    const { error: err } = await supabase
      .from('vehicles')
      .update({
        make: form.make.trim(),
        model: form.model.trim(),
        registration: form.registration.trim().toUpperCase(),
        colour: form.colour.trim() || null,
        year: form.year ? parseInt(form.year) : null,
        vehicle_type: form.vehicle_type,
      })
      .eq('id', id)

    if (err) { setError(err.message); setLoading(false); return }
    router.push('/vehicles')
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const { error: err } = await supabase.from('vehicles').delete().eq('id', id)
    if (err) { setError(err.message); setDeleting(false); return }
    router.push('/vehicles')
  }

  if (pageLoading) return (
    <div className="space-y-4 max-w-xl animate-pulse">
      <div className="h-8 w-48 rounded-xl" style={{ background: 'var(--surface)' }} />
      <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  )

  return (
    <div className="max-w-xl">
      <Link href="/vehicles" className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to vehicles
      </Link>

      <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.2)' }}>
          <Car size={24} style={{ color: 'var(--accent)' }} />
        </div>
        <h1 className="text-2xl font-bold mb-1">Edit vehicle</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          Update vehicle details. The QR code URL stays the same — no need to reprint.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Make *</label>
              <input className="input" placeholder="Toyota" value={form.make} onChange={e => set('make', e.target.value)} />
            </div>
            <div>
              <label className="label">Model *</label>
              <input className="input" placeholder="LandCruiser" value={form.model} onChange={e => set('model', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Registration *</label>
              <input className="input uppercase" placeholder="1ABC234" value={form.registration}
                onChange={e => set('registration', e.target.value)} />
            </div>
            <div>
              <label className="label">Colour</label>
              <input className="input" placeholder="White" value={form.colour} onChange={e => set('colour', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Year</label>
              <input className="input" type="number" placeholder="2022" min="1990" max="2030"
                value={form.year} onChange={e => set('year', e.target.value)} />
            </div>
            <div>
              <label className="label">Vehicle type</label>
              <select className="input" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                <option value="owned">Company owned</option>
                <option value="leased">Leased</option>
                <option value="hired">Hired</option>
              </select>
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        {/* Delete */}
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl transition-all w-full justify-center"
            style={{
              background: confirmDelete ? 'rgba(239,68,68,0.15)' : 'var(--surface-2)',
              color: confirmDelete ? '#ef4444' : 'var(--text-muted)',
              border: confirmDelete ? '1px solid rgba(239,68,68,0.3)' : '1px solid transparent',
            }}
          >
            <Trash2 size={14} />
            {deleting ? 'Deleting…' : confirmDelete ? 'Tap again to confirm delete' : 'Delete vehicle'}
          </button>
          {confirmDelete && (
            <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>
              This will remove the vehicle and its QR code. Existing journey records are kept.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
