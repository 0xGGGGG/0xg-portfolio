import { useEffect } from 'react'
import SceneCanvas from './components/scene/SceneCanvas'
import Topbar from './components/ui/Topbar'
import ProjectDetail from './components/sections/ProjectDetail'
import CircleArrows from './components/ui/CircleArrows'
import { useNav } from './lib/scroll/store'
import { useNavInput, useLayoutWatch } from './lib/scroll/useNavInput'
import { PROJECTS, mod, indexOfSlug, projectBySlug, NEUTRAL_ACCENT } from './lib/content/manifest'
import styles from './App.module.css'

export default function App() {
  useNavInput()
  useLayoutWatch()
  const active = useNav((s) => mod(s.active))
  const open = useNav((s) => s.open)
  const hovered = useNav((s) => s.hovered)
  const accent = open
    ? PROJECTS[active].accent
    : hovered
      ? projectBySlug(hovered)?.accent ?? NEUTRAL_ACCENT
      : NEUTRAL_ACCENT

  // resolve hash deep-link on load (/#slug)
  useEffect(() => {
    const slug = decodeURIComponent(location.hash.replace(/^#/, ''))
    if (!slug) return
    const i = indexOfSlug(slug)
    if (i >= 0) useNav.getState().select(i)
  }, [])

  // keep the URL hash in sync with the open project
  useEffect(() => {
    if (open) history.replaceState(null, '', `#${PROJECTS[active].slug}`)
    else if (location.hash) history.replaceState(null, '', location.pathname + location.search)
  }, [active, open])

  return (
    <div className={styles.app} style={{ ['--c' as string]: accent }}>
      <div className={styles.tint} />
      <div className={styles.canvas}>
        <SceneCanvas />
      </div>
      <Topbar />
      <CircleArrows />
      <ProjectDetail />
    </div>
  )
}
