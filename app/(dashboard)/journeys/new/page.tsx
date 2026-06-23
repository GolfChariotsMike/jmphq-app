'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SignaturePad from '@/components/SignaturePad'
import LocationInput from '@/components/LocationInput'
import { useDirections } from '@/lib/useDirections'
import { ChevronRight, ChevronLeft, Plus, Trash2, AlertTriangle } from 'lucide-react'

const STEPS = [
  'Basic Info',
  'Route Planning',
  'Passengers',
  'Checkpoints',
  'Pre-Journey Checklist',
  'Fatigue & Submit',
]

interface Vehicle { id: string; registration: string; make: string; model: string }
interface StaffMember { id: string; name: string; phone: string }
interface ChecklistItem { id: string; item_key: string; label: string; is_blocking: boolean; is_active: boolean }
interface Passenger {
  full_name: string; phone: string; next_of_kin_name: string; next_of_kin_phone: string; signature: string
}
interface Checkpoint {
  name: string; expected_at: string; leg: 'outbound' | 'return'
}

export default function NewJourneyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [orgId, setOrgId] = useState('')
  const [userId, setUserId] = useState('')
  const [orgCountry, setOrgCountry] = useState('AU')
  const [trialExpired, setTrialExpired] = useState(false)
  const searchParams = useSearchParams()
  const editId = searchParams.get('edit')
  const isEditMode = !!editId
  const [journeyId, setJourneyId] = useState<string | null>(editId || null)

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [checklists, setChecklists] = useState<ChecklistItem[]>([])

  const [purpose, setPurpose] = useState('')
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [radioChannel, setRadioChannel] = useState('')
  const [journeyType, setJourneyType] = useState<'single' | 'lead_convoy'>('single')

  const [outFrom, setOutFrom] = useState('')
  const [outTo, setOutTo] = useState('')
  const [outDepart, setOutDepart] = useState('')
  const [outArrive, setOutArrive] = useState('')
  const [oneWay, setOneWay] = useState(true)
  const [retFrom, setRetFrom] = useState('')
  const [retTo, setRetTo] = useState('')
  const [retDepart, setRetDepart] = useState('')
  const [retArrive, setRetArrive] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [directionsInfo, setDirectionsInfo] = useState<{ durationText: string } | null>(null)
  const [showMapModal, setShowMapModal] = useState(false)

  const handleDirectionsResult = useCallback((result: any) => {
    if (!result) return
    setDistanceKm(result.distanceKm.toString())
    setDirectionsInfo({ durationText: result.durationText })
    // Auto-fill arrival time if departure is set
    if (outDepart) {
      const depart = new Date(outDepart)
      depart.setSeconds(depart.getSeconds() + result.durationSeconds)
      setOutArrive(depart.toISOString().slice(0, 16))
    }
  }, [outDepart])

  useDirections(outFrom, outTo, handleDirectionsResult)

  const [passengers, setPassengers] = useState<Passenger[]>([
    { full_name: '', phone: '', next_of_kin_name: '', next_of_kin_phone: '', signature: '' }
  ])

  const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([])

  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, { response: boolean | null; notes: string }>>({})

  const [fatigueAck, setFatigueAck] = useState(false)
  const [driverSignature, setDriverSignature] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      const { data: profile } = await supabase
        .from('users')
        .select('org_id, organisations(country, trial_ends_at, subscription_status)')
        .eq('id', user.id)
        .single()

      if (!profile?.org_id) { router.push('/onboarding'); return }
      setOrgId(profile.org_id)
      setDriverId(user.id)

      const org = profile.organisations as any
      if (org?.country) setOrgCountry(org.country)

      if (org?.subscription_status === 'trial' && org?.trial_ends_at) {
        setTrialExpired(new Date(org.trial_ends_at) < new Date())
      }

      const { data: vs } = await supabase
        .from('vehicles')
        .select('id, registration, make, model')
        .eq('org_id', profile.org_id)
        .eq('status', 'available')
      setVehicles(vs || [])

      const { data: ss } = await supabase
        .from('users')
        .select('id, name, phone')
        .eq('org_id', profile.org_id)
      setStaff(ss || [])

      const { data: cl } = await supabase
        .from('checklist_config')
        .select('id, item_key, label, is_blocking, is_active')
        .eq('org_id', profile.org_id)
        .eq('is_active', true)
        .order('sort_order')
      setChecklists(cl || [])

      const initial: Record<string, { response: boolean | null; notes: string }> = {}
      ;(cl || []).forEach((item: ChecklistItem) => {
        initial[item.id] = { response: null, notes: '' }
      })
      setChecklistAnswers(initial)

      // Edit mode — pre-load existing journey data
      if (editId) {
        const { data: j } = await supabase.from('journeys').select('*').eq('id', editId).single()
        if (j) {
          setPurpose(j.purpose || '')
          setVehicleId(j.vehicle_id || '')
          setDriverId(j.driver_id || user.id)
          setRadioChannel(j.radio_channel || '')
          setJourneyType(j.journey_type || 'single')
          setOutFrom(j.outbound_from || '')
          setOutTo(j.outbound_to || '')
          setOutDepart(j.outbound_depart_at ? j.outbound_depart_at.slice(0, 16) : '')
          setOutArrive(j.outbound_arrive_at ? j.outbound_arrive_at.slice(0, 16) : '')
          setOneWay(j.is_one_way ?? true)
          setRetFrom(j.return_from || '')
          setRetTo(j.return_to || '')
          setRetDepart(j.return_depart_at ? j.return_depart_at.slice(0, 16) : '')
          setRetArrive(j.return_arrive_at ? j.return_arrive_at.slice(0, 16) : '')
          setDistanceKm(j.route_distance_km?.toString() || '')
        }
        const { data: cps } = await supabase.from('checkpoints').select('*').eq('journey_id', editId).order('sort_order')
        if (cps?.length) setCheckpoints(cps.map((cp: any) => ({ name: cp.name, expected_at: cp.expected_at?.slice(0, 16) || '', leg: cp.leg })))
        const { data: pax } = await supabase.from('journey_passengers').select('*').eq('journey_id', editId)
        if (pax?.length) setPassengers(pax.map((p: any) => ({ full_name: p.full_name, phone: p.phone || '', next_of_kin_name: p.next_of_kin_name || '', next_of_kin_phone: p.next_of_kin_phone || '', signature: p.signature_url || '' })))
      }
    }
    load()
  }, [])

  async function saveDraft() {
    if (!orgId) return
    const payload = {
      org_id: orgId,
      created_by: userId,
      driver_id: driverId || userId,
      vehicle_id: vehicleId || null,
      purpose,
      radio_channel: radioChannel,
      journey_type: journeyType,
      outbound_from: outFrom,
      outbound_to: outTo,
      outbound_depart_at: outDepart || null,
      outbound_arrive_at: outArrive || null,
      is_one_way: oneWay,
      return_from: oneWay ? null : retFrom,
      return_to: oneWay ? null : retTo,
      return_depart_at: oneWay ? null : retDepart || null,
      return_arrive_at: oneWay ? null : retArrive || null,
      route_distance_km: distanceKm ? parseFloat(distanceKm) : null,
      status: 'draft',
    }

    if (journeyId) {
      await supabase.from('journeys').update(payload).eq('id', journeyId)
    } else {
      const { data } = await supabase.from('journeys').insert(payload).select('id').single()
      if (data) setJourneyId(data.id)
    }
  }

  async function handleSubmit() {
    if (trialExpired) {
      setError('Your trial has expired. Please upgrade to continue.')
      return
    }
    if (!driverSignature) { setError('Driver signature is required'); return }
    if (!fatigueAck) { setError('Please acknowledge the fatigue declaration'); return }

    setLoading(true)
    setError('')
    try {
      await saveDraft()

      const jid = journeyId
      if (!jid) { setError('Could not save journey'); setLoading(false); return }

      // Save passengers
      const passData = passengers
        .filter(p => p.full_name)
        .map(p => ({
          journey_id: jid,
          full_name: p.full_name,
          phone: p.phone,
          next_of_kin_name: p.next_of_kin_name,
          next_of_kin_phone: p.next_of_kin_phone,
          signature_url: p.signature || null,
        }))
      if (passData.length > 0) {
        await supabase.from('journey_passengers').delete().eq('journey_id', jid)
        await supabase.from('journey_passengers').insert(passData)
      }

      // Save checkpoints
      const cpData = checkpoints
        .filter(cp => cp.name)
        .map((cp, i) => ({
          journey_id: jid,
          name: cp.name,
          expected_at: cp.expected_at || null,
          leg: cp.leg,
          sort_order: i,
        }))
      if (cpData.length > 0) {
        await supabase.from('checkpoints').delete().eq('journey_id', jid)
        await supabase.from('checkpoints').insert(cpData)
      }

      // Save checklist responses — use item_key from checklist_config
      const clData = Object.entries(checklistAnswers)
        .filter(([, v]) => v.response !== null)
        .map(([configId, v]) => {
          const configItem = checklists.find(c => c.id === configId)
          return {
            journey_id: jid,
            item_key: configItem?.item_key || configId,
            response: v.response,
            notes: v.notes || null,
          }
        })
      if (clData.length > 0) {
        await supabase.from('journey_checklists').delete().eq('journey_id', jid)
        await supabase.from('journey_checklists').insert(clData)
      }

      // Upload driver signature
      if (driverSignature) {
        const blob = await (await fetch(driverSignature)).blob()
        const path = `driver-${jid}-${Date.now()}.png`
        const { error: upErr } = await supabase.storage.from('signatures').upload(path, blob, { contentType: 'image/png', upsert: true })
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(path)
          await supabase.from('journeys').update({
            driver_signature_url: urlData?.publicUrl || null,
            fatigue_acknowledged: true,
            status: 'pending_approval',
            submitted_at: new Date().toISOString(),
          }).eq('id', jid)
        } else {
          await supabase.from('journeys').update({
            fatigue_acknowledged: true,
            status: 'pending_approval',
            submitted_at: new Date().toISOString(),
          }).eq('id', jid)
        }
      }

      // Log event
      await supabase.from('journey_events').insert({
        journey_id: jid,
        event_type: 'submitted',
        user_id: userId,
      })

      router.push('/journeys')
    } catch (e: any) {
      setError(e.message || 'Something went wrong')
    }
    setLoading(false)
  }

  async function goNext() {
    if (step < STEPS.length - 1) {
      await saveDraft()
      setStep(s => s + 1)
    }
  }

  function addPassenger() {
    if (passengers.length >= 5) return
    setPassengers(p => [...p, { full_name: '', phone: '', next_of_kin_name: '', next_of_kin_phone: '', signature: '' }])
  }

  function removePassenger(i: number) {
    setPassengers(p => p.filter((_, idx) => idx !== i))
  }

  function updatePassenger(i: number, field: keyof Passenger, value: string) {
    setPassengers(p => p.map((pass, idx) => idx === i ? { ...pass, [field]: value } : pass))
  }

  function addCheckpoint() {
    setCheckpoints(c => [...c, { name: '', expected_at: '', leg: 'outbound' }])
  }

  function removeCheckpoint(i: number) {
    setCheckpoints(c => c.filter((_, idx) => idx !== i))
  }

  function updateCheckpoint(i: number, field: keyof Checkpoint, value: string) {
    setCheckpoints(c => c.map((cp, idx) => idx === i ? { ...cp, [field]: value } : cp))
  }

  const fatigueText = orgCountry === 'NZ'
    ? 'I declare I have taken a minimum 30-minute break every 5.5 hours of driving and am fit to drive.'
    : 'I declare I have taken a minimum 20-minute break every 5 hours of driving and am fit to drive.'

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{isEditMode ? 'Edit Journey' : 'New Journey'}</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      <div className="flex gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex-1 h-1 rounded-full" style={{
            background: i <= step ? 'var(--accent)' : 'var(--border-bright)'
          }} />
        ))}
      </div>

      <div className="card space-y-5">
        {step === 0 && (
          <>
            <div>
              <label className="label">Purpose of journey *</label>
              <input className="input" placeholder="e.g. Site inspection at Karratha" value={purpose} onChange={e => setPurpose(e.target.value)} />
            </div>
            <div>
              <label className="label">Vehicle *</label>
              <select className="input" value={vehicleId} onChange={e => setVehicleId(e.target.value)}>
                <option value="">Select vehicle…</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>{v.make} {v.model} ({v.registration})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Driver</label>
              <select className="input" value={driverId} onChange={e => setDriverId(e.target.value)}>
                <option value="">Select driver…</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name || s.phone}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Radio channel</label>
              <input className="input" placeholder="e.g. Ch 40 UHF" value={radioChannel} onChange={e => setRadioChannel(e.target.value)} />
            </div>
            <div>
              <label className="label">Journey type</label>
              <div className="flex gap-3">
                {(['single', 'lead_convoy'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setJourneyType(t)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all"
                    style={{
                      background: journeyType === t ? 'var(--accent)' : 'var(--surface-2)',
                      borderColor: journeyType === t ? 'var(--accent)' : 'var(--border)',
                      color: journeyType === t ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {t === 'single' ? 'Single vehicle' : 'Lead convoy'}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm font-semibold mb-3">Outbound leg</p>
              <div className="space-y-3">
                <div>
                  <label className="label">From</label>
                  <LocationInput value={outFrom} onChange={setOutFrom} placeholder="e.g. Perth CBD, WA" />
                </div>
                <div>
                  <label className="label">To</label>
                  <LocationInput value={outTo} onChange={setOutTo} placeholder="e.g. Karratha, WA" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Departure</label>
                    <input className="input" type="datetime-local" value={outDepart} onChange={e => setOutDepart(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Expected arrival</label>
                    <input className="input" type="datetime-local" value={outArrive} onChange={e => setOutArrive(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 py-1">
              <label className="label mb-0">One-way journey</label>
              <div
                onClick={() => setOneWay(v => !v)}
                className="w-11 h-6 rounded-full cursor-pointer transition-all relative"
                style={{ background: oneWay ? 'var(--accent)' : 'var(--border-bright)' }}
              >
                <div className="absolute w-4 h-4 bg-white rounded-full top-1 transition-all"
                  style={{ left: oneWay ? 'calc(100% - 20px)' : '4px' }} />
              </div>
            </div>

            {!oneWay && (
              <div className="space-y-3">
                <p className="text-sm font-semibold">Return leg</p>
                <div>
                  <label className="label">From</label>
                  <LocationInput value={retFrom} onChange={setRetFrom} placeholder="e.g. Karratha, WA" />
                </div>
                <div>
                  <label className="label">To</label>
                  <LocationInput value={retTo} onChange={setRetTo} placeholder="e.g. Perth CBD, WA" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Departure</label>
                    <input className="input" type="datetime-local" value={retDepart} onChange={e => setRetDepart(e.target.value)} />
                  </div>
                  <div>
                    <label className="label">Expected arrival</label>
                    <input className="input" type="datetime-local" value={retArrive} onChange={e => setRetArrive(e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {directionsInfo && (
              <>
                <button
                  type="button"
                  onClick={() => setShowMapModal(true)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-left transition-all hover:opacity-80"
                  style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.2)', color: 'var(--accent)', cursor: 'pointer' }}
                >
                  🗺️ Route calculated: <strong>{distanceKm} km</strong> · est. <strong>{directionsInfo.durationText}</strong>
                  <span className="ml-auto text-xs opacity-60">tap to view map ↗</span>
                </button>

                {showMapModal && (
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
                    onClick={() => setShowMapModal(false)}
                  >
                    <div
                      style={{ background: 'var(--surface)', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 700, boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 600, fontSize: 15 }}>🗺️ {outFrom} → {outTo}</span>
                        <button type="button" onClick={() => setShowMapModal(false)} style={{ color: 'var(--text-muted)', fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                      <iframe
                        src={`https://maps.google.com/maps?saddr=${encodeURIComponent(outFrom)}&daddr=${encodeURIComponent(outTo)}&output=embed`}
                        width="100%"
                        height="420"
                        style={{ border: 'none', display: 'block' }}
                        loading="lazy"
                      />
                      <div style={{ padding: '10px 16px', fontSize: 13, color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{distanceKm} km · {directionsInfo.durationText}</span>
                        <a href={`https://maps.google.com/maps?saddr=${encodeURIComponent(outFrom)}&daddr=${encodeURIComponent(outTo)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>Open in Google Maps ↗</a>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div>
              <label className="label">Distance (km)</label>
              <input className="input" type="number" placeholder="Auto-filled from route" value={distanceKm} onChange={e => setDistanceKm(e.target.value)} />
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                <a href={`https://maps.google.com/maps?saddr=${encodeURIComponent(outFrom)}&daddr=${encodeURIComponent(outTo)}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>View on Google Maps ↗</a>
              </p>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Passengers ({passengers.length}/5)</p>
              {passengers.length < 5 && (
                <button type="button" onClick={addPassenger} className="flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
                  <Plus size={14} /> Add
                </button>
              )}
            </div>

            {passengers.map((p, i) => (
              <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Passenger {i + 1}</span>
                  {passengers.length > 1 && (
                    <button type="button" onClick={() => removePassenger(i)}>
                      <Trash2 size={14} style={{ color: 'var(--red)' }} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Full name *</label>
                    <input className="input" value={p.full_name} onChange={e => updatePassenger(i, 'full_name', e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" value={p.phone} onChange={e => updatePassenger(i, 'phone', e.target.value)} placeholder="0400 000 000" />
                  </div>
                  <div>
                    <label className="label">Next of kin</label>
                    <input className="input" value={p.next_of_kin_name} onChange={e => updatePassenger(i, 'next_of_kin_name', e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="label">NOK phone</label>
                    <input className="input" value={p.next_of_kin_phone} onChange={e => updatePassenger(i, 'next_of_kin_phone', e.target.value)} placeholder="0400 000 000" />
                  </div>
                </div>
                <SignaturePad
                  label={`${p.full_name || `Passenger ${i + 1}`} signature`}
                  onSave={(sig) => updatePassenger(i, 'signature', sig)}
                />
              </div>
            ))}
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Checkpoints</p>
              <button type="button" onClick={addCheckpoint} className="flex items-center gap-1 text-sm" style={{ color: 'var(--accent)' }}>
                <Plus size={14} /> Add
              </button>
            </div>

            {checkpoints.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No checkpoints added. Add towns or stops along the route.</p>
            )}

            {checkpoints.map((cp, i) => (
              <div key={i} className="p-4 rounded-xl space-y-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stop {i + 1}</span>
                  <button type="button" onClick={() => removeCheckpoint(i)}>
                    <Trash2 size={14} style={{ color: 'var(--red)' }} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Location *</label>
                    <input className="input" value={cp.name} onChange={e => updateCheckpoint(i, 'name', e.target.value)} placeholder="e.g. Newman, WA" />
                  </div>
                  <div>
                    <label className="label">Expected time</label>
                    <input className="input" type="datetime-local" value={cp.expected_at} onChange={e => updateCheckpoint(i, 'expected_at', e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Leg</label>
                  <div className="flex gap-2">
                    {(['outbound', 'return'] as const).map(leg => (
                      <button
                        key={leg}
                        type="button"
                        onClick={() => updateCheckpoint(i, 'leg', leg)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                        style={{
                          background: cp.leg === leg ? 'var(--accent)' : 'transparent',
                          borderColor: cp.leg === leg ? 'var(--accent)' : 'var(--border)',
                          color: cp.leg === leg ? '#fff' : 'var(--text-muted)',
                        }}
                      >
                        {leg.charAt(0).toUpperCase() + leg.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {step === 4 && (
          <>
            {checklists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No checklist items configured.</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Go to Settings → Checklist to add items.</p>
              </div>
            ) : (
              checklists.map(item => {
                const ans = checklistAnswers[item.id] || { response: null, notes: '' }
                return (
                  <div key={item.id} className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        {item.is_blocking && (
                          <span className="inline-flex items-center gap-1 text-xs mt-1" style={{ color: 'var(--red)' }}>
                            <AlertTriangle size={11} /> Blocking item
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {[true, false].map(val => (
                          <button
                            key={String(val)}
                            type="button"
                            onClick={() => setChecklistAnswers(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], response: val }
                            }))}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                            style={{
                              background: ans.response === val ? (val ? 'var(--green)' : 'var(--red)') : 'transparent',
                              borderColor: ans.response === val ? (val ? 'var(--green)' : 'var(--red)') : 'var(--border)',
                              color: ans.response === val ? '#fff' : 'var(--text-muted)',
                            }}
                          >
                            {val ? 'Yes' : 'No'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {ans.response === false && (
                      <div>
                        {item.is_blocking && (
                          <div className="mb-2 p-2 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' }}>
                            ⚠️ This item must be resolved before the journey can proceed.
                          </div>
                        )}
                        <label className="label">Notes (required) *</label>
                        <textarea
                          className="input"
                          rows={2}
                          placeholder="Explain the issue..."
                          value={ans.notes}
                          onChange={e => setChecklistAnswers(prev => ({
                            ...prev,
                            [item.id]: { ...prev[item.id], notes: e.target.value }
                          }))}
                        />
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </>
        )}

        {step === 5 && (
          <>
            {trialExpired && (
              <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p className="font-semibold mb-1" style={{ color: 'var(--red)' }}>Trial expired</p>
                <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>Your free trial has ended. Choose a plan to continue submitting journeys.</p>
                <a href="/settings/billing" className="btn-primary text-sm">View plans</a>
              </div>
            )}

            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <p className="text-sm font-semibold mb-2">Fatigue Declaration</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{fatigueText}</p>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fatigueAck}
                  onChange={e => setFatigueAck(e.target.checked)}
                  className="mt-0.5"
                  style={{ accentColor: 'var(--accent)' }}
                />
                <span className="text-sm">I acknowledge and declare the above is true</span>
              </label>
            </div>

            <SignaturePad label="Driver signature *" onSave={setDriverSignature} />

            {error && (
              <p className="text-sm p-3 rounded-xl" style={{ color: 'var(--red)', background: 'rgba(239,68,68,0.1)' }}>{error}</p>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <button
          type="button"
          onClick={() => step === 0 ? router.push('/journeys') : setStep(s => s - 1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
          style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
        >
          <ChevronLeft size={16} />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < STEPS.length - 1 ? (
          <button type="button" onClick={goNext} className="btn-primary flex items-center gap-2">
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || trialExpired}
            className="btn-primary"
          >
            {loading ? 'Saving…' : isEditMode ? 'Save & submit for approval' : 'Submit for approval'}
          </button>
        )}
      </div>
    </div>
  )
}
