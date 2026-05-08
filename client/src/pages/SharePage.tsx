import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchPublicGraph } from '../api/share'
import Scene from '../components/graph/Scene'
import type { GraphData } from '../types'

type PublicGraph = GraphData & { owner: string }

export default function SharePage() {
  const { token } = useParams<{ token: string }>()
  const [data, setData] = useState<PublicGraph | null>(null)
  const [error, setError] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!token) return
    fetchPublicGraph(token)
      .then(setData)
      .catch(() => setError(true))
  }, [token])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 50% 40%, #1a2040 0%, #0a0f1e 40%, #050810 70%, #010208 100%)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: '12px',
      }}>
        <p style={{ fontSize: '32px' }}>🔗</p>
        <p style={{ color: '#f87171', fontSize: '15px', fontWeight: 600 }}>This share link has been revoked or doesn't exist.</p>
        <a href="/" style={{ color: '#4b5563', fontSize: '13px', textDecoration: 'none' }}>← Back to U&amp;I</a>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#010208',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#4b5563', fontSize: '14px',
      }}>
        Loading…
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <Scene data={data} onSelectNode={() => {}} focusedNodeId={null} />

      {/* Top-left: owner badge */}
      <div style={{
        position: 'absolute', top: '24px', left: '24px',
        display: 'flex', flexDirection: 'column', gap: '6px',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(8,8,18,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '10px 16px',
          backdropFilter: 'blur(12px)',
        }}>
          <span style={{ fontSize: '18px', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>U&amp;I</span>
          <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '13px', color: '#9ca3af' }}>{data.owner}'s world</span>
          <span style={{
            fontSize: '10px', fontWeight: 600, letterSpacing: '0.05em',
            color: '#4b5563', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '4px', padding: '2px 6px',
          }}>VIEW ONLY</span>
        </div>
        <p style={{ fontSize: '11px', color: '#374151', paddingLeft: '4px' }}>
          {data.nodes.length} connection{data.nodes.length !== 1 ? 's' : ''} · {data.categories.length} categor{data.categories.length !== 1 ? 'ies' : 'y'}
        </p>
      </div>

      {/* Top-right: copy link */}
      <button
        onClick={copyLink}
        style={{
          position: 'absolute', top: '24px', right: '24px',
          background: 'rgba(8,8,18,0.85)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          color: copied ? '#4ade80' : '#6b7280',
          fontSize: '13px',
          padding: '9px 16px',
          cursor: 'pointer',
          backdropFilter: 'blur(12px)',
          transition: 'color 0.15s',
          display: 'flex', alignItems: 'center', gap: '6px',
        }}
        onMouseEnter={e => { if (!copied) e.currentTarget.style.color = '#e5e7eb' }}
        onMouseLeave={e => { if (!copied) e.currentTarget.style.color = '#6b7280' }}
      >
        {copied ? '✓ Copied' : '⎘ Copy link'}
      </button>
    </div>
  )
}
