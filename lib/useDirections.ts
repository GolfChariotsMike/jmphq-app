'use client'
import { useEffect, useRef } from 'react'

interface DirectionsResult {
  distanceKm: number
  durationSeconds: number
  durationText: string
}

type Callback = (result: DirectionsResult | null) => void

declare global {
  interface Window { google: any }
}

export function useDirections(
  origin: string,
  destination: string,
  onResult: Callback
) {
  const timerRef = useRef<any>(null)
  const prevRef = useRef<string>('')

  useEffect(() => {
    const key = `${origin}||${destination}`
    if (!origin || !destination || key === prevRef.current) return

    // Debounce — wait until both fields have real values (not mid-typing)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      prevRef.current = key

      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
      if (!apiKey) return

      try {
        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${apiKey}`
        const res = await fetch(`/api/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status !== 'OK' || !data.routes?.length) { onResult(null); return }
        const leg = data.routes[0].legs[0]
        onResult({
          distanceKm: Math.round(leg.distance.value / 1000),
          durationSeconds: leg.duration.value,
          durationText: leg.duration.text,
        })
      } catch { onResult(null) }
    }, 800)

    return () => clearTimeout(timerRef.current)
  }, [origin, destination])
}
