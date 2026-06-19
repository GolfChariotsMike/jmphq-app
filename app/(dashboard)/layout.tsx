'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Car, Users, MapPin, ClipboardList, Settings, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { OrgProvider } from '@/lib/org-context'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journeys', label: 'Journeys', icon: MapPin },
  { href: '/vehicles', label: 'Vehicles', icon: Car },
  { href: '/staff', label: 'Staff', icon: Users },
  { href: '/reports', label: 'Reports', icon: ClipboardList },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <OrgProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
        {/* Sidebar */}
        <aside className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )} style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between p-6 pb-4">
            <div className="text-2xl font-black tracking-tight">
              <span style={{ color: 'var(--text)' }}>JMP</span>
              <span style={{ color: 'var(--accent)' }}>HQ</span>
            </div>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
          </div>

          <nav className="flex-1 px-3 py-2 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'text-white'
                      : 'hover:bg-white/5'
                  )}
                  style={active ? {
                    background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))',
                    boxShadow: '0 0 20px var(--accent-glow)',
                  } : { color: 'var(--text-muted)' }}
                >
                  <Icon size={18} />
                  {label}
                </Link>
              )
            })}
          </nav>

          <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={signOut}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all hover:bg-white/5"
              style={{ color: 'var(--text-muted)' }}
            >
              <LogOut size={18} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top bar */}
          <header className="flex items-center gap-4 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} style={{ color: 'var(--text-muted)' }} />
            </button>
            <div className="flex-1" />
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent-dark))' }}>
              A
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </OrgProvider>
  )
}
