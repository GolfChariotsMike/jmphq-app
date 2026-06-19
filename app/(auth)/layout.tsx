export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-3xl font-black tracking-tight">
            <span style={{ color: 'var(--text)' }}>JMP</span>
            <span style={{ color: 'var(--accent)' }}>HQ</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
