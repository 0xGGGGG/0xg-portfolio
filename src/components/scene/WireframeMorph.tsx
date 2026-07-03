import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { PROJECTS, mod } from '@/lib/content/manifest'
import { useNav } from '@/lib/scroll/store'

// Real free low-poly models, rendered as clean wireframe edges. The active /
// hovered project's model is shown; at the index (no hover) NO model is shown.
export const MODEL_URL = (slug: string) => `/assets/models/${slug}.glb`

PROJECTS.forEach((p) => useGLTF.preload(MODEL_URL(p.slug)))

// per-model base orientation (radians) so each faces the camera nicely
export const ROT: Record<string, [number, number, number]> = {
  tolsim: [0.2, 2.4, 0.15], // wrench: turn toward camera (tunable)
}

/** merge a glTF scene's meshes into one EdgesGeometry, centered + scaled to fit. */
export function buildEdges(scene: THREE.Object3D, fit = 3.4): THREE.BufferGeometry {
  scene.updateMatrixWorld(true)
  const positions: number[] = []
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh || !mesh.geometry) return
    const edges = new THREE.EdgesGeometry(mesh.geometry, 22)
    const p = edges.attributes.position as THREE.BufferAttribute
    const v = new THREE.Vector3()
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).applyMatrix4(mesh.matrixWorld)
      positions.push(v.x, v.y, v.z)
    }
    edges.dispose()
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.computeBoundingBox()
  const bb = g.boundingBox!
  const center = bb.getCenter(new THREE.Vector3())
  const size = bb.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.y, size.z) || 1
  const s = fit / maxDim
  g.translate(-center.x, -center.y, -center.z)
  g.scale(s, s, s)
  return g
}

function ModelWire({ slug, accent }: { slug: string; accent: string }) {
  const grp = useRef<THREE.Group>(null)
  const mat = useRef<THREE.LineBasicMaterial>(null)
  const { scene } = useGLTF(MODEL_URL(slug))
  const geo = useMemo(() => buildEdges(scene), [scene])
  const base = ROT[slug] ?? [0, 0, 0]

  useFrame((root, dt) => {
    const st = useNav.getState()
    // open -> active project; index -> hovered project; otherwise nothing
    const targetSlug = st.open ? PROJECTS[mod(st.active)].slug : st.hovered
    const targetOp = slug === targetSlug ? 0.5 : 0
    if (mat.current) {
      const k = 1 - Math.exp(-3 * dt)
      mat.current.opacity += (targetOp - mat.current.opacity) * k
    }
    if (grp.current) {
      const t = root.clock.elapsedTime
      // gentle sway around a forward-facing base (so it doesn't show its back)
      grp.current.rotation.x = base[0] + 0.12 + Math.sin(t * 0.12) * 0.1
      grp.current.rotation.y = base[1] + Math.sin(t * 0.25) * 0.45
      grp.current.rotation.z = base[2]
    }
  })

  return (
    <group ref={grp}>
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

export default function WireframeMorph() {
  return (
    <group position={[0, 0, -1.8]} scale={1.7}>
      {PROJECTS.map((p) => (
        <ModelWire key={p.slug} slug={p.slug} accent={p.accent} />
      ))}
    </group>
  )
}
