'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Car, QrCode } from 'lucide-react'

export default function VehiclesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [vehicles, setVehicles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!profile?.org_id) { router.push('/onboarding'); return }
      const { data } = await supabase.from('vehicles').select('*').eq('org_id', profile.org_id).order('created_at', { ascending: false })
      setVehicles(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="space-y-4 max-w-5xl animate-pulse">
      <div className="h-8 w-48 rounded-xl" style={{ background: 'var(--surface)' }} />
      <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/vehicles/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add vehicle
        </Link>
      </div>

      {!vehicles.length ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--surface)', border: '2px dashed var(--border-bright)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,43,0.1)' }}>
            <Car size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div className="font-semibold mb-1">No vehicles yet</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Add your first vehicle to get started.</p>
          </div>
          <Link href="/vehicles/new" className="btn-primary">Add vehicle</Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {vehicles.map(v => (
            <div key={v.id} className="rounded-2xl p-5 flex items-center justify-between"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,107,43,0.1)' }}>
                  <Car size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div>
                  <div className="font-semibold">{v.make} {v.model}</div>
                  <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {v.registration}{v.colour ? ` · ${v.colour}` : ''}{v.year ? ` · ${v.year}` : ''}
                  </div>
                </div>
              </div>
              <Link href={`/vehicles/${v.id}/qr`}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl transition-all hover:opacity-80"
                style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                <QrCode size={14} /> QR code
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
