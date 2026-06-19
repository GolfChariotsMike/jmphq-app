'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function sendOtp() {
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : `+61${phone.replace(/^0/, '')}`
    const { error } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (error) {
      setError(error.message)
    } else {
      setStep('otp')
    }
    setLoading(false)
  }

  async function verifyOtp() {
    setLoading(true)
    setError('')
    const formatted = phone.startsWith('+') ? phone : `+61${phone.replace(/^0/, '')}`
    const { data, error } = await supabase.auth.verifyOtp({
      phone: formatted,
      token: otp,
      type: 'sms',
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    // Check if user has an org already
    const { data: profile } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', data.user!.id)
      .single()

    if (profile?.org_id) {
      router.push('/dashboard')
    } else {
      router.push('/onboarding')
    }
    setLoading(false)
  }

  return (
    <div className="card">
      <h1 className="text-2xl font-bold mb-2">
        {step === 'phone' ? 'Welcome to JMPHQ' : 'Enter your code'}
      </h1>
      <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
        {step === 'phone'
          ? 'Enter your mobile number to get started.'
          : `We sent a 6-digit code to ${phone}`}
      </p>

      {step === 'phone' ? (
        <div className="space-y-4">
          <div>
            <label className="label">Mobile number</label>
            <input
              className="input"
              type="tel"
              placeholder="0412 345 678"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
            />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
          <button className="btn-primary w-full" onClick={sendOtp} disabled={loading || !phone}>
            {loading ? 'Sending…' : 'Send code'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="label">6-digit code</label>
            <input
              className="input text-center text-2xl tracking-widest"
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              autoFocus
            />
          </div>
          {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
          <button className="btn-primary w-full" onClick={verifyOtp} disabled={loading || otp.length < 6}>
            {loading ? 'Verifying…' : 'Continue'}
          </button>
          <button
            className="w-full text-sm text-center"
            style={{ color: 'var(--text-muted)' }}
            onClick={() => { setStep('phone'); setOtp(''); setError('') }}
          >
            ← Change number
          </button>
        </div>
      )}
    </div>
  )
}
