'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { RotateCcw } from 'lucide-react'

export default function RepeatJourneyButton({ journey }: { journey: any }) {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function repeat() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('users')
        .select('org_id')
        .eq('id', user.id)
        .single()

      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]

      const { data: newJourney } = await supabase
        .from('journeys')
        .insert({
          org_id: profile?.org_id,
          created_by: user.id,
          driver_id: journey.driver_id,
          vehicle_id: journey.vehicle_id,
          purpose: journey.purpose,
          radio_channel: journey.radio_channel,
          journey_type: journey.journey_type,
          outbound_from: journey.outbound_from,
          outbound_to: journey.outbound_to,
          outbound_depart_at: journey.outbound_depart_at
            ? `${todayStr}T${journey.outbound_depart_at.split('T')[1]}`
            : null,
          outbound_arrive_at: journey.outbound_arrive_at
            ? `${todayStr}T${journey.outbound_arrive_at.split('T')[1]}`
            : null,
          is_one_way: journey.is_one_way,
          return_from: journey.return_from,
          return_to: journey.return_to,
          return_depart_at: journey.return_depart_at
            ? `${todayStr}T${journey.return_depart_at.split('T')[1]}`
            : null,
          return_arrive_at: journey.return_arrive_at
            ? `${todayStr}T${journey.return_arrive_at.split('T')[1]}`
            : null,
          route_distance_km: journey.route_distance_km,
          status: 'draft',
        })
        .select('id')
        .single()

      // Copy checkpoints
      const { data: cps } = await supabase
        .from('checkpoints')
        .select('*')
        .eq('journey_id', journey.id)
        .order('sort_order')

      if (cps && cps.length > 0 && newJourney) {
        await supabase.from('checkpoints').insert(
          cps.map((cp: any, i: number) => ({
            journey_id: newJourney.id,
            name: cp.name,
            leg: cp.leg,
            expected_at: cp.expected_at
              ? `${todayStr}T${cp.expected_at.split('T')[1]}`
              : null,
            sort_order: i,
          }))
        )
      }

      if (newJourney) {
        router.push(`/journeys/${newJourney.id}`)
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  return (
    <button onClick={repeat} disabled={loading} className="btn-primary flex items-center gap-2">
      <RotateCcw size={16} />
      {loading ? 'Creating…' : 'Repeat this journey'}
    </button>
  )
}
