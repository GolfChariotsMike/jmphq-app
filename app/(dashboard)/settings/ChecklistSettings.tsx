'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'

interface ChecklistItem {
  id: string
  item_key: string
  label: string
  is_blocking: boolean
  is_active: boolean
  sort_order: number
}

export default function ChecklistSettings({ items: initialItems, orgId }: { items: ChecklistItem[]; orgId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [newText, setNewText] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function addItem() {
    if (!newText.trim()) return
    setLoading(true)
    const { data, error: err } = await supabase
      .from('checklist_config')
      .insert({
        org_id: orgId,
        item_key: `item_${Date.now()}`,
        label: newText.trim(),
        is_blocking: false,
        is_active: true,
        sort_order: items.length,
      })
      .select()
      .single()
    if (err) { setError(err.message); setLoading(false); return }
    setItems(prev => [...prev, data])
    setNewText('')
    setLoading(false)
  }

  async function updateItem(id: string, patch: Partial<ChecklistItem>) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item))
    await supabase.from('checklist_config').update(patch).eq('id', id)
  }

  async function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id))
    await supabase.from('checklist_config').delete().eq('id', id)
  }

  async function move(id: string, dir: 'up' | 'down') {
    const idx = items.findIndex(i => i.id === id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === items.length - 1) return

    const newItems = [...items]
    const swapIdx = dir === 'up' ? idx - 1 : idx + 1
    ;[newItems[idx], newItems[swapIdx]] = [newItems[swapIdx], newItems[idx]]

    // Update sort_order
    const updated = newItems.map((item, i) => ({ ...item, sort_order: i }))
    setItems(updated)

    // Persist
    await Promise.all(updated.map(item =>
      supabase.from('checklist_config').update({ sort_order: item.sort_order }).eq('id', item.id)
    ))
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-4">Pre-Journey Checklist</h2>

      <div className="space-y-2 mb-4">
        {items.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No items yet. Add your first checklist item below.</p>
        )}
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="flex flex-col gap-0.5">
              <button onClick={() => move(item.id, 'up')} disabled={i === 0}
                className="p-0.5 rounded hover:bg-white/5 disabled:opacity-30">
                <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button onClick={() => move(item.id, 'down')} disabled={i === items.length - 1}
                className="p-0.5 rounded hover:bg-white/5 disabled:opacity-30">
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            <span className="flex-1 text-sm">{item.label}</span>

            <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={item.is_blocking}
                onChange={e => updateItem(item.id, { is_blocking: e.target.checked })}
                style={{ accentColor: 'var(--red)' }}
              />
              Blocking
            </label>

            <label className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={item.is_active}
                onChange={e => updateItem(item.id, { is_active: e.target.checked })}
                style={{ accentColor: 'var(--accent)' }}
              />
              Active
            </label>

            <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-white/5">
              <Trash2 size={14} style={{ color: 'var(--red)' }} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="New checklist item…"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
        />
        <button onClick={addItem} disabled={loading || !newText.trim()} className="btn-primary flex items-center gap-1.5">
          <Plus size={15} /> Add
        </button>
      </div>
      {error && <p className="text-sm mt-2" style={{ color: 'var(--red)' }}>{error}</p>}
    </div>
  )
}
