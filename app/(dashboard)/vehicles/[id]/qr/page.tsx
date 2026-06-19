'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer } from 'lucide-react'
import QRDisplay from '@/components/vehicles/QRDisplay'

export default function VehicleQRPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [vehicle, setVehicle] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase.from('vehicles').select('*').eq('id', id).single()
      if (!data) { router.push('/vehicles'); return }
      setVehicle(data)
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</div>
    </div>
  )

  const qrUrl = `${window.location.origin}/scan/${vehicle.id}`

  return (
    <div className="max-w-lg">
      <Link href="/vehicles" className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to vehicles
      </Link>

      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-bold mb-1">{vehicle.make} {vehicle.model}</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          {vehicle.registration} · Print and attach inside the vehicle.
        </p>

        <div className="flex justify-center mb-8">
          <QRDisplay value={qrUrl} vehicleLabel={`${vehicle.make} ${vehicle.model} — ${vehicle.registration}`} />
        </div>

        <div className="rounded-xl p-3 mb-6 text-xs font-mono break-all"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
          {qrUrl}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary flex items-center justify-center gap-2"
            onClick={() => window.print()}>
            <Printer size={16} /> Print sticker
          </button>
          <Link href="/vehicles" className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
            Done
          </Link>
        </div>
      </div>
    </div>
  )
}
