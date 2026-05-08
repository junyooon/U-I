import { useState, useEffect, FormEvent } from 'react'
import { useCreateContact } from '../api/contacts'
import type { Category } from '../types'

interface Props {
  categories: Category[]
  onClose: () => void
}

export default function AddPersonModal({ categories, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const createContact = useCreateContact()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggleCategory(id: string) {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await createContact.mutateAsync({
      name,
      email: email.trim() || null,
      phone: phone.trim() || null,
      category_ids: selectedCategories,
    })
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
          width: '380px', maxWidth: 'calc(100vw - 32px)',
          background: '#0d0f1e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '14px',
          padding: '28px',
        }}
        onClick={e => e.stopPropagation()}
      >
        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '20px' }}>
          Add a person
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={labelStyle}>Name *</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Alex Kim"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              placeholder="alex@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Phone</label>
            <input
              type="tel"
              placeholder="+1 555 000 0000"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              style={inputStyle}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label style={labelStyle}>Categories</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {categories.map(cat => {
                  const active = selectedCategories.includes(cat.id)
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '5px 12px',
                        borderRadius: '20px',
                        border: `1px solid ${active ? cat.color : 'rgba(255,255,255,0.1)'}`,
                        background: active ? `${cat.color}22` : 'transparent',
                        color: active ? '#fff' : '#6b7280',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span style={{
                        width: '8px', height: '8px', borderRadius: '50%',
                        background: cat.color,
                        boxShadow: active ? `0 0 6px ${cat.color}` : 'none',
                      }} />
                      {cat.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {createContact.error && (
            <p style={{ color: '#f87171', fontSize: '13px' }}>
              {(createContact.error as Error).message}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={onClose} style={cancelStyle}>Cancel</button>
            <button
              type="submit"
              disabled={createContact.isPending || !name.trim()}
              style={submitStyle}
            >
              {createContact.isPending ? 'Adding…' : 'Add person'}
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
