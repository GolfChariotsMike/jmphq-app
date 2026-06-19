import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const cookieStore = await cookies()

  // Verify the user is authenticated
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
        },
      },
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Use service role to bypass RLS for initial org creation
  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const body = await req.json()
  const { name, country, industry, logoUrl, adminName, adminEmail } = body

  const trialEnds = new Date()
  trialEnds.setDate(trialEnds.getDate() + 14)

  // Create org
  const { data: org, error: orgError } = await admin
    .from('organisations')
    .insert({
      name: name.trim(),
      country: country || 'AU',
      industry: industry || null,
      logo_url: logoUrl || null,
      trial_ends_at: trialEnds.toISOString(),
      subscription_status: 'trial',
    })
    .select()
    .single()

  if (orgError) return NextResponse.json({ error: orgError.message }, { status: 500 })

  // Create user profile
  const { error: userError } = await admin
    .from('users')
    .upsert({
      id: user.id,
      org_id: org.id,
      phone: user.phone,
      name: adminName || null,
      email: adminEmail || null,
      role: 'admin',
    })

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  return NextResponse.json({ org })
}
