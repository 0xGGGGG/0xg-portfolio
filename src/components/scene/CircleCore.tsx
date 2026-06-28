import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import { useNav } from '@/lib/scroll/store'
import { RADIUS } from './sceneConfig'

/** the central ring the diamonds sit on + faint concentric guides.
 *  the main ring is dim at the index and brightens when a project opens. */
export default function CircleCore() {
  const ring = useRef<MeshStandardMaterial>(null)

  useFrame((_, dt) => {
    if (ring.current) {
      const target = useNav.getState().open ? 0.55 : 0.12
      ring.current.emissiveIntensity += (target - ring.current.emissiveIntensity) * (1 - Math.exp(-3 * dt))
    }
  })

  return (
    <group>
      {/* main ring */}
      <mesh>
        <torusGeometry args={[RADIUS, 0.007, 8, 160]} />
        <meshStandardMaterial ref={ring} color="#000" emissive="#ffffff" emissiveIntensity={0.12} />
      </mesh>

      {/* concentric guide rings */}
      {[0.82, 0.64, 0.46].map((f) => (
        <mesh key={f}>
          <torusGeometry args={[RADIUS * f, 0.003, 6, 120]} />
          <meshStandardMaterial color="#000" emissive="#9fb3c8" emissiveIntensity={0.1} />
        </mesh>
      ))}
    </group>
  )
}
