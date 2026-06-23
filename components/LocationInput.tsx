'use client'
import { useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

declare global {
  interface Window { google: any; __gmapsLoading?: boolean }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.maps?.places) { resolve(); return }
    if (window.__gmapsLoading) {
      const interval = setInterval(() => {
        if (window.google?.maps?.places) { clearInterval(interval); resolve() }
      }, 100)
      return
    }
    window.__gmapsLoading = true
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.onload = () => resolve()
    document.head.appendChild(script)
  })
}

export default function LocationInput({ value, onChange, placeholder, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const acRef = useRef<any>(null)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''

  useEffect(() => {
    if (!apiKey || !inputRef.current) return
    loadGoogleMaps(apiKey).then(() => {
      if (!inputRef.current || acRef.current) return
      acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
      })
      acRef.current.addListener('place_changed', () => {
        const place = acRef.current.getPlace()
        const addr = place.formatted_address || place.name || ''
        onChange(addr)
      })
    })
  }, [apiKey])

  return (
    <input
      ref={inputRef}
      className={className || 'input'}
      placeholder={placeholder}
      defaultValue={value}
      onChange={e => onChange(e.target.value)}
    />
  )
}
