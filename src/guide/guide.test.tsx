// @vitest-environment jsdom
/**
 * The guide must match the site exactly (README "Updating the guide"):
 * 1. every **[ui:Label]** exists, exactly, in the rendered page of one of its section's states;
 * 2. every {{key: shown}} number is a correct rounding of the engine's value, and no other digit is in the prose;
 * 3. every image and marker file exists, and the marker lists match the markers the screenshot script found;
 * 4. every link to a lab route and every anchor works.
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ComponentType } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { LABS } from '../shell/labs'
import { installDomStubs } from '../test/dom'
import { SECTIONS } from './content'
import { Block, inlines } from './markdown'
import { SHOTS, ShotMeta, shotByName } from './shots'
import { VALUES } from './values'

const ROOT = process.cwd()
const IMG = join(ROOT, 'public/guide/img')

let desktop = true
beforeAll(() => installDomStubs(() => desktop))
afterEach(() => cleanup())

/* ---------- 1. labels ---------- */

const norm = (s: string) => s.replace(/\s+/g, ' ').trim()

/** Every text a student can read as a label: element texts, accessible names, titles and options. */
function collectTexts(into: Set<string>) {
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('.katex-mathml')) continue
    into.add(norm(el.textContent ?? ''))
    for (const a of ['aria-label', 'title']) { const v = el.getAttribute(a); if (v) into.add(norm(v)) }
  }
}

async function openAll(texts: Set<string>) {
  for (const sel of ['[data-ui=disclosure][aria-expanded=false]', '[data-ui=experiment][aria-expanded=false]']) {
    for (const b of [...document.querySelectorAll<HTMLButtonElement>(sel)]) {
      await act(async () => { fireEvent.click(b) })
      collectTexts(texts)
      for (const ans of [...document.querySelectorAll<HTMLButtonElement>('button')].filter((x) => x.textContent === 'Show the answer'))
        await act(async () => { fireEvent.click(ans) })
      collectTexts(texts)
    }
  }
}

const LAB_MODULES: Record<string, () => Promise<{ default: ComponentType<{ query: string }> }>> = {
  'plane-wave-incidence': () => import('../labs/plane-wave-incidence'),
  'eee321-three-phase-transformer': () => import('../labs/eee321-three-phase-transformer'),
  'eee321-rotating-loop': () => import('../labs/eee321-rotating-loop'),
  'eee321-armature-winding': () => import('../labs/eee321-armature-winding'),
}

/** Render one state (desktop, then phone with every tab) and collect its texts. */
async function textsOf(state: string, texts: Set<string>) {
  for (const d of [true, false]) {
    desktop = d
    if (state === 'home') {
      window.location.hash = '#/'
      const { App } = await import('../shell/App')
      await act(async () => { render(<App />) })
      collectTexts(texts)
    } else {
      const [slug, query = ''] = state.split('?')
      const load = LAB_MODULES[slug]
      if (!load) throw new Error(`Unknown lab in a guide state: ${state}`)
      const Lab = (await load()).default
      await act(async () => { render(<Lab query={query} />) })
      collectTexts(texts)
      if (d) await openAll(texts)
      else for (const tab of [...document.querySelectorAll<HTMLButtonElement>('[role=tab]')]) {
        await act(async () => { fireEvent.click(tab) })
        collectTexts(texts)
        await openAll(texts)
      }
    }
    cleanup()
  }
}

describe('guide labels exist in the interface, exactly', () => {
  for (const s of SECTIONS) {
    it(`${s.id}: every **[ui:…]** label`, async () => {
      expect(s.states.length, `${s.id} has no "states" in its front matter`).toBeGreaterThan(0)
      const texts = new Set<string>()
      for (const st of s.states) await textsOf(st, texts)
      const labels = inlines(s.blocks).filter((n) => n.t === 'ui').map((n) => n.v)
      expect(labels.length).toBeGreaterThan(0)
      expect(labels.filter((l) => !texts.has(l)), `labels not found in ${s.states.join(', ')}`).toEqual([])
    }, 120000)
  }
})

/* ---------- 2. numbers ---------- */

/**
 * Digits allowed in the prose: textbook references ("§ 7.3, 7.5", "Eq. (2-62)", "Problems 2-10 to 2-13", "(7-26)"),
 * course codes ("EEE 321"), the guide's step numbers ("Step 2.") and names ("T1", "Medium 2").
 */
const REFS = /(§|Eqs?\.|Examples?|Problems?|Figs?\.|p\.|EEE|Lab|Step)\s*\(?\d[\w.\-–]*\)?((,\s*|\s+to\s+|\s+and\s+)\(?\d[\w.\-–]*\)?)*|\(\d+-\d+\)|\bT\d\b|\bMedium \d\b/g

describe('guide numbers come from the engine', () => {
  for (const s of SECTIONS) {
    it(`${s.id}: {{key: shown}} values and no other digits`, () => {
      for (const n of inlines(s.blocks)) {
        if (n.t === 'num') {
          const f = VALUES[n.key]
          expect(f, `unknown number key ${n.key}`).toBeTypeOf('function')
          const shown = n.v.replace('−', '-')
          const decimals = (shown.split('.')[1] ?? '').length
          const v = f()
          expect(Math.abs(v - Number(shown)), `${n.key}: shown ${n.v}, engine ${v}`).toBeLessThanOrEqual(0.5 * 10 ** -decimals + 1e-9)
        }
        if (n.t === 'text') expect(n.v.replace(REFS, ''), `digits in the prose of ${s.id}; use {{key: value}} or a textbook reference`).not.toMatch(/\d/)
      }
    })
  }
  it('every number key is used', () => {
    const used = new Set(SECTIONS.flatMap((s) => inlines(s.blocks)).filter((n) => n.t === 'num').map((n) => (n as { key: string }).key))
    expect(Object.keys(VALUES).filter((k) => !used.has(k))).toEqual([])
  })
})

/* ---------- 3. files and markers ---------- */

const figures = SECTIONS.flatMap((s) => s.blocks.map((b, i) => ({ s, b, next: s.blocks[i + 1] as Block | undefined })).filter((x) => x.b.t === 'figure'))

describe('guide images and markers', () => {
  for (const { s, b, next } of figures) {
    const f = b as Extract<Block, { t: 'figure' }>
    it(`${s.id}: ${f.name}`, () => {
      const shot = shotByName(f.name)
      expect(shot, `${f.name} is not in src/guide/shots.ts`).toBeDefined()
      expect(existsSync(join(IMG, `${f.name}.webp`)), `${f.name}.webp missing: run npm run guide:screenshots`).toBe(true)
      expect(statSync(join(IMG, `${f.name}.webp`)).size).toBeLessThanOrEqual(250 * 1024)
      const meta = JSON.parse(readFileSync(join(IMG, `${f.name}.json`), 'utf8')) as ShotMeta
      expect(meta.markers.map((m) => m.label)).toEqual(shot!.markers.map((m) => m.label))
      for (const m of meta.markers) {
        for (const v of [m.box.x, m.box.y, m.box.x + m.box.w, m.box.y + m.box.h]) expect(v).toBeGreaterThanOrEqual(0), expect(v).toBeLessThanOrEqual(100.01)
      }
      // the numbered list right after the image explains its markers, one item each
      if (meta.markers.length) {
        expect(next?.t, `${f.name}: a numbered list must follow the image`).toBe('ol')
        expect((next as unknown as { items: unknown[] }).items.length).toBe(meta.markers.length)
      } else expect(next?.t).not.toBe('ol')
      expect(f.alt.length).toBeGreaterThan(30)
      expect(f.alt.toLowerCase()).not.toContain('screenshot')
    })
  }
  it('every screenshot is used', () => {
    const used = new Set(figures.map((x) => (x.b as { name: string }).name))
    expect(SHOTS.map((s) => s.name).filter((n) => !used.has(n))).toEqual([])
  })
  it('the PDF exists and is under 5 MB', () => {
    const pdf = join(ROOT, 'public/guide/eee-labs-guide.pdf')
    expect(existsSync(pdf), 'run npm run guide:pdf').toBe(true)
    expect(statSync(pdf).size).toBeLessThan(5 * 1024 * 1024)
  })
})

/* ---------- 4. sections, links and anchors ---------- */

describe('guide sections and links', () => {
  const anchors = new Set(SECTIONS.flatMap((s) => [s.id, `${s.id}-title`, ...s.blocks.filter((b) => b.t === 'h').map((b) => (b as { id: string }).id)]))
  it('one section per lab, in home-page order, between "start" and "faq"', () => {
    const order = ['EEE 361', 'EEE 321'].flatMap((c) => LABS.filter((l) => l.course === c).sort((a, b) => a.number.localeCompare(b.number)).map((l) => l.slug))
    expect(SECTIONS.map((s) => s.id)).toEqual(['start', ...order, 'faq'])
  })
  it('anchors are unique', () => {
    const all = SECTIONS.flatMap((s) => [s.id, ...s.blocks.filter((b) => b.t === 'h').map((b) => (b as { id: string }).id)])
    expect(all.length).toBe(new Set(all).size)
  })
  it('every link works', () => {
    for (const n of SECTIONS.flatMap((s) => inlines(s.blocks))) {
      if (n.t !== 'link') continue
      const m = n.href.match(/^#\/([^?#]*)(?:\?[^#]*)?(?:#(.*))?$/)
      expect(m, `link ${n.href} is not a route of the site`).not.toBeNull()
      if (m![1] === 'guide') expect(anchors.has(m![2] ?? ''), `no anchor ${m![2]}`).toBe(true)
      else expect(LABS.some((l) => l.slug === m![1]), `no lab ${m![1]}`).toBe(true)
    }
  })
  it('the Guide button of every lab has a section to open', () => {
    for (const l of LABS) expect(anchors.has(l.slug)).toBe(true)
  })
})
