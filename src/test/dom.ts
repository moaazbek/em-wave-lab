/**
 * jsdom has no layout, canvas, ResizeObserver or matchMedia: minimal stand-ins for the DOM tests (display only,
 * no physics). `isDesktop` answers the lab frame's "(min-width: 1100px)" query.
 */
export function installDomStubs(isDesktop: () => boolean): void {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('min-width: 1100px') ? isDesktop() : false, media: q, onchange: null,
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
  window.scrollTo = (() => {}) as typeof window.scrollTo
  ;(SVGElement.prototype as unknown as { getBBox: () => DOMRect }).getBBox = () => ({ x: 0, y: 0, width: 10, height: 10 }) as DOMRect
  // the guide's figures fetch their marker files; jsdom has no server
  window.fetch = (() => Promise.resolve(new Response('null', { status: 404 }))) as typeof window.fetch
}
