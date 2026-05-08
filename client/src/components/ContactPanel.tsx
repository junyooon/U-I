import { useEffect, useState } from 'react'
import { useContact, useCreateInteraction, useDeleteInteraction, useDeleteContact, usePatchContact } from '../api/contacts'
import type { Category } from '../types'

interface Props {
  contactId: string
  categories: Category[]
  onClose: () => void
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', color: '#6b7280',
  marginBottom: '6px', fontWeight: 500,
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)', color: '#fff',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function typeLabel(type: string): string {
  if (type === 'in_person') return 'In person'
  if (type === 'email') return 'Email'
  if (type === 'call') return 'Call'
  if (type === 'sms') return 'SMS'
  return 'Manual log'
}

export default function ContactPanel({ contactId, categories, onClose }: Props) {
  const { data, isLoading } = useContact(contactId)
  const createInteraction = useCreateInteraction(contactId)
  const deleteInteraction = useDeleteInteraction(contactId)
  const deleteContact = useDeleteContact()
  const patchContact = usePatchContact(contactId)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [confirmDeleteContact, setConfirmDeleteContact] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editCategoryIds, setEditCategoryIds] = useState<string[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const contact = data?.contact
  const interactions = data?.interactions ?? []

  const catMap = Object.fromEntries(categories.map(c => [c.id, c]))
  const contactCategories = contact?.category_ids.map(id => catMap[id]).filter(Boolean) ?? []

  function handleSayHello() {
    if (!contact) return
    const first = contact.name.split(' ')[0]
    const parts: string[] = []
    if (contact.email) parts.push(`mailto:${contact.email}?subject=${encodeURIComponent(`Hey ${first}!`)}`)
    const url = parts[0] ?? `mailto:?subject=${encodeURIComponent(`Hey ${first}!`)}`
    window.open(url, '_blank')
    createInteraction.mutate({
      type: 'manual',
      occurred_at: new Date().toISOString(),
      notes: 'Reached out via email',
    })
  }

  function handleLogInPerson() {
    createInteraction.mutate({
      type: 'in_person',
      occurred_at: new Date().toISOString(),
    })
  }

  function openEdit() {
    if (!contact) return
    setEditName(contact.name)
    setEditEmail(contact.email ?? '')
    setEditPhone(contact.phone ?? '')
    setEditNotes(contact.notes ?? '')
    setEditCategoryIds(contact.category_ids)
    setEditing(true)
  }

  function toggleEditCategory(id: string) {
    setEditCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])
  }

  async function handleSave() {
    await patchContact.mutateAsync({
      name: editName.trim(),
      email: editEmail.trim() || null,
      phone: editPhone.trim() || null,
      notes: editNotes.trim() || null,
      category_ids: editCategoryIds,
    })
    setEditing(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 40 }}
        onClick={onClose}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: '340px',
        zIndex: 45,
        background: 'rgba(10,10,22,0.97)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(16px)',
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 24px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {isLoading ? (
              <div style={{ color: '#4b5563', fontSize: '14px' }}>Loading…</div>
            ) : (
              <>
                <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                  {contact?.name}
                </h2>
                {contact?.last_contact_at && (
                  <p style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px' }}>
                    Last contact {relativeTime(contact.last_contact_at)}
                  </p>
                )}
                {!contact?.last_contact_at && (
                  <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px' }}>Never contacted</p>
                )}
                {contact?.notes && (
                  <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '4px', fontStyle: 'italic' }}>
                    {contact.notes}
                  </p>
                )}
              </>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#4b5563', fontSize: '18px', lineHeight: 1, padding: '2px',
              }}
            >
              ✕
            </button>
            {contact && !editing && (
              confirmDeleteContact ? (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => deleteContact.mutate(contactId, { onSuccess: onClose })}
                    disabled={deleteContact.isPending}
                    style={{
                      fontSize: '11px', color: '#f87171',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    {deleteContact.isPending ? 'Removing…' : 'Remove'}
                  </button>
                  <button
                    onClick={() => setConfirmDeleteContact(false)}
                    style={{
                      fontSize: '11px', color: '#4b5563',
                      background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={openEdit}
                    title="Edit contact"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#4b5563', fontSize: '14px', lineHeight: 1, padding: '2px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => setConfirmDeleteContact(true)}
                    title="Remove from world"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#4b5563', fontSize: '14px', lineHeight: 1, padding: '2px',
                      transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
                  >
                    🗑
                  </button>
                </div>
              )
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {contact && editing ? (
            /* ── Edit form ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Name *</label>
                <input
                  autoFocus
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  placeholder="—"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={e => setEditPhone(e.target.value)}
                  placeholder="—"
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Notes</label>
                <textarea
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder="How you know them, context, etc."
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    lineHeight: '1.5',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
              {categories.length > 0 && (
                <div>
                  <label style={labelStyle}>Categories</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {categories.map(cat => {
                      const active = editCategoryIds.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleEditCategory(cat.id)}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '5px',
                            padding: '4px 10px', borderRadius: '20px',
                            border: `1px solid ${active ? cat.color : 'rgba(255,255,255,0.1)'}`,
                            background: active ? `${cat.color}22` : 'transparent',
                            color: active ? '#fff' : '#6b7280',
                            fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color }} />
                          {cat.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
              {patchContact.error && (
                <p style={{ color: '#f87171', fontSize: '12px' }}>{(patchContact.error as Error).message}</p>
              )}
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={handleSave}
                  disabled={patchContact.isPending || !editName.trim()}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: '8px',
                    border: 'none', background: '#3b82f6',
                    color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {patchContact.isPending ? 'Saving…' : 'Save'}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: '#6b7280',
                    fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : contact && (
            <>
              {/* Contact info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                {contact.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#4b5563', fontSize: '13px', width: '52px', flexShrink: 0 }}>Email</span>
                    <a
                      href={`mailto:${contact.email}`}
                      style={{ color: '#60a5fa', fontSize: '13px', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {contact.email}
                    </a>
                  </div>
                )}
                {contact.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#4b5563', fontSize: '13px', width: '52px', flexShrink: 0 }}>Phone</span>
                    <a
                      href={`tel:${contact.phone}`}
                      style={{ color: '#60a5fa', fontSize: '13px', textDecoration: 'none' }}
                    >
                      {contact.phone}
                    </a>
                  </div>
                )}
              </div>

              {/* Categories */}
              {contactCategories.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
                  {contactCategories.map(cat => (
                    <span key={cat.id} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '5px',
                      padding: '3px 10px', borderRadius: '20px',
                      border: `1px solid ${cat.color}44`,
                      background: `${cat.color}18`,
                      fontSize: '11px', color: '#d1d5db',
                    }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cat.color }} />
                      {cat.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '28px' }}>
                <button
                  onClick={handleSayHello}
                  disabled={createInteraction.isPending}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#3b82f6',
                    color: '#fff',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Say hello
                </button>
                <button
                  onClick={handleLogInPerson}
                  disabled={createInteraction.isPending}
                  style={{
                    flex: 1,
                    padding: '9px 0',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.04)',
                    color: '#9ca3af',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                >
                  Log in person
                </button>
              </div>

              {/* Interaction history */}
              <div>
                <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', color: '#4b5563', marginBottom: '12px' }}>
                  HISTORY
                </p>
                {interactions.length === 0 ? (
                  <p style={{ color: '#4b5563', fontSize: '13px', fontStyle: 'italic' }}>No interactions yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {interactions.map(i => (
                      <div key={i.id} style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 500 }}>
                            {typeLabel(i.type)}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                            <span style={{ fontSize: '11px', color: '#4b5563' }}>
                              {relativeTime(i.occurred_at)}
                            </span>
                            {confirmDeleteId === i.id ? (
                              <>
                                <button
                                  onClick={() => {
                                    deleteInteraction.mutate(i.id)
                                    setConfirmDeleteId(null)
                                  }}
                                  style={{ fontSize: '11px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  Delete
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(i.id)}
                                style={{ fontSize: '11px', color: '#4b5563', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                        {i.notes && (
                          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', lineHeight: '1.4' }}>
                            {i.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
