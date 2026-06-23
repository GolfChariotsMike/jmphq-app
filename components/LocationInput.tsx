'use client'
import { useEffect, useRef, useState } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

declare global {
  interface Window { google: any; __gmapsLoading?: boolean; __gmapsLoaded?: boolean }
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  return new Promise((resolve) => {
    if (window.__gmapsLoaded) { resolve(); return }
    if (window.__gmapsLoading) {
      const iv = setInterval(() => {
        if (window.__gmapsLoaded) { clearInterval(iv); resolve() }
      }, 100)
      return
    }
    window.__gmapsLoading = true
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=__gmapsInit`
    script.async = true
    ;(window as any).__gmapsInit = () => {
      window.__gmapsLoaded = true
      resolve()
    }
    document.head.appendChild(script)
  })
}

export default function LocationInput({ value, onChange, placeholder, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const acRef = useRef<any>(null)
  const [inputVal, setInputVal] = useState(value)
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''

  // Sync external value changes (e.g. edit mode pre-fill)
  useEffect(() => {
    setInputVal(value)
  }, [value])

  useEffect(() => {
    if (!apiKey || !inputRef.current) return
    loadGoogleMaps(apiKey).then(() => {
      if (!inputRef.current || acRef.current) return
      acRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['geocode'],
        componentRestrictions: { country: ['au', 'nz'] },
      })
      acRef.current.addListener('place_changed', () => {
        const place = acRef.current.getPlace()
        const addr = place.formatted_address || place.name || ''
        setInputVal(addr)
        onChange(addr)
      })
    })
  }, [apiKey])

  return (
    <input
      ref={inputRef}
      className={className || 'input'}
      placeholder={placeholder}
      value={inputVal}
      onChange={e => {
        setInputVal(e.target.value)
        onChange(e.target.value)
      }}
      autoComplete="off"
    />
  )
}
