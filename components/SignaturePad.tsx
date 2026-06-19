'use client'

import { useRef, useEffect, useState } from 'react'

interface SignaturePadProps {
  onSave: (dataUrl: string) => void
  label?: string
}

export default function SignaturePad({ onSave, label = 'Sign here' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.strokeStyle = '#FF6B2B'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  function getPos(e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    setDrawing(true)
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    e.preventDefault()
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!drawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const pos = getPos(e.nativeEvent as MouseEvent | TouchEvent, canvas)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    setSigned(true)
    e.preventDefault()
  }

  function endDraw() {
    setDrawing(false)
    if (signed && canvasRef.current) {
      onSave(canvasRef.current.toDataURL('image/png'))
    }
  }

  function clear() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSigned(false)
    onSave('')
  }

  return (
    <div>
      {label && <label className="label">{label}</label>}
      <div style={{ border: '1px solid var(--border-bright)', borderRadius: 12, overflow: 'hidden', background: 'var(--surface-2)' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={150}
          style={{ width: '100%', height: 150, touchAction: 'none', cursor: 'crosshair', display: 'block' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <div className="flex justify-between mt-2">
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {signed ? '✓ Signature captured' : 'Draw your signature above'}
        </span>
        <button type="button" onClick={clear} className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Clear
        </button>
      </div>
    </div>
  )
}
