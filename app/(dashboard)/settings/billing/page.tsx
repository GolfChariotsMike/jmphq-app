import Link from 'next/link'
import { ArrowLeft, Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Starter',
    price: '$29',
    period: '/mo',
    description: 'Perfect for small teams',
    features: ['Up to 5 vehicles', '10 staff members', 'Basic journey management', 'Email support'],
  },
  {
    name: 'Professional',
    price: '$69',
    period: '/mo',
    description: 'For growing organisations',
    features: ['Up to 25 vehicles', 'Unlimited staff', 'Advanced approvals', 'SMS notifications', 'Priority support'],
    popular: true,
  },
  {
    name: 'Business',
    price: '$149',
    period: '/mo',
    description: 'Enterprise-grade operations',
    features: ['Unlimited vehicles', 'Unlimited staff', 'Custom checklists', 'API access', 'Dedicated support', 'Custom reporting'],
  },
]

export default function BillingPage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/settings" className="p-2 rounded-xl hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-2xl font-bold">Choose a plan</h1>
      </div>

      <p className="text-center mb-8" style={{ color: 'var(--text-muted)' }}>
        Your free trial has ended. Upgrade to continue managing your journeys.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <div key={plan.name} className="card relative"
            style={plan.popular ? { borderColor: 'var(--accent)', boxShadow: '0 0 30px var(--accent-glow)' } : {}}>
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'var(--accent)', color: '#fff' }}>
                Most popular
              </div>
            )}
            <h2 className="text-lg font-bold mb-1">{plan.name}</h2>
            <p className="text-sm mb-3" style={{ color: 'var(--text-muted)' }}>{plan.description}</p>
            <div className="mb-4">
              <span className="text-3xl font-black">{plan.price}</span>
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>{plan.period}</span>
            </div>
            <ul className="space-y-2 mb-6">
              {plan.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-xs mb-3 text-center" style={{ color: 'var(--text-muted)' }}>14-day free trial</p>
            <button className="btn-primary w-full" style={plan.popular ? {} : { background: 'var(--surface-2)', boxShadow: 'none', border: '1px solid var(--border)', color: 'var(--text)' }}>
              Get started
            </button>
          </div>
        ))}
      </div>

      <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-dim)' }}>
        Questions? <a href="mailto:support@jmphq.com" style={{ color: 'var(--accent)' }}>Contact support</a>
      </p>
    </div>
  )
}
