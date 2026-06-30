import SceneCanvas from './components/scene/SceneCanvas'
import Topbar from './components/ui/Topbar'
import ProjectDetail from './components/sections/ProjectDetail'
import OrbitController from './components/ui/OrbitController'
import WhoamiNode from './components/ui/WhoamiNode'
import AboutPanel from './components/ui/AboutPanel'
import { useNav } from './lib/scroll/store'
import { useNavInput, useLayoutWatch } from './lib/scroll/useNavInput'
import { useRouter } from './lib/scroll/useRouter'
import { PROJECTS, mod, projectBySlug, NEUTRAL_ACCENT } from './lib/content/manifest'
import styles from './App.module.css'

export default function App() {
  useNavInput()
  useLayoutWatch()
  useRouter()
  const active = useNav((s) => mod(s.active))
  const open = useNav((s) => s.open)
  const hovered = useNav((s) => s.hovered)
  const accent = open
    ? PROJECTS[active].accent
    : hovered
      ? projectBySlug(hovered)?.accent ?? NEUTRAL_ACCENT
      : NEUTRAL_ACCENT

  return (
    <>
      <div className={styles.app} style={{ ['--c' as string]: accent }}>
        <div className={styles.tint} />
        <div className={styles.canvas}>
          <SceneCanvas />
        </div>
        <Topbar />
        <WhoamiNode />
        <ProjectDetail />
      </div>
      {/* outside .app so the 100svh dock isn't clipped by .app's overflow:hidden */}
      <OrbitController />
      <AboutPanel />
    </>
  )
}
