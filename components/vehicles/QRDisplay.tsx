'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'

interface QRDisplayProps {
  value: string
  vehicleLabel: string
  registration?: string
  logoUrl?: string | null
  primaryColor?: string | null
}

export default function QRDisplay({ value, vehicleLabel, registration, logoUrl, primaryColor }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const accent = primaryColor || '#FF6B2B'

  useEffect(() => {
    import('qrcode').then(QRCode => {
      const canvas = canvasRef.current
      if (!canvas) return
      QRCode.toCanvas(canvas, value, {
        width: 260,
        margin: 1,
        color: { dark: '#111111', light: '#FFFFFF' },
      })
    })
  }, [value])

  return (
    <div
      id="qr-sticker"
      className="inline-flex flex-col items-center rounded-2xl overflow-hidden"
      style={{
        background: '#FFFFFF',
        width: 300,
        border: `3px solid ${accent}`,
        fontFamily: 'Inter, system-ui, sans-serif',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
      }}
    >
      {/* Header band */}
      <div
        className="w-full flex items-center justify-center"
        style={{ background: accent, minHeight: 64, padding: '12px 16px' }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="Organisation logo"
            style={{ maxHeight: 44, maxWidth: 220, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        ) : (
          <span
            className="font-black tracking-tight text-lg"
            style={{ color: '#fff', letterSpacing: '-0.02em' }}
          >
            JMPHQ
          </span>
        )}
      </div>

      {/* QR code */}
      <div className="flex flex-col items-center" style={{ padding: '20px 20px 8px' }}>
        <canvas ref={canvasRef} style={{ borderRadius: 8 }} />
      </div>

      {/* Vehicle info */}
      <div className="text-center" style={{ padding: '4px 16px 4px', color: '#333' }}>
        <div className="font-bold text-sm">{vehicleLabel}</div>
        {registration && (
          <div className="text-xs mt-0.5" style={{ color: '#888', fontWeight: 600, letterSpacing: '0.06em' }}>
            {registration}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div
        className="w-full flex items-center justify-center"
        style={{ background: accent, padding: '10px 16px', marginTop: 12 }}
      >
        <span
          className="font-black text-sm tracking-wide uppercase"
          style={{ color: '#fff', letterSpacing: '0.08em' }}
        >
          Scan to start your Journey
        </span>
      </div>
    </div>
  )
}
