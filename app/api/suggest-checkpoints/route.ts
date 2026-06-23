import { NextRequest, NextResponse } from 'next/server'

interface Checkpoint {
  name: string
  expectedAt: string | null
  lat: number
  lng: number
  label: string // e.g. "3hr mark", "Halfway"
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')
  const departAt = searchParams.get('departAt') // ISO string
  const intervalHours = parseFloat(searchParams.get('intervalHours') || '3')

  if (!origin || !destination) {
    return NextResponse.json({ checkpoints: [] })
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return NextResponse.json({ checkpoints: [] })

  // 1. Get full route with steps
  const dirUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${key}`
  const dirRes = await fetch(dirUrl)
  const dirData = await dirRes.json()

  if (dirData.status !== 'OK' || !dirData.routes?.length) {
    return NextResponse.json({ checkpoints: [] })
  }

  const legs = dirData.routes[0].legs
  const totalDurationSec = legs.reduce((sum: number, l: any) => sum + l.duration.value, 0)
  const totalHours = totalDurationSec / 3600

  // Flatten all steps with cumulative duration
  const steps: { durationSec: number; lat: number; lng: number }[] = []
  let cumulative = 0
  for (const leg of legs) {
    for (const step of leg.steps) {
      cumulative += step.duration.value
      steps.push({
        durationSec: cumulative,
        lat: step.end_location.lat,
        lng: step.end_location.lng,
      })
    }
  }

  // 2. Determine checkpoint marks
  const marks: { targetSec: number; label: string }[] = []

  if (totalHours <= 1.5) {
    // Very short — no checkpoints needed
    return NextResponse.json({ checkpoints: [], totalHours: Math.round(totalHours * 10) / 10 })
  } else if (totalHours < intervalHours) {
    // Short trip — suggest one halfway checkpoint
    marks.push({ targetSec: totalDurationSec / 2, label: 'Halfway point' })
  } else {
    // Long trip — checkpoint at each interval
    let mark = intervalHours * 3600
    while (mark < totalDurationSec - 1800) { // stop if <30min from destination
      marks.push({ targetSec: mark, label: `${Math.round(mark / 3600 * 10) / 10}hr mark` })
      mark += intervalHours * 3600
    }
  }

  // 3. Find nearest step for each mark, reverse geocode
  const checkpoints: Checkpoint[] = []

  for (const mark of marks) {
    // Find closest step to target time
    let closest = steps[0]
    let minDiff = Math.abs(steps[0].durationSec - mark.targetSec)
    for (const step of steps) {
      const diff = Math.abs(step.durationSec - mark.targetSec)
      if (diff < minDiff) { minDiff = diff; closest = step }
    }

    // Reverse geocode to get town name
    const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${closest.lat},${closest.lng}&result_type=locality|administrative_area_level_2&key=${key}`
    const geoRes = await fetch(geoUrl)
    const geoData = await geoRes.json()

    let name = `Checkpoint (${mark.label})`
    if (geoData.results?.length) {
      // Prefer locality, fallback to admin area
      const locality = geoData.results.find((r: any) => r.types.includes('locality'))
      const admin = geoData.results.find((r: any) => r.types.includes('administrative_area_level_2'))
      const best = locality || admin || geoData.results[0]
      name = best.address_components?.[0]?.long_name || best.formatted_address?.split(',')[0] || name
    }

    // Calculate expected time
    let expectedAt: string | null = null
    if (departAt) {
      const depart = new Date(departAt)
      depart.setSeconds(depart.getSeconds() + closest.durationSec)
      expectedAt = depart.toISOString().slice(0, 16)
    }

    checkpoints.push({ name, expectedAt, lat: closest.lat, lng: closest.lng, label: mark.label })
  }

  return NextResponse.json({ checkpoints, totalHours: Math.round(totalHours * 10) / 10 })
}
