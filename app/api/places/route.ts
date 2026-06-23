import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input')
  if (!input || input.length < 2) return NextResponse.json({ suggestions: [] })

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY
  if (!key) return NextResponse.json({ suggestions: [] })

  const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key },
    body: JSON.stringify({
      input,
      languageCode: 'en',
      includedRegionCodes: ['au', 'nz'],
    }),
  })

  const data = await res.json()
  const suggestions = (data.suggestions || []).map((s: any) => ({
    text: s.placePrediction?.text?.text || '',
    placeId: s.placePrediction?.placeId || '',
  })).filter((s: any) => s.text)

  return NextResponse.json({ suggestions })
}
