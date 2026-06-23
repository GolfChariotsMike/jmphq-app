'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'

interface JourneyPolicy {
  country: 'AU' | 'NZ'
  max_continuous_drive_hours: number
  min_break_minutes: number
  min_consecutive_break_minutes: number
  max_daily_drive_hours: number
  jmp_required_km: number
  jmp_required_unsealed: boolean
  jmp_required_adverse_weather: boolean
  checkin_interval_hours: number
}

const AU_DEFAULTS: Partial<JourneyPolicy> = {
  max_continuous_drive_hours: 5,
  min_break_minutes: 20,
  min_consecutive_break_minutes: 10,
}

const NZ_DEFAULTS: Partial<JourneyPolicy> = {
  max_continuous_drive_hours: 5.5,
  min_break_minutes: 30,
  min_consecutive_break_minutes: 10,
}

export default function PolicySettings({ orgId, policy: initial }: { orgId: string; policy: JourneyPolicy }) {
  const supabase = createClient()
  const [policy, setPolicy] = useState<JourneyPolicy>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function update<K extends keyof JourneyPolicy>(key: K, value: JourneyPolicy[K]) {
    setPolicy(p => ({ ...p, [key]: value }))
    setSaved(false)
  }

  function applyCountryDefaults(country: 'AU' | 'NZ') {
    const defaults = country === 'AU' ? AU_DEFAULTS : NZ_DEFAULTS
    setPolicy(p => ({ ...p, country, ...defaults }))
    setSaved(false)
  }

  async function save() {
    setSaving(true)
    await supabase.from('organisations').update({ journey_policies: policy }).eq('id', orgId)
    setSaving(false)
    setSaved(true)
  }

  return (
    <div className="card mt-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck size={18} style={{ color: 'var(--accent)' }} />
        <h2 className="text-lg font-bold">Journey Policies</h2>
      </div>
      <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
        Fatigue management rules based on SRG Global JMP guidelines. These values drive checkpoint suggestions and journey requirements.
      </p>

      {/* Country selector */}
      <div className="mb-5">
        <label className="label">Operating country</label>
        <div className="flex gap-2">
          {(['AU', 'NZ'] as const).map(c => (
            <button
              key={c}
              type="button"
              onClick={() => applyCountryDefaults(c)}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: policy.country === c ? 'var(--accent)' : 'var(--surface-2)',
                color: policy.country === c ? '#fff' : 'var(--text)',
                border: '1px solid',
                borderColor: policy.country === c ? 'var(--accent)' : 'var(--border)',
              }}
            >
              {c === 'AU' ? '🇦🇺 Australia' : '🇳🇿 New Zealand'}
            </button>
          ))}
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--text-dim)' }}>
          {policy.country === 'AU'
            ? 'AU: ≥20 min break per 5hrs · ≥10 consecutive mins (SRG JMP 1.02)'
            : 'NZ: ≥30 min break per 5.5hrs · ≥10 consecutive mins (SRG JMP 1.02)'}
        </p>
      </div>

      {/* Fatigue rules */}
      <div className="rounded-xl p-4 mb-4 space-y-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>FATIGUE MANAGEMENT</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Max continuous driving (hrs)</label>
            <input className="input" type="number" step="0.5" min="1" max="8"
              value={policy.max_continuous_drive_hours}
              onChange={e => update('max_continuous_drive_hours', parseFloat(e.target.value))} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Checkpoint interval for suggestions</p>
          </div>
          <div>
            <label className="label">Min break duration (mins)</label>
            <input className="input" type="number" step="5" min="10" max="60"
              value={policy.min_break_minutes}
              onChange={e => update('min_break_minutes', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Min consecutive break (mins)</label>
            <input className="input" type="number" step="5" min="10" max="30"
              value={policy.min_consecutive_break_minutes}
              onChange={e => update('min_consecutive_break_minutes', parseInt(e.target.value))} />
          </div>
          <div>
            <label className="label">Max daily driving (hrs)</label>
            <input className="input" type="number" step="0.5" min="4" max="14"
              value={policy.max_daily_drive_hours}
              onChange={e => update('max_daily_drive_hours', parseFloat(e.target.value))} />
          </div>
        </div>
      </div>

      {/* JMP trigger rules */}
      <div className="rounded-xl p-4 mb-4 space-y-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>WHEN JMP IS REQUIRED</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Min distance threshold (km)</label>
            <input className="input" type="number" step="50" min="0"
              value={policy.jmp_required_km}
              onChange={e => update('jmp_required_km', parseInt(e.target.value))} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>JMP required if trip exceeds this</p>
          </div>
        </div>

        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={policy.jmp_required_unsealed}
              onChange={e => update('jmp_required_unsealed', e.target.checked)}
              style={{ accentColor: 'var(--accent)' }} />
            <span className="text-sm">JMP required for unsealed/dirt roads</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={policy.jmp_required_adverse_weather}
              onChange={e => update('jmp_required_adverse_weather', e.target.checked)}
              style={{ accentColor: 'var(--accent)' }} />
            <span className="text-sm">JMP required for adverse weather conditions</span>
          </label>
        </div>
      </div>

      {/* Check-in interval */}
      <div className="rounded-xl p-4 mb-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <p className="text-xs font-semibold tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>CHECK-IN SCHEDULE</p>
        <div>
          <label className="label">Check-in interval (hrs)</label>
          <input className="input" type="number" step="0.5" min="0.5" max="6"
            value={policy.checkin_interval_hours}
            onChange={e => update('checkin_interval_hours', parseFloat(e.target.value))} />
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>How often driver should check in with base. Also used for checkpoint suggestion spacing.</p>
        </div>
      </div>

      <button className="btn-primary" onClick={save} disabled={saving}>
        {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save policies'}
      </button>
    </div>
  )
}
