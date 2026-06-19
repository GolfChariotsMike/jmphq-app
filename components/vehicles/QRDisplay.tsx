'use client'

import { useEffect, useRef } from 'react'

interface QRDisplayProps {
  value: string
  vehicleLabel: string
}

export default function QRDisplay({ value, vehicleLabel }: QRDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Dynamically import qrcode to avoid SSR issues
    import('qrcode').then(QRCode => {
      const canvas = canvasRef.current
      if (!canvas) return
      QRCode.toCanvas(canvas, value, {
        width: 256,
        margin: 2,
        color: { dark: '#111111', light: '#FFFFFF' },
      })
    })
  }, [value])

  return (
    <div className="rounded-2xl p-6 inline-flex flex-col items-center gap-3"
      style={{ background: '#FFFFFF' }}>
      <canvas ref={canvasRef} className="rounded-xl" />
      <div className="text-xs font-bold text-center max-w-[240px]"
        style={{ color: '#111111', fontFamily: 'Inter, sans-serif' }}>
        {vehicleLabel}
      </div>
      <div className="text-xs" style={{ color: '#666', fontFamily: 'Inter, sans-serif' }}>
        Scan to start journey
      </div>
    </div>
  )
}
