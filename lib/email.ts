const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = 'JMPHQ <noreply@manyhandz.ai>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.jmphq.com.au'

async function send(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) { console.warn('RESEND_API_KEY not set'); return }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) console.error('Resend error:', await res.text())
}

function base(content: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0f0f0f;font-family:system-ui,sans-serif;color:#e5e5e5">
  <div style="max-width:560px;margin:40px auto;padding:32px;background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a">
    <div style="margin-bottom:24px">
      <span style="font-size:22px;font-weight:900;letter-spacing:-0.5px">JMP<span style="color:#FF6B2B">HQ</span></span>
    </div>
    ${content}
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #2a2a2a;font-size:12px;color:#666">
      JMPHQ · Journey Management Platform · <a href="${APP_URL}" style="color:#FF6B2B;text-decoration:none">app.jmphq.com.au</a>
    </div>
  </div>
</body></html>`
}

function btn(url: string, label: string, color = '#FF6B2B') {
  return `<a href="${url}" style="display:inline-block;margin-top:16px;padding:12px 24px;background:${color};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px">${label}</a>`
}

export async function sendApprovalRequest({
  to, approverName, driverName, purpose, from, destination, departAt, journeyId,
}: {
  to: string; approverName: string; driverName: string; purpose: string
  from: string; destination: string; departAt: string | null; journeyId: string
}) {
  const url = `${APP_URL}/journeys/${journeyId}`
  const depart = departAt ? new Date(departAt).toLocaleString('en-AU', { dateStyle: 'medium', timeStyle: 'short' }) : 'TBC'
  await send(to, `Journey approval required — ${purpose}`, base(`
    <h2 style="margin:0 0 8px;font-size:18px">Approval required</h2>
    <p style="color:#999;margin:0 0 20px">A journey has been submitted and requires your approval.</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr><td style="padding:8px 0;color:#888;width:120px">Driver</td><td style="padding:8px 0">${driverName}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Purpose</td><td style="padding:8px 0">${purpose}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Route</td><td style="padding:8px 0">${from} → ${destination}</td></tr>
      <tr><td style="padding:8px 0;color:#888">Departure</td><td style="padding:8px 0">${depart}</td></tr>
    </table>
    ${btn(url, 'Review & Approve →')}
  `))
}

export async function sendApprovalResult({
  to, driverName, purpose, status, notes, journeyId,
}: {
  to: string; driverName: string; purpose: string; status: 'approved' | 'rejected'; notes?: string; journeyId: string
}) {
  const url = `${APP_URL}/journeys/${journeyId}`
  const approved = status === 'approved'
  await send(
    to,
    `Journey ${approved ? 'approved ✅' : 'rejected ❌'} — ${purpose}`,
    base(`
      <h2 style="margin:0 0 8px;font-size:18px">Journey ${approved ? 'approved' : 'rejected'}</h2>
      <p style="color:#999;margin:0 0 20px">
        ${approved
          ? `Your journey <strong style="color:#e5e5e5">${purpose}</strong> has been approved. You're good to go — scan the vehicle QR code when you're ready to depart.`
          : `Your journey <strong style="color:#e5e5e5">${purpose}</strong> has been rejected and returned to draft.`
        }
      </p>
      ${!approved && notes ? `<div style="padding:12px 16px;background:#2a1a1a;border-left:3px solid #ef4444;border-radius:6px;font-size:14px;color:#fca5a5;margin-bottom:16px">${notes}</div>` : ''}
      ${btn(url, 'View journey →', approved ? '#22c55e' : '#FF6B2B')}
    `)
  )
}
