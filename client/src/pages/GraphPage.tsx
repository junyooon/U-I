import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import Scene from '../components/graph/Scene'
import Sidebar from '../components/Sidebar'
import ContactPanel from '../components/ContactPanel'
import ShareButton from '../components/ShareButton'
import { useGraph } from '../api/hooks'
import { useIsMobile } from '../hooks/useIsMobile'

export default function GraphPage() {
  const { data, isLoading, error } = useGraph()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()
  const [banner, setBanner] = useState<'connected' | 'error' | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  function selectNode(id: string) {
    setSelectedNodeId(id)
    setFocusedNodeId(id)
    if (isMobile) setSidebarOpen(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const integration = params.get('integration')
    if (integration === 'connected') {
      setBanner('connected')
      queryClient.invalidateQueries({ queryKey: ['graph'] })
      queryClient.invalidateQueries({ queryKey: ['integrations'] })
    } else if (integration === 'error') {
      setBanner('error')
    }
    if (integration) window.history.replaceState({}, '', '/')
  }, [queryClient])

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#010208',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#4b5563', fontSize: '14px',
      }}>
        Loading your world…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh', background: '#010208',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#f87171', fontSize: '14px',
      }}>
        Could not load graph. Please refresh.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        categories={data.categories}
        nodes={data.nodes}
        onSelectNode={selectNode}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, position: 'relative' }}>
        <Scene data={data} onSelectNode={selectNode} focusedNodeId={focusedNodeId} />

        {/* Hamburger — mobile only */}
        {isMobile && (
          <button
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'absolute', top: '16px', left: '16px', zIndex: 10,
              background: 'rgba(10,10,22,0.85)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#9ca3af', fontSize: '18px', lineHeight: 1,
              padding: '8px 10px', cursor: 'pointer',
              backdropFilter: 'blur(8px)',
            }}
          >
            ☰
          </button>
        )}

        <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10 }}>
          <ShareButton />
        </div>
      </div>
      {selectedNodeId && (
        <ContactPanel
          contactId={selectedNodeId}
          categories={data.categories}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
      {banner && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          padding: '12px 20px', borderRadius: '10px',
          background: banner === 'connected' ? 'rgba(74,222,128,0.12)' : 'rgba(248,113,113,0.12)',
          border: `1px solid ${banner === 'connected' ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
          color: banner === 'connected' ? '#4ade80' : '#f87171',
          fontSize: '13px',
          backdropFilter: 'blur(8px)',
          cursor: 'pointer',
        }} onClick={() => setBanner(null)}>
          {banner === 'connected'
            ? '✓ Google connected — syncing your contacts'
            : '✗ Google connection failed. Try again.'}
        </div>
      )}
    </div>
  )
}
