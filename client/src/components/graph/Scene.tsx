import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import CenterNode from './CenterNode'
import ContactNode from './ContactNode'
import { useGraphStore } from '../../store/graph'
import type { GraphData } from '../../types'

interface Props {
  data: GraphData
  onSelectNode: (id: string) => void
}

export default function Scene({ data, onSelectNode }: Props) {
  const hiddenCategories = useGraphStore((s) => s.hiddenCategories)

  return (
    <div style={{
      flex: 1,
      background: 'radial-gradient(ellipse at 50% 40%, #1a2040 0%, #0a0f1e 40%, #050810 70%, #010208 100%)',
    }}>
      <Canvas
        camera={{ position: [0, 20, 160], fov: 55 }}
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
          enablePan={false}
          minDistance={40}
          maxDistance={220}
          autoRotate
          autoRotateSpeed={0.15}
        />
      </Canvas>
    </div>
  )
}
