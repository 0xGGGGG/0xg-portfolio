import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'
import App from './App'
import PrintPage from './components/print/PrintPage'

// /print or /print/<slug> is a separate static entry point (a flyer meant for
// PDF export) — it skips App entirely so none of the interactive nav's wheel/
// keyboard/router hooks ever mount alongside it.
const printSegs = location.pathname.match(/^\/print(?:\/([^/]+))?\/?$/)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {printSegs ? <PrintPage slug={printSegs[1] && decodeURIComponent(printSegs[1])} /> : <App />}
  </StrictMode>,
)
