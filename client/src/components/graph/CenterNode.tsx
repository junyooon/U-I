import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function CenterNode() {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const pulse = 1 + 0.08 * Math.sin(t * 1.5)
    if (meshRef.current) meshRef.current.scale.setScalar(pulse)
    if (glowRef.current) glowRef.current.scale.setScalar(pulse * 1.5)
  })

  return (
    <group>
      <pointLight intensity={80} distance={60} color="#ffffff" />
      {/* Outer glow */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[7, 32, 32]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.06} />
      </mesh>
      {/* Mid glow */}
      <mesh>
        <sphereGeometry args={[5.5, 32, 32]} />
        <meshBasicMaterial color="#d0e8ff" transparent opacity={0.12} />
      </mesh>
      {/* Core */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#a0c8ff"
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.1}
        />
      </mesh>
    </group>
  )
}
