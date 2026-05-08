import Scene from '../components/graph/Scene'
import Sidebar from '../components/Sidebar'
import { useGraph } from '../api/hooks'

export default function GraphPage() {
  const { data, isLoading, error } = useGraph()

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#010208',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#4b5563',
        fontSize: '14px',
      }}>
        Loading your constellation…
      </div>
    )
  }

  if (error || !data) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#010208',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#f87171',
        fontSize: '14px',
      }}>
        Could not load graph. Please refresh.
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar categories={data.categories} nodes={data.nodes} userName={data.center.name} />
      <Scene data={data} />
    </div>
  )
}
