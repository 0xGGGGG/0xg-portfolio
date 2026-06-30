import { useEffect, useRef } from 'react'
import { useNav } from './store'
import { PROJECTS, mod, indexOfSlug } from '@/lib/content/manifest'

// Path-based deep links with history:
//   /                -> index (closed)
//   /whoami          -> the about overlay
//   /<slug>          -> project open, card 0 (description)
//   /<slug>/<n>      -> project open, card n (0 = description); out of bounds -> 0
// Project/about changes push a history entry (back/forward); card changes replace
// (no history flood) but keep the URL shareable.

const cardCountOf = (i: number) => 1 + PROJECTS[i].media.length + (PROJECTS[i].wip ? 0 : 1)

export function useRouter() {
  // URL -> store (initial load + browser back/forward)
  useEffect(() => {
    const apply = () => {
      const segs = location.pathname.split('/').filter(Boolean)
      const st = useNav.getState()
      if (!segs.length) return st.close()
      if (segs[0] === 'whoami') return st.openAbout()
      const i = indexOfSlug(decodeURIComponent(segs[0]))
      if (i < 0) return st.close()
      st.select(i)
      const n = segs[1] != null ? parseInt(segs[1], 10) : 0
      st.setCard(Number.isInteger(n) && n >= 0 && n < cardCountOf(i) ? n : 0)
    }
    apply()
    window.addEventListener('popstate', apply)
    return () => window.removeEventListener('popstate', apply)
  }, [])

  // store -> URL
  const open = useNav((s) => s.open)
  const about = useNav((s) => s.about)
  const active = useNav((s) => mod(s.active))
  const card = useNav((s) => s.card)
  const prevKey = useRef<string | null>(null)
  const first = useRef(true)
  useEffect(() => {
    const key = about ? 'whoami' : open ? PROJECTS[active].slug : null
    // on first run the URL is authoritative (the apply effect above resolves it)
    if (first.current) {
      first.current = false
      prevKey.current = key
      return
    }
    const url = about
      ? '/whoami'
      : open
        ? `/${PROJECTS[active].slug}${card > 0 ? `/${card}` : ''}`
        : '/'
    if (url !== location.pathname) {
      // a different project/about (or open/close) earns a history entry; a card move replaces
      if (key !== prevKey.current) history.pushState(null, '', url)
      else history.replaceState(null, '', url)
    }
    prevKey.current = key
  }, [open, about, active, card])
}
