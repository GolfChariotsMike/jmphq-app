import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Printer } from 'lucide-react'
import QRDisplay from '@/components/vehicles/QRDisplay'

export default async function VehicleQRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .single()

  if (!vehicle) redirect('/vehicles')

  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.jmphq.com'}/scan/${vehicle.id}`

  return (
    <div className="max-w-lg">
      <Link href="/vehicles" className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--text-muted)' }}>
        <ArrowLeft size={16} /> Back to vehicles
      </Link>

      <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <h1 className="text-2xl font-bold mb-1">{vehicle.make} {vehicle.model}</h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
          {vehicle.registration} · Print this QR and attach it inside the vehicle.
        </p>

        <div className="flex justify-center mb-8">
          <QRDisplay value={qrUrl} vehicleLabel={`${vehicle.make} ${vehicle.model} — ${vehicle.registration}`} />
        </div>

        <div className="rounded-xl p-3 mb-6 text-xs font-mono break-all"
          style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
          {qrUrl}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button className="btn-primary flex items-center justify-center gap-2" onClick={() => window.print()}>
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
