'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Upload, Building2, Globe } from 'lucide-react'

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    orgName: '',
    country: 'AU',
    industry: '',
  })

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setLogoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!form.orgName.trim()) { setError('Organisation name is required'); return }
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Upload logo if provided
    let logoUrl: string | null = null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `orgs/${user.id}/logo.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(path, logoFile, { upsert: true })
      if (!uploadError) {
        const { data } = supabase.storage.from('logos').getPublicUrl(path)
        logoUrl = data.publicUrl
      }
    }

    // Create org
    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 14)

    const { data: org, error: orgError } = await supabase
      .from('organisations')
      .insert({
        name: form.orgName.trim(),
        country: form.country,
        industry: form.industry || null,
        logo_url: logoUrl,
        trial_ends_at: trialEnds.toISOString(),
        subscription_status: 'trial',
      })
      .select()
      .single()

    if (orgError) { setError(orgError.message); setLoading(false); return }

    // Create user profile
    await supabase.from('users').upsert({
      id: user.id,
      org_id: org.id,
      phone: user.phone,
      role: 'admin',
    })

    router.push('/dashboard')
  }

  return (
    <div className="card">
      <div className="flex gap-2 mb-8">
        {[1, 2].map(s => (
          <div
            key={s}
            className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{ background: s <= step ? 'var(--accent)' : 'var(--border-bright)' }}
          />
        ))}
      </div>

      {step === 1 && (
        <>
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.2)' }}>
              <Building2 size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-1">Set up your organisation</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              This is how your team will see JMPHQ.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Organisation name *</label>
              <input
                className="input"
                placeholder="Acme Resources Pty Ltd"
                value={form.orgName}
                onChange={e => setForm({ ...form, orgName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Industry</label>
              <select
                className="input"
                value={form.industry}
                onChange={e => setForm({ ...form, industry: e.target.value })}
              >
                <option value="">Select industry</option>
                <option value="mining">Mining & Resources</option>
                <option value="construction">Construction</option>
                <option value="oil_gas">Oil & Gas</option>
                <option value="utilities">Utilities</option>
                <option value="transport">Transport & Logistics</option>
                <option value="agriculture">Agriculture</option>
                <option value="government">Government</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="label">Country</label>
              <select
                className="input"
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
              >
                <option value="AU">Australia</option>
                <option value="NZ">New Zealand</option>
              </select>
            </div>
            {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
            <button
              className="btn-primary w-full"
              onClick={() => { if (!form.orgName.trim()) { setError('Required'); return }; setError(''); setStep(2) }}
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <div className="mb-6">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.2)' }}>
              <Globe size={24} style={{ color: 'var(--accent)' }} />
            </div>
            <h1 className="text-2xl font-bold mb-1">Add your logo</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Your logo appears on the dashboard and PDF reports. You can skip this and add it later.
            </p>
          </div>

          <div className="space-y-4">
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            <button
              className="w-full rounded-2xl border-2 border-dashed p-8 flex flex-col items-center gap-3 transition-colors"
              style={{ borderColor: logoPreview ? 'var(--accent)' : 'var(--border-bright)', color: 'var(--text-muted)' }}
              onClick={() => fileRef.current?.click()}
            >
              {logoPreview ? (
                <img src={logoPreview} alt="Logo preview" className="h-20 object-contain" />
              ) : (
                <>
                  <Upload size={28} />
                  <span className="text-sm font-medium">Click to upload logo</span>
                  <span className="text-xs">PNG, JPG, SVG up to 5MB</span>
                </>
              )}
            </button>

            {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}

            <button className="btn-primary w-full" onClick={handleSubmit} disabled={loading}>
              {loading ? 'Setting up…' : "Let's go →"}
            </button>
            <button
              className="w-full text-sm text-center"
              style={{ color: 'var(--text-muted)' }}
              onClick={handleSubmit}
              disabled={loading}
            >
              Skip for now
            </button>
          </div>
        </>
      )}
    </div>
  )
}
