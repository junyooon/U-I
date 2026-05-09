import { useState } from 'react'
import { useCreateCategory } from '../api/categories'
import { useCreateContact } from '../api/contacts'
import { useAuthStore } from '../store/auth'
import type { Category } from '../types'

interface Props {
  onComplete: () => void
  existingCategories: Category[]
}

const PRESET_CIRCLES = [
  { emoji: '👨‍👩‍👧', label: 'Family',    color: '#EF4444' },
  { emoji: '🤝',       label: 'Friends',   color: '#4A90D9' },
  { emoji: '💼',       label: 'Work',      color: '#7C3AED' },
  { emoji: '🎓',       label: 'College',   color: '#10B981' },
  { emoji: '🏘',       label: 'Neighbors', color: '#F59E0B' },
  { emoji: '🏋️',       label: 'Gym',       color: '#EC4899' },
  { emoji: '⛪',       label: 'Church',    color: '#06B6D4' },
  { emoji: '🧭',       label: 'Mentor',    color: '#F97316' },
]

const LAST_CONTACT_OPTIONS = [
  { label: 'Today',      daysAgo: 0 },
  { label: 'This week',  daysAgo: 4 },
  { label: 'This month', daysAgo: 20 },
  { label: 'Not sure',   daysAgo: null },
]

function daysAgoToIso(days: number | null): string | null {
  if (days === null) return null
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export default function OnboardingModal({ onComplete, existingCategories }: Props) {
  const user = useAuthStore((s) => s.user)
  const firstName = user?.name?.split(' ')[0] ?? 'there'

  const [step, setStep] = useState(0)
  const [selectedCircles, setSelectedCircles] = useState<Set<string>>(new Set())
  const [createdCategories, setCreatedCategories] = useState<Category[]>([])

  const [personName, setPersonName] = useState('')
  const [personEmail, setPersonEmail] = useState('')
  const [personPhone, setPersonPhone] = useState('')
  const [personCategoryIds, setPersonCategoryIds] = useState<string[]>([])
  const [lastContact, setLastContact] = useState<number | null>(null)
  const [lastContactSet, setLastContactSet] = useState(false)

  const createCategory = useCreateCategory()
  const createContact = useCreateContact()

  function toggleCircle(label: string) {
    setSelectedCircles(prev => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }

  function togglePersonCategory(id: string) {
    setPersonCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function handleCirclesContinue() {
    const toCreate = PRESET_CIRCLES.filter(c => selectedCircles.has(c.label))
    const cats: Category[] = [...existingCategories]
    for (const preset of toCreate) {
      try {
        const res = await createCategory.mutateAsync({ name: preset.label, color: preset.color }) as Category
        cats.push(res)
      } catch {
        // best-effort
      }
    }
    setCreatedCategories(cats)
    setStep(2)
  }

  async function handlePersonAdd() {
    if (!personName.trim()) return
    try {
      await createContact.mutateAsync({
        name: personName.trim(),
        email: personEmail.trim() || null,
        phone: personPhone.trim() || null,
        category_ids: personCategoryIds,
        ...(lastContactSet ? { last_contact_at: daysAgoToIso(lastContact) } : {}),
      })
      setStep(3)
    } catch {
      // error shown inline
    }
  }

  function finish() {
    localStorage.setItem('ui_onboarding_done', '1')
    onComplete()
  }

  const allCategories = createdCategories.length > 0 ? createdCategories : existingCategories

  const TOTAL_STEPS = 4

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)',
      padding: '16px',
    }}>
      <div style={{
        width: '480px', maxWidth: '100%',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-md)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.07)' }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / TOTAL_STEPS) * 100}%`,
            background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            transition: 'width 0.4s ease',
          }} />
        </div>

        <div style={{ padding: '32px 32px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Step 0: Welcome ── */}
          {step === 0 && (
            <>
              <div>
                <p style={{ fontSize: '28px', marginBottom: '12px' }}>✦</p>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Welcome to U&amp;I, {firstName}!
                </h2>
                <p style={{ fontSize: '14px', color: '#9ca3af', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "There are friends in life, and there are friends for life."
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '8px' }}>
                  U&amp;I helps you visualize who's in your world and track how often you connect.
                </p>
                <p style={{ fontSize: '14px', color: '#6b7280', lineHeight: '1.6', marginTop: '8px' }}>
                  Let's set things up in about 2 minutes.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setStep(1)} style={primaryBtn}>
                  Get started →
                </button>
                <button onClick={finish} style={ghostBtn}>
                  Skip setup
                </button>
              </div>
            </>
          )}

          {/* ── Step 1: Pick circles ── */}
          {step === 1 && (
            <>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', color: '#4b5563', marginBottom: '8px' }}>
                  STEP 1 OF 3
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  What circles are you part of?
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  Pick the groups that matter to you. These become the categories in your graph.
                </p>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_CIRCLES.map(c => {
                  const active = selectedCircles.has(c.label)
                  return (
                    <button
                      key={c.label}
                      onClick={() => toggleCircle(c.label)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '8px 14px', borderRadius: '20px',
                        border: `1px solid ${active ? c.color : 'rgba(255,255,255,0.1)'}`,
                        background: active ? `${c.color}22` : 'rgba(255,255,255,0.03)',
                        color: active ? '#fff' : '#9ca3af',
                        fontSize: '13px', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{c.emoji}</span>
                      {c.label}
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleCirclesContinue}
                  disabled={createCategory.isPending}
                  style={primaryBtn}
                >
                  {createCategory.isPending ? 'Creating…' : selectedCircles.size > 0 ? `Create ${selectedCircles.size} circle${selectedCircles.size !== 1 ? 's' : ''} →` : 'Skip for now →'}
                </button>
              </div>
            </>
          )}

          {/* ── Step 2: Add first person ── */}
          {step === 2 && (
            <>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', color: '#4b5563', marginBottom: '8px' }}>
                  STEP 2 OF 3
                </p>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                  Who's important in your world?
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280' }}>
                  Add your first connection. You can add more anytime.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Name *</label>
                  <input
                    autoFocus
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                    placeholder="e.g. Sarah Chen"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input
                      type="email"
                      value={personEmail}
                      onChange={e => setPersonEmail(e.target.value)}
                      placeholder="optional"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input
                      type="tel"
                      value={personPhone}
                      onChange={e => setPersonPhone(e.target.value)}
                      placeholder="optional"
                      style={inputStyle}
                    />
                  </div>
                </div>

                {allCategories.length > 0 && (
                  <div>
                    <label style={labelStyle}>Circle</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {allCategories.map(cat => {
                        const active = personCategoryIds.includes(cat.id)
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => togglePersonCategory(cat.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '5px',
                              padding: '5px 11px', borderRadius: '20px',
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

                <div>
                  <label style={labelStyle}>Last time you connected</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {LAST_CONTACT_OPTIONS.map(opt => {
                      const active = lastContactSet && lastContact === opt.daysAgo
                      return (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() => { setLastContact(opt.daysAgo); setLastContactSet(true) }}
                          style={{
                            padding: '5px 12px', borderRadius: '20px',
                            border: `1px solid ${active ? '#3b82f6' : 'rgba(255,255,255,0.1)'}`,
                            background: active ? 'rgba(59,130,246,0.15)' : 'transparent',
                            color: active ? '#93c5fd' : '#6b7280',
                            fontSize: '12px', cursor: 'pointer', transition: 'all 0.15s',
                          }}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {createContact.error && (
                <p style={{ fontSize: '12px', color: '#f87171' }}>
                  {(createContact.error as Error).message}
                </p>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handlePersonAdd}
                  disabled={createContact.isPending || !personName.trim()}
                  style={{ ...primaryBtn, opacity: !personName.trim() ? 0.5 : 1 }}
                >
                  {createContact.isPending ? 'Adding…' : 'Add them →'}
                </button>
                <button onClick={() => setStep(3)} style={ghostBtn}>
                  Skip for now
                </button>
              </div>
            </>
          )}

          {/* ── Step 3: Done ── */}
          {step === 3 && (
            <>
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <p style={{ fontSize: '48px', marginBottom: '16px' }}>🎉</p>
                <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
                  Your world is ready!
                </h2>
                <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.6' }}>
                  Click any node to view details, log interactions, and keep your connections alive.
                </p>
              </div>

              <div style={{
                display: 'flex', flexDirection: 'column', gap: '10px',
                padding: '16px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.2px', color: '#4b5563' }}>QUICK TIPS</p>
                {[
                  ['⌖', 'Reset view recenters the camera anytime'],
                  ['◷', 'Use the Timeline to spot fading connections'],
                  ['⎘', 'Share your graph publicly with a link'],
                ].map(([icon, tip]) => (
                  <div key={tip} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#4b5563', flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{tip}</span>
                  </div>
                ))}
              </div>

              <button onClick={finish} style={primaryBtn}>
                Explore your world →
              </button>
            </>
          )}
        </div>

        {/* Step indicator dots */}
        {step > 0 && step < 3 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', paddingBottom: '20px' }}>
            {[1, 2].map(s => (
              <div key={s} style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: step === s ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                transition: 'background 0.2s',
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const primaryBtn: React.CSSProperties = {
  flex: 1, padding: '10px 20px', borderRadius: '8px',
  border: 'none', background: '#3b82f6',
  color: '#fff', fontSize: '14px', fontWeight: 600,
  cursor: 'pointer',
}

const ghostBtn: React.CSSProperties = {
  padding: '10px 16px', borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'transparent', color: '#4b5563',
  fontSize: '13px', cursor: 'pointer',
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
