import { useGraphStore } from '../store/graph'
import type { Category, GraphNode } from '../types'

interface Props {
  categories: Category[]
  nodes: GraphNode[]
  userName: string
}

export default function Sidebar({ categories, nodes, userName }: Props) {
  const { hiddenCategories, toggleCategory } = useGraphStore()

  // Find most drifted contact for the notification
  const mostDrifted = nodes.reduce<GraphNode | null>(
    (acc, n) => (!acc || n.drift_velocity > acc.drift_velocity) ? n : acc,
    null
  )

  return (
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
        <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', color: '#fff' }}>
          U&amp;I
        </h1>
        <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
          Your world of connections
        </p>
      </div>

      {/* Categories */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '1.5px', color: '#4b5563', marginBottom: '12px' }}>
          CATEGORIES
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {categories.map(cat => {
            const hidden = hiddenCategories.has(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 0',
                  color: hidden ? '#4b5563' : '#e5e7eb',
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'color 0.15s',
                }}
              >
                {/* Checkmark */}
                <span style={{ width: '14px', color: hidden ? 'transparent' : '#6b7280', fontSize: '12px' }}>✓</span>
                {/* Color dot */}
                <span style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: cat.color,
                  flexShrink: 0,
                  opacity: hidden ? 0.3 : 1,
                  boxShadow: hidden ? 'none' : `0 0 6px ${cat.color}`,
                }} />
                {cat.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button style={{
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
        }}>
          <span>👤</span> Add a person
        </button>
        <button style={{
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
        }}>
          <span>+</span> New category
        </button>
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
          <button style={{
            flexShrink: 0,
            fontSize: '12px',
            color: '#60a5fa',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}>
            Say hello
          </button>
        </div>
      )}
    </div>
  )
}
