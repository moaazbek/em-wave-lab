/**
 * The guide as a PDF (`npm run guide:pdf`): builds the site, serves it, prints `#/guide` with Chromium on A4 in the
 * light theme with the page's print CSS (each lab section on a new page, no contents sidebar, markers kept), and
 * writes `public/guide/eee-labs-guide.pdf`. Run it after `npm run guide:screenshots` and after any change to the
 * guide text. `--no-build` uses the existing dist/.
 */
import { execSync } from 'node:child_process'
import { statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import type { Browser } from 'playwright-core'
import { startPreview } from './preview.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/guide/eee-labs-guide.pdf')
const MAX_MB = 5
/** Lab links in the PDF point to the published site. */
const SITE = 'https://moaazbek.github.io/em-wave-lab/'

async function launch(): Promise<Browser> {
  try { return await chromium.launch() } catch {
    return chromium.launch({ executablePath: process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' })
  }
}

async function main() {
  if (!process.argv.includes('--no-build')) execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })
  const preview = await startPreview(ROOT)
  const browser = await launch()
  try {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 }, reducedMotion: 'reduce', colorScheme: 'light', locale: 'en-GB' })
    await ctx.addInitScript(() => { try { localStorage.setItem('eee361-theme', 'light') } catch { /* no storage */ } })
    const page = await ctx.newPage()
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await page.goto(`${preview.url}/#/guide`)
    await page.locator('.guide-section').first().waitFor()
    // load every image now (they are lazy on screen) and wait for the fonts
    await page.evaluate(async () => {
      const imgs = [...document.querySelectorAll('img')]
      imgs.forEach((i) => { i.loading = 'eager' })
      await Promise.all(imgs.map((i) => i.decode().catch(() => { throw new Error(`image did not load: ${i.src}`) })))
      await document.fonts.ready
    })
    await page.waitForLoadState('networkidle')
    // Chrome stores WebP images losslessly in a PDF but embeds JPEG data as it is: print JPEG copies, at most
    // 1500 px wide (an A4 text column is about 680 CSS px), so the file stays small
    await page.evaluate(async () => {
      for (const img of [...document.querySelectorAll<HTMLImageElement>('.guide-figure img')]) {
        const k = Math.min(1, 1500 / img.naturalWidth)
        const c = document.createElement('canvas')
        c.width = Math.round(img.naturalWidth * k)
        c.height = Math.round(img.naturalHeight * k)
        const g = c.getContext('2d')!
        g.fillStyle = '#ffffff'
        g.fillRect(0, 0, c.width, c.height)
        g.drawImage(img, 0, 0, c.width, c.height)
        img.src = c.toDataURL('image/jpeg', 0.82)
        await img.decode()
      }
    })
    // links in the PDF: guide anchors become links inside the document, lab routes point to the live site
    await page.evaluate((site) => {
      for (const a of [...document.querySelectorAll<HTMLAnchorElement>('.guide a[href^="#/"]')]) {
        const href = a.getAttribute('href')!
        const m = href.match(/^#\/guide#(.+)$/)
        a.setAttribute('href', m ? `#${m[1]}` : `${site}${href}`)
      }
    }, SITE)
    await page.waitForTimeout(300)
    if (errors.length) throw new Error(`page error: ${errors[0]}`)
    const figures = await page.locator('.guide-figure').count()
    await page.emulateMedia({ media: 'print', colorScheme: 'light' })
    await page.pdf({
      path: OUT, format: 'A4', printBackground: true, preferCSSPageSize: true,
      displayHeaderFooter: true, headerTemplate: '<span></span>',
      footerTemplate: '<div style="width:100%;font:8px sans-serif;color:#6a6f76;padding:0 14mm;display:flex;justify-content:space-between"><span>Field Lab · How to use the labs</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
    })
    const mb = statSync(OUT).size / 1024 / 1024
    console.log(`public/guide/eee-labs-guide.pdf: ${mb.toFixed(2)} MB, ${figures} figures`)
    if (mb > MAX_MB) throw new Error(`the PDF is ${mb.toFixed(2)} MB, more than ${MAX_MB} MB`)
  } finally {
    await browser.close()
    preview.stop()
  }
}

main().catch((e) => { console.error(`\nguide:pdf failed: ${e instanceof Error ? e.message : e}`); process.exit(1) })
