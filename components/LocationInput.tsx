'use client'
import { useState, useEffect, useRef } from 'react'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

interface Suggestion { text: string; placeId: string }

export default function LocationInput({ value, onChange, placeholder, className }: Props) {
  const [inputVal, setInputVal] = useState(value)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const timerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setInputVal(value) }, [value])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleChange(val: string) {
    setInputVal(val)
    onChange(val)
    clearTimeout(timerRef.current)
    if (val.length < 2) { setSuggestions([]); setOpen(false); return }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?input=${encodeURIComponent(val)}`)
        const data = await res.json()
        setSuggestions(data.suggestions || [])
        setOpen(data.suggestions?.length > 0)
      } catch { setSuggestions([]); setOpen(false) }
    }, 300)
  }

  function handleSelect(s: Suggestion) {
    setInputVal(s.text)
    onChange(s.text)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <input
        className={className || 'input'}
        placeholder={placeholder}
        value={inputVal}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
          background: 'var(--surface)', border: '1px solid var(--border-bright)',
          borderRadius: 12, marginTop: 4, overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={s.placeId || i}
              onMouseDown={() => handleSelect(s)}
              style={{
                padding: '10px 14px', cursor: 'pointer', fontSize: 14,
                borderBottom: i < suggestions.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              📍 {s.text}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
