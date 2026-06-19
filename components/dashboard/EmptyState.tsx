import Link from 'next/link'
import { Car, Users, ArrowRight } from 'lucide-react'

export default function EmptyState() {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
        Complete these steps to get started
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Add Vehicle */}
        <Link href="/vehicles/new" className="group block rounded-2xl p-6 transition-all hover:-translate-y-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
              style={{ background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.2)' }}>
              <Car size={22} style={{ color: 'var(--accent)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-1">Add your first vehicle</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Register a vehicle and generate its QR sticker. Drivers scan this to start journeys.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm font-medium" style={{ color: 'var(--accent)' }}>
            Add vehicle <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        {/* Add Staff */}
        <Link href="/staff/new" className="group block rounded-2xl p-6 transition-all hover:-translate-y-1"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all group-hover:scale-110"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              <Users size={22} style={{ color: 'var(--green)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold mb-1">Add your first staff member</div>
              <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Add drivers and supervisors. Each person gets their own account with their role and next-of-kin details.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 mt-4 text-sm font-medium" style={{ color: 'var(--green)' }}>
            Add staff <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      <p className="text-xs text-center pt-2" style={{ color: 'var(--text-dim)' }}>
        You can also start by planning a journey — vehicles and staff can be added along the way.
      </p>
    </div>
  )
}
