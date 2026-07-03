import { Suspense, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { Group } from 'three'
import { PROJECTS, COUNT, type Project } from '@/lib/content/manifest'
import { ringPosition, rotationForActive, damp, TAU } from '@/lib/geometry/ring'
import { RADIUS, LAMBDA_ROT } from '@/components/scene/sceneConfig'
import CircleCore from '@/components/scene/CircleCore'
import Diamond from '@/components/scene/Diamond'
import PrintModel from './PrintModel'
import logoStyles from '@/components/scene/CenterLogo.module.css'

// the project title here read as cramped/cluttered against the wireframe
// model — just the homepage's default idle state ("0xG / works"), not the
// hover-preview title treatment.
function PrintCenterLogo() {
  return (
    <Html center distanceFactor={10} position={[0, 0, 0]} zIndexRange={[3, 0]} style={{ pointerEvents: 'none' }}>
      <div className={logoStyles.logo}>
        <span className={logoStyles.l1}>0xG</span>
        <div className={logoStyles.sub}>
          <span className={logoStyles.l2}>works</span>
        </div>
      </div>
    </Html>
  )
}

/** the print page's ring — the site's neutral "index" look (all diamonds
 *  equally visible, nothing pushed aside) except the ring itself rotates so
 *  the featured diamond always parks at 3 o'clock — same rotationForActive
 *  math as the interactive Constellation, just always targeting 'aside-left'
 *  (marker at 3 o'clock) regardless of layout. `featured` is plain React
 *  state owned by PrintPage (not the store's transient `hovered`), so
 *  clicking a diamond changes the card/model without it reverting when the
 *  mouse leaves. CenterLogo + the model sit outside the rotating group, at a
 *  fixed centre, matching how the real site separates them from the spinner. */
export default function PrintRing({
  featured,
  onSelect,
}: {
  featured: Project
  onSelect: (p: Project) => void
}) {
  const spinner = useRef<Group>(null)

  useFrame((_, dt) => {
    if (!spinner.current) return
    const desired = rotationForActive(featured.ordinal, COUNT, 'aside-left')
    let delta = desired - spinner.current.rotation.z
    delta = (((delta + Math.PI) % TAU) + TAU) % TAU - Math.PI
    spinner.current.rotation.z = damp(spinner.current.rotation.z, spinner.current.rotation.z + delta, LAMBDA_ROT, dt)
  })

  return (
    <group>
      <PrintCenterLogo />
      <group ref={spinner}>
        <CircleCore />
        {PROJECTS.map((p, i) => (
          <Diamond
            key={p.code}
            project={p}
            position={ringPosition(i, COUNT, RADIUS)}
            active={p.slug === featured.slug}
            dim={false}
            reticle={false}
            onSelect={() => onSelect(p)}
          />
        ))}
      </group>
      {/* the model loads on its own boundary so it never blocks the ring */}
      <Suspense fallback={null}>
        <PrintModel slug={featured.slug} accent={featured.accent} />
      </Suspense>
    </group>
  )
}
