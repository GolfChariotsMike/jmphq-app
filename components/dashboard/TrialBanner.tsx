import Link from 'next/link'
import { Clock } from 'lucide-react'

export default function TrialBanner({ daysLeft }: { daysLeft: number }) {
  const urgent = daysLeft <= 3

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm"
      style={{
        background: urgent ? 'rgba(239,68,68,0.1)' : 'rgba(255,107,43,0.08)',
        border: `1px solid ${urgent ? 'rgba(239,68,68,0.3)' : 'rgba(255,107,43,0.2)'}`,
      }}>
      <Clock size={16} style={{ color: urgent ? 'var(--red)' : 'var(--accent)', flexShrink: 0 }} />
      <span style={{ color: urgent ? 'var(--red)' : 'var(--accent)' }}>
        {daysLeft === 0
          ? 'Your free trial expires today.'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left on your free trial.`}
      </span>
      <Link href="/settings/billing" className="ml-auto font-semibold whitespace-nowrap"
        style={{ color: urgent ? 'var(--red)' : 'var(--accent)' }}>
        Choose a plan →
      </Link>
    </div>
  )
}
