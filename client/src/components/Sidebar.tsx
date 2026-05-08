import { useState } from 'react'
import { useGraphStore } from '../store/graph'
import { useIntegrations, useConnectGoogle, useSyncNow } from '../api/integrations'
import { useAuthStore } from '../store/auth'
import { apiFetch } from '../api/client'
import { useDeleteCategory } from '../api/categories'
import AddPersonModal from './AddPersonModal'
import AddCategoryModal from './AddCategoryModal'
import type { Category, GraphNode } from '../types'

interface Props {
  categories: Category[]
  nodes: GraphNode[]
}

export default function Sidebar({ categories, nodes }: Props) {
  const { hiddenCategories, toggleCategory } = useGraphStore()
  const { data: intData } = useIntegrations()
  const connectGoogle = useConnectGoogle()
  const syncNow = useSyncNow()
  const { token, clearAuth } = useAuthStore()

  const [showAddPerson, setShowAddPerson] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [hoveredCatId, setHoveredCatId] = useState<string | null>(null)
  const [confirmDeleteCatId, setConfirmDeleteCatId] = useState<string | null>(null)
  const deleteCategory = useDeleteCategory()

  const googleConnected = intData?.integrations.some(
    i => i.provider === 'google_email' && i.status === 'connected'
  )

  const mostDrifted = nodes.reduce<GraphNode | null>(
    (acc, n) => (!acc || n.drift_velocity > acc.drift_velocity) ? n : acc,
    null
  )

  async function handleLogout() {
    try {
      await apiFetch('/auth/logout', token!, { method: 'POST' })
    } catch {
      // best-effort
    }
    clearAuth()
    window.location.href = '/login'
  }

  return (
    <>
      {showAddPerson && (
        <AddPersonModal categories={categories} onClose={() => setShowAddPerson(false)} />
      )}
      {showAddCategory && (
        <AddCategoryModal onClose={() => setShowAddCategory(false)} />
      )}

      <div style={{
        width: '280px',
        minHeight: '100vh',
        background: 'rgba(8,8,18,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        flexDirection: 'column',
        padding: '28px 24px',
        position: 'relative',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>
              U&amp;I
            </h1>
            <button
              onClick={handleLogout}
              title="Log out"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#4b5563',
                fontSize: '13px',
                padding: '4px',
                lineHeight: 1,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#9ca3af')}
              onMouseLeave={e => (e.currentTarget.style.color = '#4b5563')}
            >
              ⎋
            </button>
          </div>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
            Your world of connections
          </p>
        </div>

        {/* Node count */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          padding: '10px 14px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff' }}>{nodes.length}</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {nodes.length === 1 ? 'person' : 'people'} in your world
          </span>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', color: '#4b5563', marginBottom: '12px' }}>
            CATEGORIES
          </p>
          {categories.length === 0 ? (
            <p style={{ fontSize: '13px', color: '#4b5563', fontStyle: 'italic' }}>No categories yet</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {categories.map(cat => {
                const hidden = hiddenCategories.has(cat.id)
                const isConfirming = confirmDeleteCatId === cat.id
                return (
                  <div
                    key={cat.id}
                    onMouseEnter={() => setHoveredCatId(cat.id)}
                    onMouseLeave={() => { setHoveredCatId(null); setConfirmDeleteCatId(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 0' }}
                  >
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        color: hidden ? '#4b5563' : '#e5e7eb',
                        fontSize: '14px',
                        textAlign: 'left',
                        transition: 'color 0.15s',
                        minWidth: 0,
                      }}
                    >
                      <span style={{ width: '14px', color: hidden ? 'transparent' : '#6b7280', fontSize: '12px', flexShrink: 0 }}>✓</span>
                      <span style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: cat.color, flexShrink: 0,
                        opacity: hidden ? 0.3 : 1,
                        boxShadow: hidden ? 'none' : `0 0 6px ${cat.color}`,
                      }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                    </button>
                    {hoveredCatId === cat.id && (
                      isConfirming ? (
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button
                            onClick={() => {
                              deleteCategory.mutate(cat.id)
                              setConfirmDeleteCatId(null)
                            }}
                            style={{ fontSize: '11px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteCatId(null)}
                            style={{ fontSize: '11px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteCatId(cat.id)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: '#4b5563', fontSize: '13px', padding: '0 2px',
                            lineHeight: 1, flexShrink: 0,
                          }}
                        >
                          🗑
                        </button>
                      )
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => setShowAddPerson(true)}
            style={actionBtnStyle}
          >
            <span>👤</span> Add a person
          </button>
          <button
            onClick={() => setShowAddCategory(true)}
            style={actionBtnStyle}
          >
            <span>+</span> New category
          </button>
        </div>

        {/* Integrations */}
        <div style={{ marginTop: 'auto', paddingTop: '24px', paddingBottom: mostDrifted && mostDrifted.drift_velocity > 0.3 ? '80px' : '0' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', color: '#4b5563', marginBottom: '10px' }}>
            INTEGRATIONS
          </p>
          {googleConnected ? (
            <button
              onClick={() => syncNow.mutate()}
              disabled={syncNow.isPending}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(74,222,128,0.25)',
                background: 'rgba(74,222,128,0.06)',
                color: '#4ade80',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <span>●</span>
              {syncNow.isPending ? 'Syncing…' : 'Google connected · Sync now'}
            </button>
          ) : (
            <button
              onClick={() => connectGoogle.mutate()}
              disabled={connectGoogle.isPending}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.04)',
                color: '#9ca3af',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              <span>⊕</span> Connect Google
            </button>
          )}
        </div>

        {/* Bottom notification */}
        {mostDrifted && mostDrifted.drift_velocity > 0.3 && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 20px',
            borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(8,8,18,0.98)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>💬</span>
              <p style={{ fontSize: '12px', color: '#9ca3af', lineHeight: '1.4' }}>
                It's been a while since you've connected with{' '}
                <strong style={{ color: '#e5e7eb' }}>{mostDrifted.name}</strong>.
              </p>
            </div>
            <button
              onClick={() => {
                if (mostDrifted.name) {
                  const subject = encodeURIComponent(`Hey ${mostDrifted.name.split(' ')[0]}!`)
                  window.open(`mailto:?subject=${subject}`, '_blank')
                }
              }}
              style={{
                flexShrink: 0,
                fontSize: '12px',
                color: '#60a5fa',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Say hello
            </button>
          </div>
        )}
      </div>
    </>
  )
}

const actionBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 14px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.04)',
  color: '#9ca3af',
  fontSize: '13px',
  cursor: 'pointer',
  textAlign: 'left',
}
