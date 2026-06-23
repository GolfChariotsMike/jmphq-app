'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MapPin, CheckCircle, Clock, Navigation, AlertCircle, Users } from 'lucide-react'
import SignaturePad from '@/components/SignaturePad'

type Scenario = 'loading' | 'phone' | 'no_journey' | 'select_journey' | 'start_journey' | 'confirm_start' | 'in_progress' | 'complete_journey' | 'done'

export default function ScanFlow({ vehicleId }: { vehicleId: string }) {
  const supabase = createClient()
  const [scenario, setScenario] = useState<Scenario>('loading')
  const [phone, setPhone] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [loading, setLoading] = useState(false)
  const [vehicle, setVehicle] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [journeys, setJourneys] = useState<any[]>([])
  const [selectedJourney, setSelectedJourney] = useState<any>(null)
  const [checkpoints, setCheckpoints] = useState<any[]>([])
  const [nextCheckpoint, setNextCheckpoint] = useState<any>(null)
  const [message, setMessage] = useState('')
  const [passengers, setPassengers] = useState<any[]>([])
  const [checklistItems, setChecklistItems] = useState<any[]>([])
  const [checklistAnswers, setChecklistAnswers] = useState<Record<string, boolean>>({})
  const [passengersConfirmed, setPassengersConfirmed] = useState(false)
  const [driverSignature, setDriverSignature] = useState('')

  useEffect(() => {
    async function loadVehicle() {
      const { data: v } = await supabase
        .from('vehicles')
        .select('id, make, model, registration, org_id, status')
        .eq('id', vehicleId)
        .single()

      if (!v) {
        setMessage('Vehicle not found.')
        setScenario('no_journey')
        return
      }
      setVehicle(v)
      setOrgId(v.org_id)
      setScenario('phone')
    }
    loadVehicle()
  }, [vehicleId])

  async function verifyPhone() {
    if (!phone || !orgId) return
    setLoading(true)
    setPhoneError('')

    const formatted = phone.startsWith('+') ? phone : `+61${phone.replace(/^0/, '')}`
    const { data: userRecord } = await supabase
      .from('users')
      .select('id, full_name')
      .eq('phone', formatted)
      .eq('org_id', orgId)
      .single()

    if (!userRecord) {
      // Also try without formatting
      const { data: userRecord2 } = await supabase
        .from('users')
        .select('id, full_name')
        .eq('phone', phone)
        .eq('org_id', orgId)
        .single()

      if (!userRecord2) {
        setPhoneError('Phone number not found in this organisation.')
        setLoading(false)
        return
      }
      setUserId(userRecord2.id)
      await loadJourneys(userRecord2.id)
    } else {
      setUserId(userRecord.id)
      await loadJourneys(userRecord.id)
    }
    setLoading(false)
  }

  async function loadJourneys(uid: string) {
    if (!orgId) return

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Check for in_progress journey on this vehicle
    const { data: inProgress } = await supabase
      .from('journeys')
      .select('*, checkpoints(*)')
      .eq('vehicle_id', vehicleId)
      .eq('status', 'in_progress')
      .single()

    if (inProgress) {
      setSelectedJourney(inProgress)
      const cps = inProgress.checkpoints || []
      setCheckpoints(cps.sort((a: any, b: any) => a.sort_order - b.sort_order))
      const next = cps.find((cp: any) => !cp.checked_in_at)
      setNextCheckpoint(next || null)
      setScenario('in_progress')
      return
    }

    // Look for approved journeys for today
    const { data: approvedJourneys } = await supabase
      .from('journeys')
      .select('*, checkpoints(*)')
      .eq('vehicle_id', vehicleId)
      .eq('org_id', orgId)
      .eq('status', 'approved')
      .gte('outbound_departure', today.toISOString())
      .lt('outbound_departure', tomorrow.toISOString())

    if (!approvedJourneys || approvedJourneys.length === 0) {
      // Also check without date filter (some journeys may not have a departure time)
      const { data: allApproved } = await supabase
        .from('journeys')
        .select('*, checkpoints(*)')
        .eq('vehicle_id', vehicleId)
        .eq('org_id', orgId)
        .eq('status', 'approved')

      if (!allApproved || allApproved.length === 0) {
        setScenario('no_journey')
        return
      }

      if (allApproved.length === 1) {
        setSelectedJourney(allApproved[0])
        await Promise.all([loadPassengers(allApproved[0].id), loadChecklist(v.org_id)])
        setScenario('confirm_start')
      } else {
        setJourneys(allApproved)
        setScenario('select_journey')
      }
      return
    }

    if (approvedJourneys.length === 1) {
      setSelectedJourney(approvedJourneys[0])
      await Promise.all([loadPassengers(approvedJourneys[0].id), loadChecklist(v.org_id)])
      setScenario('confirm_start')
    } else {
      setJourneys(approvedJourneys)
      setScenario('select_journey')
    }
  }

  async function loadChecklist(orgId: string) {
    const { data } = await supabase
      .from('checklist_config')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .order('sort_order')
    setChecklistItems(data || [])
    // pre-set all to false
    const answers: Record<string, boolean> = {}
    ;(data || []).forEach((item: any) => { answers[item.id] = false })
    setChecklistAnswers(answers)
  }

  async function loadPassengers(journeyId: string) {
    const { data } = await supabase.from('journey_passengers').select('*').eq('journey_id', journeyId)
    setPassengers(data || [])
  }

  async function startJourney() {
    if (!selectedJourney || !userId) return
    setLoading(true)
    try {
      await supabase.from('journeys').update({
        status: 'in_progress',
        started_at: new Date().toISOString(),
      }).eq('id', selectedJourney.id)

      await supabase.from('vehicles').update({ status: 'in_progress' }).eq('id', vehicleId)

      // Save driver signature if provided
      if (driverSignature) {
        const blob = await (await fetch(driverSignature)).blob()
        const path = `driver-start-${selectedJourney.id}-${Date.now()}.png`
        await supabase.storage.from('signatures').upload(path, blob, { contentType: 'image/png', upsert: true })
        const { data: urlData } = supabase.storage.from('signatures').getPublicUrl(path)
        await supabase.from('journeys').update({ driver_signature_url: urlData?.publicUrl }).eq('id', selectedJourney.id)
      }

      // Save checklist responses
      const clData = checklistItems.map((item: any) => ({
        journey_id: selectedJourney.id,
        checklist_config_id: item.id,
        item_key: item.item_key,
        label: item.label,
        response: checklistAnswers[item.id] ?? false,
        notes: null,
      }))
      if (clData.length > 0) {
        await supabase.from('journey_checklists').delete().eq('journey_id', selectedJourney.id)
        await supabase.from('journey_checklists').insert(clData)
      }

      await supabase.from('journey_events').insert({
        journey_id: selectedJourney.id,
        event_type: 'started',
        user_id: userId,
        notes: `Started via QR scan · ${passengers.length} passenger(s) confirmed present · ${clData.filter(c => c.response).length}/${clData.length} checklist items confirmed`,
      })

      const cps = selectedJourney.checkpoints || []
      setCheckpoints(cps.sort((a: any, b: any) => a.sort_order - b.sort_order))
      const next = cps.find((cp: any) => !cp.checked_in_at)
      setNextCheckpoint(next || null)
      setScenario('in_progress')
    } catch (e: any) {
      setMessage(e.message)
    }
    setLoading(false)
  }

  async function checkInCheckpoint() {
    if (!nextCheckpoint || !userId) return
    setLoading(true)
    try {
      await supabase.from('checkpoints').update({
        checked_in_at: new Date().toISOString(),
        method: 'qr_scan',
      }).eq('id', nextCheckpoint.id)

      await supabase.from('journey_events').insert({
        journey_id: selectedJourney.id,
        event_type: 'checkpoint_in',
        user_id: userId,
        notes: `Checked in at ${nextCheckpoint.name}`,
      })

      // Refresh checkpoints
      const { data: updatedCps } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('journey_id', selectedJourney.id)
        .order('sort_order')

      setCheckpoints(updatedCps || [])
      const next = (updatedCps || []).find((cp: any) => !cp.checked_in_at)
      setNextCheckpoint(next || null)

      if (!next) {
        setMessage('All checkpoints complete!')
      }
    } catch (e: any) {
      setMessage(e.message)
    }
    setLoading(false)
  }

  async function completeJourney() {
    if (!selectedJourney || !userId) return
    setLoading(true)
    try {
      await supabase.from('journeys').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', selectedJourney.id)

      await supabase.from('vehicles').update({ status: 'available' }).eq('id', vehicleId)

      await supabase.from('journey_events').insert({
        journey_id: selectedJourney.id,
        event_type: 'completed',
        user_id: userId,
        notes: 'Completed via QR scan',
      })

      setScenario('done')
    } catch (e: any) {
      setMessage(e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight mb-1">
            <span style={{ color: 'var(--text)' }}>JMP</span>
            <span style={{ color: 'var(--accent)' }}>HQ</span>
          </div>
          {vehicle && (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {vehicle.make} {vehicle.model} · {vehicle.registration}
            </p>
          )}
        </div>

        <div className="card">
          {scenario === 'loading' && (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>Loading…</div>
          )}

          {scenario === 'phone' && (
            <>
              <h2 className="text-xl font-bold mb-2">Who are you?</h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>Enter your mobile number to continue.</p>
              <div className="space-y-4">
                <div>
                  <label className="label">Mobile number</label>
                  <input
                    className="input"
                    type="tel"
                    placeholder="0412 345 678"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && verifyPhone()}
                  />
                  {phoneError && <p className="text-xs mt-2" style={{ color: 'var(--red)' }}>{phoneError}</p>}
                </div>
                <button className="btn-primary w-full" onClick={verifyPhone} disabled={loading || !phone}>
                  {loading ? 'Checking…' : 'Continue'}
                </button>
              </div>
            </>
          )}

          {scenario === 'no_journey' && (
            <div className="text-center py-4">
              <AlertCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--text-dim)' }} />
              <h2 className="font-bold mb-2">No journey scheduled</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {message || 'No approved journey found for this vehicle today.'}
              </p>
              <a href="/dashboard" className="btn-primary mt-4 inline-block">Go to dashboard</a>
            </div>
          )}

          {scenario === 'select_journey' && (
            <>
              <h2 className="text-xl font-bold mb-2">Select journey</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>Multiple journeys found for this vehicle.</p>
              <div className="space-y-2">
                {journeys.map(j => (
                  <button
                    key={j.id}
                    onClick={async () => { setSelectedJourney(j); await Promise.all([loadPassengers(j.id), loadChecklist(vehicle.org_id)]); setScenario('confirm_start') }}
                    className="w-full text-left p-3 rounded-xl border transition-all hover:border-white/20"
                    style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
                  >
                    <p className="font-medium text-sm">{j.purpose}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {j.outbound_from} → {j.outbound_to}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}

          {(scenario === 'start_journey' || scenario === 'confirm_start') && selectedJourney && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Navigation size={20} style={{ color: 'var(--accent)' }} />
                <div>
                  <p className="font-bold text-sm">{selectedJourney.purpose}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{selectedJourney.outbound_from} → {selectedJourney.outbound_to}</p>
                </div>
              </div>

              {/* Passengers confirmation */}
              <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Users size={15} style={{ color: 'var(--text-muted)' }} />
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                    PASSENGERS {passengers.length > 0 ? `(${passengers.length})` : ''}
                  </p>
                </div>
                {passengers.length === 0 ? (
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>No passengers on this journey.</p>
                ) : (
                  <div className="space-y-1 mb-3">
                    {passengers.map((p: any) => (
                      <p key={p.id} className="text-sm">👤 {p.full_name}{p.phone ? ` · ${p.phone}` : ''}</p>
                    ))}
                  </div>
                )}
                <label className="flex items-start gap-3 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={passengersConfirmed}
                    onChange={e => setPassengersConfirmed(e.target.checked)}
                    style={{ marginTop: 2, accentColor: 'var(--accent)' }}
                  />
                  <span className="text-sm">
                    {passengers.length > 0
                      ? 'All passengers are present and have been briefed'
                      : 'I confirm no passengers on this journey'}
                  </span>
                </label>
              </div>

              {/* Pre-departure checklist */}
              {checklistItems.length > 0 && (
                <div className="rounded-xl p-3 mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  <p className="text-xs font-semibold mb-3" style={{ color: 'var(--text-muted)' }}>PRE-DEPARTURE CHECKLIST</p>
                  <div className="space-y-2">
                    {checklistItems.map((item: any) => (
                      <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checklistAnswers[item.id] ?? false}
                          onChange={e => setChecklistAnswers(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          style={{ marginTop: 2, accentColor: item.is_blocking ? 'var(--red)' : 'var(--accent)' }}
                        />
                        <span className="text-sm">{item.label}{item.is_blocking && <span className="text-xs ml-1.5" style={{ color: 'var(--red)' }}>⚠️ required</span>}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Driver signature */}
              <div className="mb-4">
                <SignaturePad label="Driver signature *" onSave={setDriverSignature} />
              </div>

              {(() => {
                const blockingUnticked = checklistItems.filter((item: any) => item.is_blocking && !checklistAnswers[item.id])
                const canStart = passengersConfirmed && !!driverSignature && blockingUnticked.length === 0
                const hint = !passengersConfirmed ? 'Confirm passengers to continue'
                  : !driverSignature ? 'Driver signature required'
                  : blockingUnticked.length > 0 ? `Required checklist items not confirmed`
                  : null
                return (
                  <>
                    <button
                      className="btn-primary w-full"
                      onClick={startJourney}
                      disabled={loading || !canStart}
                    >
                      {loading ? 'Starting…' : 'Confirm & Start Journey'}
                    </button>
                    {hint && (
                      <p className="text-xs text-center mt-2" style={{ color: 'var(--text-dim)' }}>{hint}</p>
                    )}
                  </>
                )
              })()}
            </div>
          )}

          {scenario === 'in_progress' && selectedJourney && (
            <>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--accent)' }}>Journey in progress</span>
              </div>
              <h2 className="font-bold mb-1">{selectedJourney.purpose}</h2>
              <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
                {selectedJourney.outbound_from} → {selectedJourney.outbound_to}
              </p>

              {checkpoints.length > 0 && (
                <div className="mb-5">
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--text-muted)' }}>CHECKPOINTS</p>
                  <div className="space-y-2">
                    {checkpoints.map((cp: any, i: number) => (
                      <div key={cp.id} className="flex items-center gap-2 text-sm">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0"
                          style={{
                            background: cp.checked_in_at ? 'var(--green)' : nextCheckpoint?.id === cp.id ? 'var(--accent)' : 'var(--border)',
                            color: '#fff'
                          }}>
                          {cp.checked_in_at ? '✓' : i + 1}
                        </div>
                        <span style={{ color: cp.checked_in_at ? 'var(--text-muted)' : 'var(--text)', textDecoration: cp.checked_in_at ? 'line-through' : 'none' }}>
                          {cp.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message && <p className="text-sm mb-3" style={{ color: 'var(--green)' }}>{message}</p>}

              {nextCheckpoint ? (
                <button className="btn-primary w-full" onClick={checkInCheckpoint} disabled={loading}>
                  {loading ? 'Checking in…' : `Check in at ${nextCheckpoint.name}`}
                </button>
              ) : (
                <button className="btn-primary w-full" onClick={completeJourney} disabled={loading}>
                  {loading ? 'Completing…' : 'Complete journey'}
                </button>
              )}
            </>
          )}

          {scenario === 'done' && (
            <div className="text-center py-4">
              <CheckCircle size={48} className="mx-auto mb-3" style={{ color: 'var(--green)' }} />
              <h2 className="text-xl font-bold mb-2">Journey complete!</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {selectedJourney?.purpose} has been marked as completed.
              </p>
              <a href="/dashboard" className="btn-primary mt-4 inline-block">Back to dashboard</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
