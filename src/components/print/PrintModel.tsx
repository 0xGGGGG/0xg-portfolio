import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { buildEdges, MODEL_URL, ROT } from '@/components/scene/WireframeMorph'

/** the featured project's wireframe model, sized to nest inside the ring
 *  (unlike the interactive site's WireframeMorph, which is store/hover-driven
 *  and sized for the full "open" composition) — driven by an explicit prop so
 *  it stays put when the mouse leaves the diamond, instead of the transient
 *  store `hovered` field. */
export default function PrintModel({ slug, accent }: { slug: string; accent: string }) {
  const grp = useRef<THREE.Group>(null)
  const mat = useRef<THREE.LineBasicMaterial>(null)
  const { scene } = useGLTF(MODEL_URL(slug))
  const geo = useMemo(() => buildEdges(scene), [scene])
  const base = ROT[slug] ?? [0, 0, 0]

  useFrame((root, dt) => {
    if (mat.current) {
      const k = 1 - Math.exp(-3 * dt)
      mat.current.opacity += (0.55 - mat.current.opacity) * k
    }
    if (grp.current) {
      const t = root.clock.elapsedTime
      grp.current.rotation.x = base[0] + 0.12 + Math.sin(t * 0.12) * 0.1
      grp.current.rotation.y = base[1] + Math.sin(t * 0.25) * 0.45
      grp.current.rotation.z = base[2]
    }
  })

  return (
    <group ref={grp} position={[0, 0, -0.6]}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial
          ref={mat}
          color={accent}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>
    </group>
  )
}
