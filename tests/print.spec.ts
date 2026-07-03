import { test, expect, type Page } from '@playwright/test'
import { COUNT, PROJECTS, projectBySlug } from '../src/lib/content/manifest'

// The /print/<slug> route is a static "attractor" page meant to be embedded in
// a PDF via the browser's native Cmd/Ctrl+P — a landscape 1920x1080 flyer with
// selectable text, a live Three.js constellation, and a clickable QR/links
// block. These tests cover the two things that are easy to silently break:
// the DOM content being real/selectable (not baked into a canvas), and the
// WebGL canvas actually surviving into the print snapshot.

const FEATURED = 'nitef'
const NEWEST = PROJECTS[COUNT - 1]

test.use({ viewport: { width: 1920, height: 1080 } })

async function canvasDataUrlLength(page: Page) {
  return page.evaluate(() => {
    const canvas = document.querySelector('canvas')
    return canvas ? canvas.toDataURL('image/png').length : 0
  })
}

test('renders the featured project as real, selectable DOM text', async ({ page }) => {
  const project = projectBySlug(FEATURED)!
  await page.goto(`/print/${FEATURED}`)
  await expect(page.locator('h1')).toHaveText(project.title)
  await expect(page.getByText(`by ${project.by.join(', ')}`, { exact: true })).toBeVisible()
  // the meta line is CSS text-transform:uppercase, which innerText reflects
  const metaText = (await page.getByTestId('print-meta').innerText()).toLowerCase()
  for (const part of [project.role, project.place, project.date].filter(Boolean) as string[]) {
    expect(metaText).toContain(part.toLowerCase())
  }
  // the body text must be real text, selectable like any other paragraph —
  // not rasterized into an image or canvas.
  const bodyText = await page.locator('h1').evaluate(() => document.body.innerText)
  expect(bodyText).toContain(project.title)
})

test('header shows PRINT * <slug> and a whoami block with a small QR', async ({ page }) => {
  const project = projectBySlug(FEATURED)!
  await page.goto(`/print/${FEATURED}`)
  await expect(page.getByText(`print * ${project.slug}`, { exact: true })).toBeVisible()
  const today = new Date().toISOString().slice(0, 10)
  await expect(page.getByText(today, { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'artist statement' })).toHaveAttribute(
    'href',
    'https://0xg.gg/whoami',
  )
  await expect(page.locator('img[alt*="artist statement"]')).toHaveAttribute('src', '/assets/whoami-qr.svg')
})

test('link pills and the QR block point at the right, real hrefs', async ({ page }) => {
  const project = projectBySlug(FEATURED)!
  await page.goto(`/print/${FEATURED}`)
  for (const link of project.links) {
    await expect(page.getByRole('link', { name: link.label })).toHaveAttribute('href', link.url)
  }
  await expect(page.getByRole('link', { name: project.qrTarget.replace(/^https?:\/\//, '') })).toHaveAttribute(
    'href',
    project.qrTarget,
  )
  await expect(page.locator(`img[alt*="${project.qrTarget}"]`)).toHaveAttribute('src', project.qr!)
})

test('the Three.js canvas renders real content, on screen and under print-media emulation', async ({ page }) => {
  await page.goto(`/print/${FEATURED}`)
  await page.waitForTimeout(1000) // let the scene settle past its first frame
  const onScreen = await canvasDataUrlLength(page)
  // a solid/blank canvas PNG-compresses to a few hundred bytes; a real scene
  // (starfield + ring + glowing wireframe model) runs tens of KB+.
  expect(onScreen).toBeGreaterThan(20_000)

  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(300)
  const underPrint = await canvasDataUrlLength(page)
  expect(underPrint).toBeGreaterThan(20_000)
})

test('/print with no slug falls back to the newest project', async ({ page }) => {
  await page.goto('/print')
  await expect(page.locator('h1')).toHaveText(NEWEST.title)
})

test('/print/<unknown slug> falls back to the newest project', async ({ page }) => {
  await page.goto('/print/this-project-does-not-exist')
  await expect(page.locator('h1')).toHaveText(NEWEST.title)
})

test('every real project renders /print without console or page errors', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  for (const p of PROJECTS) {
    await page.goto(`/print/${p.slug}`)
    await expect(page.locator('h1')).toHaveText(p.title)
  }
  expect(errors).toEqual([])
})

test('clicking a neighbor diamond navigates to that project, live', async ({ page }) => {
  await page.goto(`/print/${FEATURED}`)
  // the ring rotates so the featured diamond parks at 3 o'clock — which
  // neighbor lands on-screen depends on that rotation, so find one
  // dynamically rather than assuming a fixed slug is clickable. Give the
  // rotation animation plenty of time to fully settle first.
  await page.waitForTimeout(2500)
  // find AND click within one synchronous DOM call — the label keeps subtly
  // animating (rotation damping, hover-side flips), so any gap between
  // finding a coordinate and a separate dispatched click (locator.click(),
  // page.mouse.click()) can race against it and miss.
  const slug = await page.evaluate((featuredSlug) => {
    for (const span of Array.from(document.querySelectorAll('button span'))) {
      const text = span.textContent?.trim()
      if (!text || text === featuredSlug) continue
      const btn = span.closest('button') as HTMLButtonElement | null
      if (!btn) continue
      const r = btn.getBoundingClientRect()
      if (r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth) {
        btn.click()
        return text
      }
    }
    return null
  }, FEATURED)
  expect(slug).not.toBeNull()
  const target = projectBySlug(slug!)!
  await expect(page.locator('h1')).toHaveText(target.title)
  await expect(page).toHaveURL(`/print/${target.slug}`)
  await expect(page).toHaveTitle(`${target.title} — 0xG`)
})

test('forces background/canvas printing regardless of the "Background graphics" checkbox', async ({ page }) => {
  // this is what actually fixes the white-page bug: without print-color-adjust
  // set, Chrome drops background colors/gradients unless the user manually
  // checks "Background graphics" in the print dialog — which is off by default.
  await page.goto(`/print/${FEATURED}`)
  await page.emulateMedia({ media: 'print' })
  const adjust = await page.evaluate(() => {
    const cs = getComputedStyle(document.body)
    return cs.getPropertyValue('print-color-adjust') || cs.getPropertyValue('-webkit-print-color-adjust')
  })
  expect(adjust.trim()).toBe('exact')
})

test('exports a real, non-trivial PDF through the browser print pipeline', async ({ page, browserName }, testInfo) => {
  test.skip(browserName !== 'chromium', 'page.pdf() is Chromium-only')
  await page.goto(`/print/${FEATURED}`)
  await page.waitForTimeout(1000)
  await page.emulateMedia({ media: 'print' })
  const pdfPath = testInfo.outputPath('print-export.pdf')
  await page.pdf({
    path: pdfPath,
    width: '1920px',
    height: '1080px',
    // false == the print dialog's real default (the "Background graphics"
    // checkbox unchecked) — the exact condition that used to print a blank
    // white page before the print-color-adjust:exact fix.
    printBackground: false,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  })
  const { statSync } = await import('node:fs')
  const { size } = statSync(pdfPath)
  // a blank/text-only page would be a few KB; the rasterized canvas region
  // alone pushes this well past that.
  expect(size).toBeGreaterThan(200_000)
})
