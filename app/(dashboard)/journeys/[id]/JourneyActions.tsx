'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SignaturePad from '@/components/SignaturePad'
import { CheckCircle, XCircle, Flag } from 'lucide-react'

interface Props {
  journeyId: string
  userId: string
  status?: string
}

export default function JourneyActions({ journeyId, userId, status }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [rejectNotes, setRejectNotes] = useState('')
  const [supervisorSig, setSupervisorSig] = useState('')
  const [error, setError] = useState('')

  async function approve() {
    setLoading(true)
    setError('')
    try {
      // Upload supervisor signature if provided
      let sigUrl = null
      if (supervisorSig) {
        const blob = await (await fetch(supervisorSig)).blob()
        const path = `supervisor-${journeyId}-${Date.now()}.png`
        await supabase.storage.from('signatures').upload(path, blob, { contentType: 'image/png', upsert: true })
        const { data } = supabase.storage.from('signatures').getPublicUrl(path)
        sigUrl = data?.publicUrl
      }

      await supabase.from('approvals').insert({
        journey_id: journeyId,
        approver_id: userId,
        status: 'approved',
        signature_url: sigUrl,
        decided_at: new Date().toISOString(),
      })

      await supabase.from('journeys').update({ status: 'approved' }).eq('id', journeyId)

      await supabase.from('journey_events').insert({
        journey_id: journeyId,
        event_type: 'approved',
        user_id: userId,
      })

      router.refresh()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function reject() {
    if (!rejectNotes) { setError('Please add rejection notes'); return }
    setLoading(true)
    setError('')
    try {
      await supabase.from('approvals').insert({
        journey_id: journeyId,
        approver_id: userId,
        status: 'rejected',
        notes: rejectNotes,
        decided_at: new Date().toISOString(),
      })

      await supabase.from('journeys').update({ status: 'draft' }).eq('id', journeyId)

      await supabase.from('journey_events').insert({
        journey_id: journeyId,
        event_type: 'rejected',
        user_id: userId,
        metadata: { notes: rejectNotes },
      })

      router.refresh()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  async function complete() {
    setLoading(true)
    try {
      // Get journey to find vehicle
      const { data: j } = await supabase.from('journeys').select('vehicle_id').eq('id', journeyId).single()

      await supabase.from('journeys').update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      }).eq('id', journeyId)

      if (j?.vehicle_id) {
        await supabase.from('vehicles').update({ status: 'available' }).eq('id', j.vehicle_id)
      }

      await supabase.from('journey_events').insert({
        journey_id: journeyId,
        event_type: 'completed',
        user_id: userId,
      })

      router.refresh()
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }

  if (status === 'in_progress') {
    return (
      <div>
        {error && <p className="text-sm mb-3" style={{ color: 'var(--red)' }}>{error}</p>}
        <button onClick={complete} disabled={loading} className="btn-primary flex items-center gap-2">
          <Flag size={16} /> Mark complete
        </button>
      </div>
    )
  }

  if (status === 'approved') {
    return null // No action needed — journey starts via QR
  }

  return (
    <div className="space-y-4">
      {!showReject ? (
        <>
          <SignaturePad label="Supervisor signature (optional)" onSave={setSupervisorSig} />
          {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={approve} disabled={loading} className="btn-primary flex items-center gap-2 flex-1">
              <CheckCircle size={16} /> Approve
            </button>
            <button
              onClick={() => setShowReject(true)}
              disabled={loading}
              className="flex items-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border"
              style={{ borderColor: 'var(--red)', color: 'var(--red)', background: 'transparent' }}
            >
              <XCircle size={16} /> Reject
            </button>
          </div>
        </>
      ) : (
        <>
          <div>
            <label className="label">Rejection reason *</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Explain why this journey is being rejected..."
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
            />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
          <div className="flex gap-3">
            <button onClick={reject} disabled={loading} className="btn-primary flex-1"
              style={{ background: 'var(--red)', boxShadow: 'none' }}>
              {loading ? 'Rejecting…' : 'Confirm rejection'}
            </button>
            <button onClick={() => setShowReject(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
