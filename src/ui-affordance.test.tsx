// @vitest-environment jsdom
/**
 * Every clickable element looks clickable: render the home page and every lab, in every mode and phone tab
 * reachable through the state or the URL, open every disclosure and experiment, and check that each `button`
 * and `a[href]` carries a `data-ui` value from the design system (DESIGN.md § 6).
 */
import { act, cleanup, fireEvent, render } from '@testing-library/react'
import { ComponentType } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'

const ALLOWED = new Set(['button', 'chip', 'disclosure', 'experiment', 'lab-tile', 'segmented', 'switch', 'icon-button', 'tab', 'slider-input', 'header-link', 'prose-link'])

let desktop = true
beforeAll(() => {
  // jsdom has no layout, canvas, ResizeObserver or matchMedia: minimal stand-ins (display only, no physics)
  window.matchMedia = ((q: string) => ({
    matches: q.includes('min-width: 1100px') ? desktop : false, media: q, onchange: null,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
  class RO { cb: ResizeObserverCallback; constructor(cb: ResizeObserverCallback) { this.cb = cb } observe() { this.cb([], this as unknown as ResizeObserver) } unobserve() {} disconnect() {} }
  window.ResizeObserver = RO as unknown as typeof ResizeObserver
  Element.prototype.getBoundingClientRect = function () { return { x: 0, y: 0, top: 0, left: 0, right: 800, bottom: 400, width: 800, height: 400, toJSON() {} } as DOMRect }
  const ctx = new Proxy({}, { get: (_t, k) => (k === 'createImageData' ? (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4), width: w, height: h }) : k === 'measureText' ? () => ({ width: 10 }) : () => {}) })
  HTMLCanvasElement.prototype.getContext = (() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext
  window.requestAnimationFrame = ((cb: FrameRequestCallback) => window.setTimeout(() => cb(performance.now()), 16)) as typeof window.requestAnimationFrame
  window.cancelAnimationFrame = (id: number) => window.clearTimeout(id)
  Element.prototype.scrollIntoView = () => {}
  ;(SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 }) as DOMRect
})
afterEach(() => cleanup())

function checkAll(where: string) {
  const bad: string[] = []
  for (const el of document.querySelectorAll('button, a[href]')) {
    const ui = el.getAttribute('data-ui')
    if (!ui || !ALLOWED.has(ui)) bad.push(`${el.tagName.toLowerCase()} data-ui=${ui} "${(el.textContent ?? '').trim().slice(0, 40)}"`)
  }
  expect(bad, where).toEqual([])
  return document.querySelectorAll('button, a[href]').length
}

/** Open every disclosure and experiment item, press every "Show the answer", then check again. */
async function openEverything(where: string) {
  for (const sel of ['[data-ui=disclosure][aria-expanded=false]', '[data-ui=experiment][aria-expanded=false]']) {
    const items = [...document.querySelectorAll<HTMLButtonElement>(sel)]
    for (const b of items) {
      await act(async () => { fireEvent.click(b) })
      for (const ans of [...document.querySelectorAll<HTMLButtonElement>('button')].filter((x) => x.textContent === 'Show the answer'))
        await act(async () => { fireEvent.click(ans) })
      checkAll(`${where}, opened`)
    }
  }
}

async function renderLab(Lab: ComponentType<{ query: string }>, query: string, where: string) {
  await act(async () => { render(<Lab query={query} />) })
  let n = checkAll(where)
  if (desktop) await openEverything(where)
  else {
    for (const tab of [...document.querySelectorAll<HTMLButtonElement>('[role=tab]')]) {
      await act(async () => { fireEvent.click(tab) })
      n += checkAll(`${where}, tab ${tab.textContent}`)
      await openEverything(`${where}, tab ${tab.textContent}`)
    }
  }
  cleanup()
  return n
}

const LABS: [string, () => Promise<{ default: ComponentType<{ query: string }> }>, string[]][] = [
  ['EEE 361 plane-wave incidence', () => import('./labs/plane-wave-incidence'), ['', 'p2=copper&f=3e6&th=0']],
  ['EEE 321 three-phase transformer', () => import('./labs/eee321-three-phase-transformer'), [
    '', 'p=r212&m=real&c=DY', 'p=r212&m=real&c=DY&hero=circuit', 'p=r29&m=real&c=DY&zf=pu&hero=circuit', 'p=r212&m=real&c=DY&scP=5000',
  ]],
  ['EEE 321 rotating loop', () => import('./labs/eee321-rotating-loop'), ['']],
  ['EEE 321 armature windings', () => import('./labs/eee321-armature-winding'), [
    '', 'p=lap16&t=wave&m=2&P=4&C=14', 'p=lap16&t=frog', 'p=lap16&t=lap&P=10&C=25', 'p=ex73',
  ]],
]

describe('every button and link uses a design-system component (data-ui)', () => {
  it('home page', async () => {
    window.location.hash = '#/'
    const { App } = await import('./shell/App')
    await act(async () => { render(<App />) })
    const n = checkAll('home')
    expect(n).toBeGreaterThan(5)
    expect(document.querySelectorAll('a[data-ui=lab-tile]').length).toBe(4)
    expect(document.querySelectorAll('[data-ui=lab-tile][aria-disabled=true]').length).toBeGreaterThan(0)
  })
  for (const [name, load, queries] of LABS) {
    for (const d of [true, false]) {
      it(`${name}, ${d ? 'desktop' : 'phone'}`, async () => {
        desktop = d
        const Lab = (await load()).default
        for (const q of queries) expect(await renderLab(Lab, q, `${name} ?${q} ${d ? 'desktop' : 'phone'}`)).toBeGreaterThan(5)
      }, 60000)
    }
  }
})
