'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, ChevronUp, ChevronDown, Pencil, Check } from 'lucide-react'

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
  const [items, setItems] = useState<ChecklistItem[]>(initialItems)
  const [newText, setNewText] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingLabel, setEditingLabel] = useState('')
  const [error, setError] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  function startEdit(item: ChecklistItem) {
    setEditingId(item.id)
    setEditingLabel(item.label)
    setTimeout(() => editRef.current?.focus(), 50)
  }

  async function commitEdit(id: string) {
    const trimmed = editingLabel.trim()
    if (!trimmed) { setEditingId(null); return }
    setItems(prev => prev.map(item => item.id === id ? { ...item, label: trimmed } : item))
    setEditingId(null)
    await supabase.from('checklist_config').update({ label: trimmed }).eq('id', id)
  }

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
    const updated = newItems.map((item, i) => ({ ...item, sort_order: i }))
    setItems(updated)
    await Promise.all(updated.map(item =>
      supabase.from('checklist_config').update({ sort_order: item.sort_order }).eq('id', item.id)
    ))
  }

  return (
    <div className="card">
      <h2 className="text-lg font-bold mb-1">Pre-Journey Checklist</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
        Items shown to the driver before every journey. Click the pencil to rename any item.
      </p>

      <div className="space-y-2 mb-4">
        {items.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-dim)' }}>No items yet.</p>
        )}
        {items.map((item, i) => (
          <div key={item.id} className="flex items-center gap-2 p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', opacity: item.is_active ? 1 : 0.5 }}>
            {/* Reorder */}
            <div className="flex flex-col gap-0.5 flex-shrink-0">
              <button onClick={() => move(item.id, 'up')} disabled={i === 0}
                className="p-0.5 rounded hover:bg-white/5 disabled:opacity-30">
                <ChevronUp size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
              <button onClick={() => move(item.id, 'down')} disabled={i === items.length - 1}
                className="p-0.5 rounded hover:bg-white/5 disabled:opacity-30">
                <ChevronDown size={12} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {/* Label — inline editable */}
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <input
                  ref={editRef}
                  className="input py-1 text-sm w-full"
                  value={editingLabel}
                  onChange={e => setEditingLabel(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitEdit(item.id)
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  onBlur={() => commitEdit(item.id)}
                />
              ) : (
                <span className="text-sm">{item.label}</span>
              )}
            </div>

            {/* Edit label button */}
            {editingId === item.id ? (
              <button onClick={() => commitEdit(item.id)} className="p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0">
                <Check size={14} style={{ color: 'var(--accent)' }} />
              </button>
            ) : (
              <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0">
                <Pencil size={13} style={{ color: 'var(--text-dim)' }} />
              </button>
            )}

            {/* Blocking toggle */}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={item.is_blocking}
                onChange={e => updateItem(item.id, { is_blocking: e.target.checked })}
                style={{ accentColor: 'var(--red)' }}
              />
              Blocking
            </label>

            {/* Active toggle */}
            <label className="flex items-center gap-1.5 text-xs cursor-pointer flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
              <input
                type="checkbox"
                checked={item.is_active}
                onChange={e => updateItem(item.id, { is_active: e.target.checked })}
                style={{ accentColor: 'var(--accent)' }}
              />
              Active
            </label>

            <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-white/5 flex-shrink-0">
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
