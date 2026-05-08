import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import CenterNode from './CenterNode'
import ContactNode from './ContactNode'
import { useGraphStore } from '../../store/graph'
import type { GraphData } from '../../types'

interface Props {
  data: GraphData
  onSelectNode: (id: string) => void
}

const DEFAULT_POSITION: [number, number, number] = [0, 20, 160]

export default function Scene({ data, onSelectNode }: Props) {
  const hiddenCategories = useGraphStore((s) => s.hiddenCategories)
  const controlsRef = useRef<OrbitControlsImpl>(null)

  function resetView() {
    const controls = controlsRef.current
    if (!controls) return
    controls.object.position.set(...DEFAULT_POSITION)
    controls.target.set(0, 0, 0)
    controls.update()
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: 'radial-gradient(ellipse at 50% 40%, #1a2040 0%, #0a0f1e 40%, #050810 70%, #010208 100%)',
    }}>
      <Canvas
        camera={{ position: DEFAULT_POSITION, fov: 55 }}
        gl={{ antialias: true }}
      >
        <Stars radius={300} depth={60} count={5000} factor={3} saturation={0} fade speed={0.3} />
        <ambientLight intensity={0.15} />
        <CenterNode />
        {data.nodes.map((node, i) => {
          const visible = node.category_ids.length === 0
            || node.category_ids.some(id => !hiddenCategories.has(id))
          return (
            <ContactNode
              key={node.id}
              node={node}
              index={i}
              total={data.nodes.length}
              visible={visible}
              onSelect={onSelectNode}
            />
          )
        })}
        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={40}
          maxDistance={220}
          autoRotate
          autoRotateSpeed={0.15}
          zoomToCursor
        />
      </Canvas>

      <button
        onClick={resetView}
        title="Reset view"
        style={{
          position: 'absolute',
          bottom: '24px',
          right: '24px',
          background: 'rgba(10,10,22,0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '8px',
          color: '#6b7280',
          fontSize: '13px',
          padding: '8px 14px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#e5e7eb')}
        onMouseLeave={e => (e.currentTarget.style.color = '#6b7280')}
      >
        ⌖ Reset view
      </button>
    </div>
  )
}
