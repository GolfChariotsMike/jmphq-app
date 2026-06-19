export default function Loading() {
  return (
    <div className="space-y-4 max-w-5xl animate-pulse">
      <div className="h-8 w-48 rounded-xl" style={{ background: 'var(--surface)' }} />
      <div className="h-4 w-32 rounded-lg" style={{ background: 'var(--surface)' }} />
      <div className="h-64 rounded-2xl" style={{ background: 'var(--surface)' }} />
    </div>
  )
}
