import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import { PROJECTS, COUNT, mod, projectBySlug } from '@/lib/content/manifest'
import { useNav } from '@/lib/scroll/store'
import { ringPosition, rotationForActive, damp, ringDist, TAU } from '@/lib/geometry/ring'
import {
  RADIUS, OPEN_SCALE, CLOSED_SCALE,
  MOBILE_BASE, LAMBDA_ROT, LAMBDA_MOVE, LAMBDA_RETURN, ASIDE_LEFT_FRAC, ASIDE_TOP_FRAC,
} from './sceneConfig'
import CircleCore from './CircleCore'
import Diamond from './Diamond'
import styles from './CenterLogo.module.css'

function CenterLogo() {
  const open = useNav((s) => s.open)
  const hovered = useNav((s) => s.hovered)
  const proj = hovered ? projectBySlug(hovered) : undefined
  const show = !!proj && !open
  return (
    <Html center distanceFactor={10} position={[0, 0, 0]} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
      <div className={`${styles.logo} ${open ? styles.gone : ''}`}>
        <span className={styles.l1}>0xG</span>
        <div className={styles.sub}>
          <span className={`${styles.l2} ${show ? styles.l2hidden : ''}`}>works</span>
          <span
            className={`${styles.name} ${show ? styles.nameShow : ''}`}
            style={proj ? { ['--c' as string]: proj.accent } : undefined}
          >
            {proj?.title}
          </span>
        </div>
      </div>
    </Html>
  )
}

export default function Constellation() {
  const root = useRef<Group>(null)
  const spinner = useRef<Group>(null)
  const { viewport } = useThree()
  const activeMod = useNav((s) => mod(s.active))
  const select = useNav((s) => s.select)

  useFrame((_, dt) => {
    // always animate (don't hard-snap) — the rotation IS the navigation feel
    const { active, open, layout } = useNav.getState()
    if (spinner.current) {
      // rotate the SHORT way to the desired angle (so index↔ends wrap is one step)
      const desired = rotationForActive(active, COUNT, layout)
      let delta = desired - spinner.current.rotation.z
      delta = (((delta + Math.PI) % TAU) + TAU) % TAU - Math.PI
      spinner.current.rotation.z = damp(
        spinner.current.rotation.z,
        spinner.current.rotation.z + delta,
        LAMBDA_ROT,
        dt,
      )
    }
    if (root.current) {
      const base = layout === 'aside-top' ? MOBILE_BASE : CLOSED_SCALE
      const scale = base * (open ? OPEN_SCALE : 1)
      // when open, push the ring mostly off-screen so only prev/current/next show,
      // with the active diamond (at the marker) poking into the near edge.
      let tx = 0
      let ty = 0
      if (open) {
        if (layout === 'aside-left') {
          tx = -viewport.width * ASIDE_LEFT_FRAC - RADIUS * scale
        } else {
          ty = viewport.height * ASIDE_TOP_FRAC + RADIUS * scale
        }
      }
      // returning to centre (closing) is snappier than the slide-out
      const ml = open ? LAMBDA_MOVE : LAMBDA_RETURN
      root.current.position.x = damp(root.current.position.x, tx, ml, dt)
      root.current.position.y = damp(root.current.position.y, ty, ml, dt)
      const v = damp(root.current.scale.x, scale, ml, dt)
      root.current.scale.set(v, v, v)
      // keep the ring a true circle (no skew) — facing the camera flat
      root.current.rotation.x = damp(root.current.rotation.x, 0, ml, dt)
    }
  })

  const open = useNav((s) => s.open)

  return (
    <group ref={root}>
      <CenterLogo />
      <group ref={spinner}>
        <CircleCore />
        {PROJECTS.map((p, i) => (
          <Diamond
            key={p.code}
            project={p}
            position={ringPosition(i, COUNT, RADIUS)}
            active={open && i === activeMod}
            dim={open && ringDist(i, activeMod, COUNT) > 1}
            onSelect={() => select(i)}
          />
        ))}
      </group>
    </group>
  )
}
