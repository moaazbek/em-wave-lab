/**
 * Screenshots for the guide (`npm run guide:screenshots`).
 *
 * Builds the site, serves it with `vite preview`, opens every shot of `src/guide/shots.ts` through its URL state
 * in Chromium (light theme, reduced motion so animations start paused, device scale factor 2, fixed random seed for
 * exam mode), and writes `public/guide/img/<name>.webp` plus `<name>.json` with the marker boxes in percent of the
 * image. It fails, and writes nothing for that shot, when an element to clip or to mark is missing.
 *
 *   npm run guide:screenshots                    all shots (builds first)
 *   npm run guide:screenshots -- --no-build      use the existing dist/
 *   npm run guide:screenshots -- --only a,b      only these shots
 *
 * Chromium: Playwright's own build if installed (`npx playwright-core install chromium`), else the browser named by
 * the CHROME_PATH environment variable, else Google Chrome in its usual place.
 */
import { execSync } from 'node:child_process'
import { existsSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import type { Browser, BrowserContext, Locator, Page } from 'playwright-core'
import { SHOTS, VIEWPORT } from '../src/guide/shots.ts'
import type { Shot, ShotMeta } from '../src/guide/shots.ts'
import { startPreview } from './preview.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public/guide/img')
const MAX_BYTES = 250 * 1024
const QUALITIES = [0.8, 0.74, 0.68, 0.62, 0.56]

type Box = { x: number; y: number; width: number; height: number }

const args = process.argv.slice(2)
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null
const shots = only ? SHOTS.filter((s) => only.includes(s.name)) : SHOTS
if (only && shots.length !== only.length) fail(`Unknown shot in --only: ${only.filter((n) => !SHOTS.some((s) => s.name === n)).join(', ')}`)

function fail(msg: string): never {
  console.error(`\nguide:screenshots failed: ${msg}`)
  process.exit(1)
}

export async function launchChromium(): Promise<Browser> {
  try {
    return await chromium.launch()
  } catch {
    const path = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if (!existsSync(path)) fail('No Chromium found. Run "npx playwright-core install chromium" or set CHROME_PATH.')
    return chromium.launch({ executablePath: path })
  }
}

/** Light theme and a fixed random sequence (exam mode draws a random winding). */
const INIT = () => {
  try { localStorage.setItem('eee361-theme', 'light') } catch { /* no storage */ }
  let a = 0x2f6b9d
  Math.random = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

async function settle(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
    await document.fonts.ready
  })
  await page.waitForTimeout(250)
}

function locate(page: Page, scope: Locator | null, sel: string, what: string): Locator {
  const scoped = sel.startsWith('& ')
  if (scoped && !scope) fail(`${what}: "${sel}" is scoped with "&" but the shot has no clip`)
  return scoped ? scope!.locator(sel.slice(2)).first() : page.locator(sel).first()
}

async function boxOf(loc: Locator, what: string): Promise<Box> {
  if ((await loc.count()) === 0) fail(`${what}: element not found`)
  const b = await loc.boundingBox()
  if (!b || b.width === 0 || b.height === 0) fail(`${what}: element is not visible`)
  return b
}

const union = (bs: Box[]): Box => {
  const x = Math.min(...bs.map((b) => b.x)), y = Math.min(...bs.map((b) => b.y))
  return { x, y, width: Math.max(...bs.map((b) => b.x + b.width)) - x, height: Math.max(...bs.map((b) => b.y + b.height)) - y }
}

async function toWebp(encoder: Page, png: Buffer, name: string): Promise<Buffer> {
  for (const q of QUALITIES) {
    const b64 = await encoder.evaluate(async ([data, quality]) => {
      const img = new Image()
      img.src = `data:image/png;base64,${data}`
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.naturalWidth
      c.height = img.naturalHeight
      c.getContext('2d')!.drawImage(img, 0, 0)
      return c.toDataURL('image/webp', quality as number).split(',')[1]
    }, [png.toString('base64'), q] as const)
    const buf = Buffer.from(b64, 'base64')
    if (buf.length <= MAX_BYTES) return buf
  }
  fail(`${name}: the image stays above ${MAX_BYTES / 1024} KB even at quality ${QUALITIES.at(-1)}; clip a smaller part`)
}

async function take(ctx: BrowserContext, encoder: Page, base: string, shot: Shot): Promise<void> {
  const vp = VIEWPORT[shot.device]
  const page = await ctx.newPage()
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(`${base}/#/${shot.route}`)
  await page.locator(shot.route ? '[data-guide=lab-header]' : '[data-ui=lab-tile]').first().waitFor({ timeout: 15000 })
  await settle(page)
  for (const [i, st] of (shot.steps ?? []).entries()) {
    const what = `${shot.name}, step ${i + 1}`
    if ('click' in st) await locate(page, null, st.click, what).click()
    else if ('hover' in st) await locate(page, null, st.hover, what).hover()
    else if ('fill' in st) {
      const f = locate(page, null, st.fill, what)
      await f.click()
      await f.fill(st.text)
      await f.press('Enter')
    } else if ('tab' in st) await page.getByRole('tab', { name: st.tab }).click()
    else await page.waitForTimeout(st.wait)
    if (!('hover' in st)) await page.mouse.move(vp.width - 2, vp.height - 2)
    await settle(page)
  }

  // clip region (page coordinates)
  let region: Box = { x: 0, y: 0, width: vp.width, height: vp.height }
  let scope: Locator | null = null
  if (shot.clip) {
    const sels = Array.isArray(shot.clip) ? shot.clip : [shot.clip]
    scope = page.locator(sels[0]).first()
    if ((await scope.count()) === 0) fail(`${shot.name}: clip element not found: ${sels[0]}`)
    await scope.evaluate((el) => el.scrollIntoView({ block: 'start' }))
    await settle(page)
    const boxes = []
    for (const s of sels) boxes.push(await boxOf(page.locator(s).first(), `${shot.name}, clip "${s}"`))
    const u = union(boxes)
    const pad = shot.pad ?? 6
    region = { x: Math.max(0, u.x - pad), y: Math.max(0, u.y - pad), width: 0, height: 0 }
    region.width = Math.min(vp.width, u.x + u.width + pad) - region.x
    region.height = Math.min(vp.height, u.y + u.height + pad) - region.y
    if (u.y + u.height > vp.height + 1 || u.y < -1) fail(`${shot.name}: the clip (${Math.round(u.height)} px high) does not fit in the window`)
  }
  region = { x: Math.round(region.x), y: Math.round(region.y), width: Math.round(region.width), height: Math.round(region.height) }

  const markers: ShotMeta['markers'] = []
  for (const [i, m] of shot.markers.entries()) {
    const what = `${shot.name}, marker ${i + 1} (${m.label}) "${m.sel}"`
    const b = await boxOf(locate(page, scope, m.sel, what), what)
    // the part of the element inside the image
    const x0 = Math.max(b.x, region.x), y0 = Math.max(b.y, region.y)
    const x1 = Math.min(b.x + b.width, region.x + region.width), y1 = Math.min(b.y + b.height, region.y + region.height)
    if (x1 <= x0 || y1 <= y0) fail(`${what}: element lies outside the image`)
    const pct = (v: number, total: number) => Math.round((v / total) * 10000) / 100
    markers.push({
      n: i + 1, label: m.label, place: m.place ?? 'tl',
      box: { x: pct(x0 - region.x, region.width), y: pct(y0 - region.y, region.height), w: pct(x1 - x0, region.width), h: pct(y1 - y0, region.height) },
    })
  }
  if (errors.length) fail(`${shot.name}: page error: ${errors[0]}`)

  const png = await page.screenshot({ clip: region, type: 'png', animations: 'disabled', caret: 'hide' })
  const webp = await toWebp(encoder, png, shot.name)
  const meta: ShotMeta = { name: shot.name, device: shot.device, window: !shot.clip, width: region.width * 2, height: region.height * 2, markers }
  writeFileSync(join(OUT, `${shot.name}.webp`), webp)
  writeFileSync(join(OUT, `${shot.name}.json`), JSON.stringify(meta, null, 2) + '\n')
  console.log(`  ${shot.name.padEnd(20)} ${String(meta.width).padStart(4)} × ${String(meta.height).padEnd(4)} ${(webp.length / 1024).toFixed(0).padStart(4)} KB  ${markers.length} markers`)
  await page.close()
}

async function main() {
  if (!args.includes('--no-build')) execSync('npm run build', { cwd: ROOT, stdio: 'inherit' })
  const preview = await startPreview(ROOT)
  const browser = await launchChromium()
  try {
    const encoder = await (await browser.newContext()).newPage()
    for (const device of ['desktop', 'phone'] as const) {
      const list = shots.filter((s) => s.device === device)
      if (!list.length) continue
      const phone = device === 'phone'
      const ctx = await browser.newContext({
        viewport: VIEWPORT[device], deviceScaleFactor: 2, isMobile: phone, hasTouch: phone,
        reducedMotion: 'reduce', colorScheme: 'light', locale: 'en-GB', timezoneId: 'UTC',
      })
      await ctx.addInitScript(INIT)
      console.log(`${device} (${VIEWPORT[device].width} × ${VIEWPORT[device].height}, scale 2):`)
      for (const s of list) await take(ctx, encoder, preview.url, s)
      await ctx.close()
    }
    if (!only) {
      const keep = new Set(SHOTS.flatMap((s) => [`${s.name}.webp`, `${s.name}.json`]))
      for (const f of readdirSync(OUT)) if (!keep.has(f)) { unlinkSync(join(OUT, f)); console.log(`  removed old ${f}`) }
    }
  } finally {
    await browser.close()
    preview.stop()
  }
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)))
