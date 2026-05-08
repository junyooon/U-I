import { useState, useEffect, FormEvent } from 'react'
import { useCreateCategory } from '../api/categories'

const PRESET_COLORS = [
  '#4A90D9', '#7C3AED', '#10B981', '#F59E0B',
  '#EF4444', '#EC4899', '#06B6D4', '#F97316',
  '#8B5CF6', '#14B8A6', '#F43F5E', '#84CC16',
]

interface Props {
  onClose: () => void
}

export default function AddCategoryModal({ onClose }: Props) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const createCategory = useCreateCategory()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await createCategory.mutateAsync({ name, color })
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '360px', maxWidth: 'calc(100vw - 32px)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-md)',
          borderRadius: '14px',
          padding: '28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
          New category
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. College"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
              {PRESET_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: c,
                    border: color === c ? '3px solid #fff' : '3px solid transparent',
                    cursor: 'pointer',
                    boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>
          </div>

          {createCategory.error && (
            <p style={{ color: '#f87171', fontSize: '13px' }}>
              {(createCategory.error as Error).message}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={cancelStyle}>Cancel</button>
            <button
              type="submit"
              disabled={createCategory.isPending || !name.trim()}
              style={submitStyle}
            >
              {createCategory.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', color: '#6b7280',
  marginBottom: '8px', fontWeight: 500,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#fff',
  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
}
const cancelStyle: React.CSSProperties = {
  padding: '9px 16px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: '#6b7280',
  fontSize: '13px', cursor: 'pointer',
}
const submitStyle: React.CSSProperties = {
  padding: '9px 20px', borderRadius: '8px',
  border: 'none', background: '#3b82f6',
  color: '#fff', fontSize: '13px',
  fontWeight: 600, cursor: 'pointer',
}
