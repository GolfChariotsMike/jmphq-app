'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload } from 'lucide-react'

const COUNTRIES = [
  { code: 'AU', label: 'Australia' },
  { code: 'NZ', label: 'New Zealand' },
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
]

export default function OrgSettings({ org, orgId, userId }: { org: any; orgId: string; userId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(org?.name || '')
  const [country, setCountry] = useState(org?.country || 'AU')
  const [industry, setIndustry] = useState(org?.industry || '')
  const [primaryColor, setPrimaryColor] = useState(org?.primary_color || '#FF6B2B')
  const [logoUrl, setLogoUrl] = useState(org?.logo_url || '')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function uploadLogo(file: File) {
    const ext = file.name.split('.').pop()
    const path = `${orgId}/logo.${ext}`
    const { error: upErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) throw upErr
    const { data } = supabase.storage.from('logos').getPublicUrl(path)
    return data.publicUrl
  }

  async function save() {
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      await supabase.from('organisations').update({
        name,
        country,
        industry,
        primary_color: primaryColor,
        logo_url: logoUrl || null,
      }).eq('id', orgId)

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const url = await uploadLogo(file)
      setLogoUrl(url)
      // Auto-save logo_url immediately
      await supabase.from('organisations').update({ logo_url: url }).eq('id', orgId)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      router.refresh()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="card mb-6">
      <h2 className="text-lg font-bold mb-4">Organisation</h2>

      <div className="space-y-4">
        {/* Logo */}
        <div>
          <label className="label">Logo</label>
          <div className="flex items-center gap-4">
            {logoUrl && (
              <img src={logoUrl} alt="Logo" className="w-16 h-16 rounded-xl object-contain"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} />
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
            >
              <Upload size={14} /> Upload logo
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
        </div>

        <div>
          <label className="label">Organisation name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} />
        </div>

        <div>
          <label className="label">Industry</label>
          <input className="input" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="e.g. Mining, Construction, Transport" />
        </div>

        <div>
          <label className="label">Country</label>
          <select className="input" value={country} onChange={e => setCountry(e.target.value)}>
            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        <div>
          <label className="label">Primary colour</label>
          <div className="flex items-center gap-3">
            <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
              className="w-10 h-10 rounded-lg cursor-pointer border-0" style={{ background: 'none' }} />
            <input className="input" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} style={{ fontFamily: 'monospace' }} />
          </div>
        </div>

        {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
        {success && <p className="text-sm" style={{ color: 'var(--green)' }}>✓ Saved successfully</p>}

        <button onClick={save} disabled={loading} className="btn-primary">
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}
