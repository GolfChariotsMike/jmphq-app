import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function HomePage() {
  // If already logged in, go straight to dashboard
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)' }}>

      {/* NAV */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        borderBottom: '1px solid var(--border)',
        background: 'rgba(17,17,17,0.85)',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', gap: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' }}>
            <span style={{ color: 'var(--text)' }}>JMP</span>
            <span style={{ color: 'var(--accent)' }}>HQ</span>
          </div>
          <div style={{ flex: 1 }} />
          <Link href="/login" style={{
            background: 'linear-gradient(135deg, #FF6B2B, #E85D20)',
            color: '#fff', padding: '9px 22px', borderRadius: 100,
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            boxShadow: '0 0 20px rgba(255,107,43,0.3)',
          }}>
            Login
          </Link>
          <Link href="/login" style={{
            color: 'var(--text-muted)', fontSize: 14, fontWeight: 500,
            textDecoration: 'none', display: 'none',
          }}>
            Get started free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: '-60%',
          background: 'conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,107,43,0.07) 60deg, rgba(232,93,32,0.10) 120deg, rgba(245,158,11,0.06) 180deg, transparent 240deg, rgba(255,107,43,0.05) 300deg, transparent 360deg)',
          filter: 'blur(80px)',
          animation: 'spin 25s linear infinite',
          zIndex: 0,
        }} />
        <div style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 800, margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,107,43,0.1)', border: '1px solid rgba(255,107,43,0.25)',
            borderRadius: 100, padding: '6px 16px', fontSize: 13, fontWeight: 500,
            color: 'var(--accent)', marginBottom: 32,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
            Built for HSE compliance
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 80px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-2px', marginBottom: 24 }}>
            Journey management<br />
            <span style={{ background: 'linear-gradient(135deg, #FF6B2B, #F59E0B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              done properly.
            </span>
          </h1>
          <p style={{ fontSize: 20, color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.65 }}>
            Replace paper-based JMP forms with a real-time platform. Plan routes, get approvals, track checkpoints, and keep your team safe — from any device.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 64 }}>
            <Link href="/login" style={{
              background: 'linear-gradient(135deg, #FF6B2B, #E85D20)', color: '#fff',
              padding: '16px 36px', borderRadius: 100, fontSize: 16, fontWeight: 600,
              textDecoration: 'none', boxShadow: '0 0 32px rgba(255,107,43,0.4)',
            }}>
              Start free trial
            </Link>
            <a href="#features" style={{
              background: 'transparent', color: 'var(--text)',
              padding: '16px 36px', borderRadius: 100, fontSize: 16, fontWeight: 600,
              textDecoration: 'none', border: '1px solid var(--border-bright)',
            }}>
              See how it works ↓
            </a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 32, flexWrap: 'wrap' }}>
            {[['100%', 'Paperless'], ['60s', 'QR start time'], ['24/7', 'Live dashboard']].map(([val, label]) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 900, background: 'linear-gradient(135deg, #f0f0f0, #FF6B2B)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{val}</div>
                <div style={{ fontSize: 13, color: 'var(--text-dim)', fontWeight: 500, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: '100px 24px', background: 'var(--bg-2, #161616)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 16, borderLeft: '3px solid var(--accent)', paddingLeft: 10, display: 'inline-block' }}>Features</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, marginBottom: 16 }}>Everything your HSE team needs.</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              ['📲', 'QR Vehicle Stickers', 'One permanent QR per vehicle. Scan to start, scan at checkpoints, scan to complete.'],
              ['🛡️', 'Pre-Journey Checklist', 'All HSE checklist items digitised. Admin can toggle any item to blocking.'],
              ['✍️', 'Digital Signatures', 'Draw-on-screen signatures for drivers and passengers. Supervisors use a saved signature.'],
              ['📡', 'Live Dashboard', 'See every active journey. Colour-coded status — on track, due, overdue.'],
              ['🔁', 'Repeat Journeys', 'Going to the same site again? Pre-filled route, checkpoints and call-in schedule.'],
              ['🚨', 'SMS Alerts', 'Miss a checkpoint? Your supervisor gets an SMS instantly via Twilio.'],
            ].map(([icon, title, desc]) => (
              <div key={title as string} style={{ background: 'var(--surface, #1a1a1a)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px' }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.65 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '100px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, marginBottom: 16 }}>Ready to go paperless?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 18, marginBottom: 40 }}>14-day free trial. Full access. No credit card required.</p>
          <Link href="/login" style={{
            background: 'linear-gradient(135deg, #FF6B2B, #E85D20)', color: '#fff',
            padding: '16px 40px', borderRadius: 100, fontSize: 16, fontWeight: 600,
            textDecoration: 'none', boxShadow: '0 0 40px rgba(255,107,43,0.4)',
            display: 'inline-block',
          }}>
            Start free trial →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '32px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
          <span style={{ color: 'var(--text)' }}>JMP</span>
          <span style={{ color: 'var(--accent)' }}>HQ</span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>© 2026 JMPHQ. Journey Management Platform for HSE teams.</div>
      </footer>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>
    </div>
  )
}
