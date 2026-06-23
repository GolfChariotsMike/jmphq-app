import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const origin = searchParams.get('origin')
  const destination = searchParams.get('destination')

  if (!origin || !destination) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 })
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return NextResponse.json({ error: 'No API key' }, { status: 500 })

  const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${key}`

  const res = await fetch(url)
  const data = await res.json()
  return NextResponse.json(data)
}
