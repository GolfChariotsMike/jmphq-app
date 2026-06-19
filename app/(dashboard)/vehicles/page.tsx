import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, Car, QrCode, MoreVertical } from 'lucide-react'

const STATUS_STYLES: Record<string, { label: string; color: string; bg: string }> = {
  available:   { label: 'Available',   color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
  in_progress: { label: 'In Progress', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)' },
  maintenance: { label: 'Maintenance', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
}

export default async function VehiclesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
  if (!profile?.org_id) redirect('/onboarding')

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .eq('org_id', profile.org_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicles</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {vehicles?.length ?? 0} vehicle{vehicles?.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Link href="/vehicles/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add vehicle
        </Link>
      </div>

      {!vehicles?.length ? (
        <div className="rounded-2xl p-12 flex flex-col items-center gap-4 text-center"
          style={{ background: 'var(--surface)', border: '2px dashed var(--border-bright)' }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(255,107,43,0.1)' }}>
            <Car size={28} style={{ color: 'var(--accent)' }} />
          </div>
          <div>
            <div className="font-semibold mb-1">No vehicles yet</div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Add your first vehicle to generate a QR sticker.
            </p>
          </div>
          <Link href="/vehicles/new" className="btn-primary">Add vehicle</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map(v => {
            const s = STATUS_STYLES[v.status] ?? STATUS_STYLES.available
            return (
              <div key={v.id} className="rounded-2xl p-5 group"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(255,107,43,0.1)' }}>
                    <Car size={20} style={{ color: 'var(--accent)' }} />
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full"
                    style={{ color: s.color, background: s.bg }}>
                    {s.label}
                  </span>
                </div>
                <div className="font-bold text-lg mb-0.5">{v.make} {v.model}</div>
                <div className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
                  {v.registration} {v.colour && `· ${v.colour}`} {v.year && `· ${v.year}`}
                </div>
                <div className="text-xs mb-4 capitalize" style={{ color: 'var(--text-dim)' }}>
                  {v.vehicle_type}
                </div>
                <div className="flex gap-2">
                  <Link href={`/vehicles/${v.id}/qr`}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: 'var(--surface-2)', color: 'var(--accent)' }}>
                    <QrCode size={13} /> View QR
                  </Link>
                  <Link href={`/vehicles/${v.id}/edit`}
                    className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    Edit
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
