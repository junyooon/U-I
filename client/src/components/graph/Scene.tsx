import { useRef, useEffect } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import CenterNode from './CenterNode'
import ContactNode from './ContactNode'
import { useGraphStore } from '../../store/graph'
import type { GraphData } from '../../types'

interface Props {
  data: GraphData
  onSelectNode: (id: string) => void
  focusedNodeId: string | null
}

const DEFAULT_POSITION: [number, number, number] = [0, 20, 160]

function CameraFocus({
  controlsRef,
  focusTriggerRef,
  positionsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsImpl>
  focusTriggerRef: React.MutableRefObject<string | null>
  positionsRef: React.MutableRefObject<Map<string, THREE.Vector3>>
}) {
  const { camera } = useThree()
  const lerpTarget = useRef<THREE.Vector3 | null>(null)
  const camDest = useRef(new THREE.Vector3())

  useFrame(() => {
    // Pick up a new focus trigger
    if (focusTriggerRef.current) {
      const pos = positionsRef.current.get(focusTriggerRef.current)
      if (pos) {
        lerpTarget.current = pos.clone()
        focusTriggerRef.current = null
      }
    }

    const controls = controlsRef.current
    if (!controls || !lerpTarget.current) return

    controls.target.lerp(lerpTarget.current, 0.07)

    // Pull camera to distance 60 from the node along its current direction
    const dir = camera.position.clone().sub(lerpTarget.current).normalize()
    camDest.current.copy(lerpTarget.current).addScaledVector(dir, 60)
    camera.position.lerp(camDest.current, 0.07)

    controls.update()

    if (controls.target.distanceTo(lerpTarget.current) < 0.3) {
      lerpTarget.current = null
    }
  })

  return null
}

export default function Scene({ data, onSelectNode, focusedNodeId }: Props) {
  const hiddenCategories = useGraphStore((s) => s.hiddenCategories)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const nodePositionsRef = useRef<Map<string, THREE.Vector3>>(new Map())
  const focusTriggerRef = useRef<string | null>(null)

  useEffect(() => {
    if (focusedNodeId) focusTriggerRef.current = focusedNodeId
  }, [focusedNodeId])

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
              positionsRef={nodePositionsRef}
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
        <CameraFocus controlsRef={controlsRef} focusTriggerRef={focusTriggerRef} positionsRef={nodePositionsRef} />
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
