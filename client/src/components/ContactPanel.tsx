import { useEffect, useState } from 'react'
import { useContact, useCreateInteraction, useDeleteInteraction } from '../api/contacts'
import type { Category } from '../types'

interface Props {
  contactId: string
  categories: Category[]
  onClose: () => void
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

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
              </>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#4b5563', fontSize: '18px', lineHeight: 1, padding: '2px',
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {contact && (
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
