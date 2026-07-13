import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'

// /print, /print/<slug> and /print/all are separate static entry points meant
// for PDF export — they skip App entirely so none of the interactive nav's
// wheel/keyboard/router hooks ever mount alongside them. They MUST stay
// lazy: each declares its own global @page rule (16:9 flyer vs A4 doc), and
// loading both stylesheets at once would let one clobber the other.
const PrintPage = lazy(() => import('./components/print/PrintPage'))
const PrintAllPage = lazy(() => import('./components/print/PrintAllPage'))

const printSegs = location.pathname.match(/^\/print(?:\/([^/]+))?\/?$/)
const printSlug = printSegs?.[1] ? decodeURIComponent(printSegs[1]) : undefined

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {printSegs ? (
      <Suspense fallback={null}>
        {printSlug === 'all' ? <PrintAllPage /> : <PrintPage slug={printSlug} />}
      </Suspense>
    ) : (
      <App />
    )}
  </StrictMode>,
)
