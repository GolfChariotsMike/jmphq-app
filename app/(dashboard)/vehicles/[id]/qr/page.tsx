'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Printer, Download } from 'lucide-react'
import QRDisplay from '@/components/vehicles/QRDisplay'

export default function VehicleQRPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [vehicle, setVehicle] = useState<any>(null)
  const [org, setOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profile } = await supabase.from('users').select('org_id').eq('id', user.id).single()
      if (!profile?.org_id) { router.push('/onboarding'); return }

      const [{ data: vehicleData }, { data: orgData }] = await Promise.all([
        supabase.from('vehicles').select('*').eq('id', id).single(),
        supabase.from('organisations').select('name, logo_url, primary_color').eq('id', profile.org_id).single(),
      ])

      if (!vehicleData) { router.push('/vehicles'); return }
      setVehicle(vehicleData)
      setOrg(orgData)
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
  const vehicleLabel = `${vehicle.make} ${vehicle.model}`

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = async () => {
    // Use html2canvas to capture the sticker as a PNG
    const { default: html2canvas } = await import('html2canvas')
    const el = document.getElementById('qr-sticker')
    if (!el) return
    const canvas = await html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true })
    const link = document.createElement('a')
    link.download = `qr-sticker-${vehicle.registration || vehicle.id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <>
      {/* Print styles */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #qr-sticker, #qr-sticker * { visibility: visible !important; }
          #qr-sticker {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <div className="max-w-lg">
        <Link href="/vehicles" className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
          style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={16} /> Back to vehicles
        </Link>

        <div className="rounded-2xl p-8" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h1 className="text-xl font-bold mb-1">{vehicleLabel}</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            {vehicle.registration} · Download or print this sticker and attach inside the vehicle.
          </p>

          <div className="flex justify-center mb-8">
            <QRDisplay
              value={qrUrl}
              vehicleLabel={vehicleLabel}
              registration={vehicle.registration}
              logoUrl={org?.logo_url}
              primaryColor={org?.primary_color}
            />
          </div>

          <div className="rounded-xl p-3 mb-6 text-xs font-mono break-all"
            style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
            {qrUrl}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="btn-primary flex items-center justify-center gap-2" onClick={handleDownload}>
              <Download size={16} /> Download PNG
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
              <Printer size={16} /> Print
            </button>
          </div>

          <p className="text-xs text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            PNG downloads at 3× resolution — sharp on any printer or vinyl cutter.
          </p>
        </div>
      </div>
    </>
  )
}
