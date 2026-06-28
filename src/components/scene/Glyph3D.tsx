import { useMemo } from 'react'
import * as THREE from 'three'
import { iconFor } from '@/lib/content/icons'

/** a project's constellation glyph rendered in 3D — glowing star vertices + lines.
 *  points/edges come from icons.ts (0..100 viewBox), mapped to a local plane. */
export default function Glyph3D({
  slug,
  accent,
  scale = 0.5,
  bright = false,
  dim = false,
}: {
  slug: string
  accent: string
  scale?: number
  bright?: boolean
  dim?: boolean
}) {
  const glyph = iconFor(slug)

  const { lineGeo, pts } = useMemo(() => {
    if (!glyph) return { lineGeo: null, pts: [] as [number, number, number][] }
    const map = (p: [number, number]): [number, number, number] => [
      ((p[0] - 50) / 50) * scale,
      ((50 - p[1]) / 50) * scale,
      0,
    ]
    const pts = glyph.points.map(map)
    const verts: number[] = []
    for (const [a, b] of glyph.edges) {
      verts.push(...pts[a], ...pts[b])
    }
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
    return { lineGeo, pts }
  }, [glyph, scale])

  if (!glyph || !lineGeo) return null
  const emissive = bright ? 2.6 : dim ? 0.4 : 1.2
  const lineOpacity = bright ? 0.95 : dim ? 0.26 : 0.7

  return (
    <group>
      <lineSegments geometry={lineGeo}>
        <lineBasicMaterial
          color={accent}
          transparent
          opacity={lineOpacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      {pts.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[scale * 0.075, 12, 12]} />
          <meshStandardMaterial color="#000" emissive={accent} emissiveIntensity={emissive} />
        </mesh>
      ))}
    </group>
  )
}
