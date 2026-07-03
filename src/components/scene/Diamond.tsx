import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import type { Project } from '@/lib/content/manifest'
import { useNav } from '@/lib/scroll/store'
import Glyph3D from './Glyph3D'
import { DIAMOND_SIZE, GLYPH_SCALE } from './sceneConfig'
import styles from './Diamond.module.css'

const TAU = Math.PI * 2

interface Props {
  project: Project
  position: [number, number, number]
  active: boolean
  dim?: boolean
  onSelect: () => void
  /** the dashed selection ring (drei's fat-line) can render as a giant solid
   *  quad if its resolution uniform desyncs during a forced/resized render —
   *  the print page's one-shot print snapshot hits exactly that. Default true
   *  (the interactive site is unaffected; it never forces an off-cycle render). */
  reticle?: boolean
}

export default function Diamond({ project, position, active, dim, onSelect, reticle = true }: Props) {
  const outer = useRef<Group>(null)
  const wrap = useRef<Group>(null)
  const ring = useRef<Group>(null)
  const [hover, setHover] = useState(false)
  const [side, setSide] = useState<'l' | 'r' | 'c'>('c')
  const setHovered = useNav((s) => s.setHovered)
  const accent = project.accent
  const ndc = useMemo(() => new THREE.Vector3(), [])

  const ringPoints = useMemo(() => {
    const seg = 96
    const r = GLYPH_SCALE * 1.5
    const pts: [number, number, number][] = []
    for (let i = 0; i <= seg; i++) {
      const a = (i / seg) * TAU
      pts.push([Math.cos(a) * r, Math.sin(a) * r, 0])
    }
    return pts
  }, [])

  useFrame((state, dt) => {
    const target = active ? 1.5 : hover ? 1.2 : dim ? 0.78 : 1
    if (wrap.current) {
      const k = 1 - Math.exp(-10 * dt)
      const s = wrap.current.scale.x + (target - wrap.current.scale.x) * k
      wrap.current.scale.set(s, s, s)
    }
    if (ring.current) {
      const t = state.clock.elapsedTime
      ring.current.rotation.z -= dt * 0.6
      ring.current.rotation.x = Math.sin(t * 0.5) * 0.5
      ring.current.rotation.y = Math.cos(t * 0.37) * 0.4
    }
    // anchor the pill toward screen-centre so it doesn't run off the edge
    if (outer.current) {
      outer.current.getWorldPosition(ndc).project(state.camera)
      const s = ndc.x > 0.12 ? 'r' : ndc.x < -0.12 ? 'l' : 'c'
      if (s !== side) setSide(s)
    }
  })

  const enter = () => {
    setHover(true)
    setHovered(project.slug)
    document.body.style.cursor = 'pointer'
  }
  const leave = () => {
    setHover(false)
    setHovered(null)
    document.body.style.cursor = ''
  }

  return (
    <group position={position} ref={outer}>
      <group ref={wrap}>
        <Glyph3D slug={project.slug} accent={accent} scale={GLYPH_SCALE} bright={active} dim={dim} />
      </group>

      {/* selection reticle — thin dashed ring, dashes orbit + slow 3D rotation */}
      {active && reticle && (
        <group ref={ring}>
          <Line
            points={ringPoints}
            color={accent}
            lineWidth={1.3}
            dashed
            dashSize={0.5}
            gapSize={0.34}
            transparent
            opacity={0.85}
          />
        </group>
      )}

      {/* invisible click / hover target */}
      <mesh
        onClick={(e) => {
          e.stopPropagation()
          onSelect()
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          enter()
        }}
        onPointerOut={leave}
      >
        <circleGeometry args={[GLYPH_SCALE * 1.2, 24]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <Html center distanceFactor={10} position={[0, -DIAMOND_SIZE * 3.2, 0]} zIndexRange={[5, 0]}>
        <div className={`${styles.labelWrap} ${styles['side_' + side]}`}>
          <button
            className={`${styles.label} ${active ? styles.active : ''} ${dim ? styles.hidden : ''}`}
            style={{ ['--c' as string]: accent }}
            onClick={(e) => {
              e.stopPropagation()
              onSelect()
            }}
            onPointerEnter={() => setHovered(project.slug)}
            onPointerLeave={() => setHovered(null)}
            tabIndex={-1}
          >
            <i />
            <b>{project.displayCode}</b>
            <span>{project.slug}</span>
          </button>
        </div>
      </Html>
    </group>
  )
}
