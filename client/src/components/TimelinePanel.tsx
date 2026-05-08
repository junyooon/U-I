import { useEffect } from 'react'
import { useTimeline } from '../api/timeline'

interface Props {
  onClose: () => void
  onSelectContact: (id: string) => void
}

function relativeTime(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
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

function formatDay(dateStr: string): string {
  const date = new Date(dateStr)
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TimelinePanel({ onClose, onSelectContact }: Props) {
  const { data, isLoading } = useTimeline()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Group interactions by day
  type InteractionItem = NonNullable<typeof data>['interactions'][number]
  const grouped: { day: string; items: InteractionItem[] }[] = []
  if (data?.interactions) {
    for (const interaction of data.interactions) {
      const day = formatDay(interaction.occurred_at)
      const last = grouped[grouped.length - 1]
      if (last && last.day === day) {
        last.items.push(interaction)
      } else {
        grouped.push({ day, items: [interaction] })
      }
    }
  }

  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={onClose} />

      <div style={{
        position: 'fixed',
        top: 0, right: 0, bottom: 0,
        width: '360px',
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
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: 700, margin: 0 }}>Timeline</h2>
            <p style={{ color: '#4b5563', fontSize: '12px', marginTop: '3px' }}>Your history of connections</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: '18px', lineHeight: 1, padding: '2px' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {isLoading ? (
            <p style={{ color: '#4b5563', fontSize: '13px' }}>Loading…</p>
          ) : (
            <>
              {/* Drifting contacts */}
              {data && data.drifting.filter(c => c.drift_score > 0.3).length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <p style={sectionLabel}>GOING QUIET</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {data.drifting
                      .filter(c => c.drift_score > 0.3)
                      .map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => { onSelectContact(contact.id); onClose() }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            background: 'rgba(255,255,255,0.02)',
                            cursor: 'pointer', textAlign: 'left', width: '100%',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                        >
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                            background: contact.primary_color,
                            boxShadow: `0 0 6px ${contact.primary_color}`,
                          }} />
                          <span style={{ flex: 1, fontSize: '13px', color: '#e5e7eb' }}>{contact.name}</span>
                          <span style={{ fontSize: '11px', color: '#4b5563', flexShrink: 0 }}>
                            {contact.last_contact_at ? relativeTime(contact.last_contact_at) : 'Never'}
                          </span>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Interaction feed */}
              <div>
                <p style={sectionLabel}>RECENT ACTIVITY</p>
                {grouped.length === 0 ? (
                  <p style={{ color: '#4b5563', fontSize: '13px', fontStyle: 'italic' }}>No interactions yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {grouped.map(group => (
                      <div key={group.day}>
                        {/* Day label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600, whiteSpace: 'nowrap' }}>
                            {group.day}
                          </span>
                          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                        </div>
                        {/* Events */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {group.items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => { onSelectContact(item.contact.id); onClose() }}
                              style={{
                                display: 'flex', alignItems: 'flex-start', gap: '10px',
                                padding: '10px 12px', borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.05)',
                                background: 'rgba(255,255,255,0.02)',
                                cursor: 'pointer', textAlign: 'left', width: '100%',
                              }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                            >
                              <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: item.contact.primary_color, flexShrink: 0, marginTop: '3px',
                                boxShadow: `0 0 5px ${item.contact.primary_color}`,
                              }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                                  <span style={{ fontSize: '13px', color: '#e5e7eb', fontWeight: 500 }}>
                                    {item.contact.name}
                                  </span>
                                  <span style={{ fontSize: '11px', color: '#4b5563', flexShrink: 0 }}>
                                    {typeLabel(item.type)}
                                  </span>
                                </div>
                                {item.notes && (
                                  <p style={{
                                    fontSize: '12px', color: '#6b7280', marginTop: '3px',
                                    lineHeight: '1.4', overflow: 'hidden',
                                    display: '-webkit-box', WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                  }}>
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
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

const sectionLabel: React.CSSProperties = {
  fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px',
  color: '#4b5563', marginBottom: '12px',
}
