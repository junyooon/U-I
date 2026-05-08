import { useRef, useState, useMemo } from 'react'
import type React from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { GraphNode } from '../../types'

interface Props {
  node: GraphNode
  index: number
  total: number
  visible: boolean
  onSelect: (id: string) => void
  positionsRef: React.RefObject<Map<string, THREE.Vector3>>
}

const DRIFT_SPEED = 0.0003 // radians/second at drift_velocity = 1.0
const Y_AXIS = new THREE.Vector3(0, 1, 0)

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(31, h) + id.charCodeAt(i) | 0
  }
  return Math.abs(h)
}

function fibonacciPoint(index: number, total: number, radius: number): THREE.Vector3 {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / total)
  const theta = Math.PI * (1 + Math.sqrt(5)) * index
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi),
  )
}

export default function ContactNode({ node, index, total, visible, onSelect, positionsRef }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)

  // Deterministic initial angular offset from ID so nodes don't all start at same phase
  const initialOffset = useMemo(() => (hashId(node.id) % 1000) / 1000 * Math.PI * 2, [node.id])
  const angleRef = useRef(initialOffset)

  // Base position on Fibonacci sphere
  const basePos = useMemo(
    () => fibonacciPoint(index, total, node.distance),
    [index, total, node.distance]
  )

  useFrame((_, delta) => {
    if (!groupRef.current || !visible) return
    angleRef.current += node.drift_velocity * DRIFT_SPEED * delta
    const rotated = basePos.clone().applyAxisAngle(Y_AXIS, angleRef.current)
    groupRef.current.position.copy(rotated)
    positionsRef.current?.set(node.id, groupRef.current.position.clone())
  })

  const daysSince = node.last_contact_at
    ? Math.floor((Date.now() - new Date(node.last_contact_at).getTime()) / 86_400_000)
    : null

  const color = node.primary_color

  if (!visible) return null

  return (
    <group ref={groupRef}>
      {/* Glow halo */}
      <mesh>
        <sphereGeometry args={[3.2, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={hovered ? 0.25 : 0.12} />
      </mesh>
      {/* Core sphere */}
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true) }}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => { e.stopPropagation(); onSelect(node.id) }}
      >
        <sphereGeometry args={[2, 24, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.9 : 0.5}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      {/* Tooltip */}
      {hovered && (
        <Html distanceFactor={60} style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(10,10,20,0.85)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            padding: '8px 12px',
            color: '#fff',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            lineHeight: '1.5',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontWeight: 600 }}>{node.name}</div>
            <div style={{ color: '#9ca3af', fontSize: '12px' }}>
              {daysSince !== null ? `${daysSince}d ago` : 'Never contacted'}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
