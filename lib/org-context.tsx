'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface OrgContext {
  userId: string | null
  orgId: string | null
  orgName: string | null
  trialEndsAt: string | null
  loading: boolean
}

const Ctx = createContext<OrgContext>({ userId: null, orgId: null, orgName: null, trialEndsAt: null, loading: true })

export function OrgProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const [ctx, setCtx] = useState<OrgContext>({ userId: null, orgId: null, orgName: null, trialEndsAt: null, loading: true })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setCtx(c => ({ ...c, loading: false })); return }
      const { data: profile } = await supabase
        .from('users').select('org_id, organisations(name, trial_ends_at)').eq('id', user.id).single()
      const org = (profile as any)?.organisations
      setCtx({
        userId: user.id,
        orgId: profile?.org_id ?? null,
        orgName: org?.name ?? null,
        trialEndsAt: org?.trial_ends_at ?? null,
        loading: false,
      })
    }
    load()
  }, [])

  return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export const useOrg = () => useContext(Ctx)
