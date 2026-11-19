import { CSSProperties } from 'react'
import type { Place, ShotMeta } from './shots'

/** Image folder, relative to the page (the build uses a relative base). */
export const IMG_DIR = './guide/img'

/**
 * The marker files written next to the images by `npm run guide:screenshots`, bundled into the page so every image
 * has its size and markers at the first render (an anchor link then lands in the right place).
 */
const METAS = import.meta.glob('../../public/guide/img/*.json', { eager: true, import: 'default' }) as Record<string, ShotMeta>
const META = new Map(Object.values(METAS).map((m) => [m.name, m]))

/** Room around a clipped screenshot for markers placed outside it (CSS px). */
const MARGIN = 24

/**
 * Centre of a marker circle (22 px). On a whole-window screenshot it stays inside the image; on a clipped one it may
 * sit in the margin around the image, so it covers nothing.
 */
function position(place: Place, b: { x: number; y: number; w: number; h: number }, inside: boolean): CSSProperties {
  const lim = inside ? 11 : 11 - MARGIN
  const clamp = (v: string) => `clamp(${lim}px, ${v}, calc(100% - ${lim}px))`
  const cx = `${b.x + b.w / 2}%`, cy = `${b.y + b.h / 2}%`
  const [left, top] =
    place === 'left' ? [`calc(${b.x}% - 16px)`, cy]
      : place === 'right' ? [`calc(${b.x + b.w}% + 16px)`, cy]
        : place === 'top' ? [cx, `calc(${b.y}% - 14px)`]
          : place === 'bottom' ? [cx, `calc(${b.y + b.h}% + 14px)`]
            : place === 'center' ? [cx, cy]
              : place === 'tr' ? [`calc(${b.x + b.w}% - 13px)`, `calc(${b.y}% + 13px)`]
                : [`calc(${b.x}% + 13px)`, `calc(${b.y}% + 13px)`]
  return { left: clamp(left), top: clamp(top) }
}

/** A numbered marker (also used for the list that explains the markers). */
export function MarkerDot({ n, style, className = '' }: { n: number; style?: CSSProperties; className?: string }) {
  return (
    <span style={style}
      className={`guide-marker num inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-ink text-[11.5px] font-medium leading-none text-bg outline outline-1 outline-panel ${className}`}>
      {n}
    </span>
  )
}

/**
 * A screenshot made by `npm run guide:screenshots`, with its markers drawn as HTML on top (they follow the theme
 * and the layout; screen readers get the alt text and the list below the image, not the circles).
 */
export function Figure({ name, alt }: { name: string; alt: string }) {
  const meta = META.get(name) ?? null
  // a phone window is shown 300 px wide; anything else at its CSS size (images are made at scale 2), at most the column
  const width = meta ? (meta.device === 'phone' && meta.window ? 300 : meta.width / 2) : undefined
  const inside = meta?.window ?? true
  return (
    <figure data-guide-figure={name} className="guide-figure my-5 break-inside-avoid" style={inside ? undefined : { padding: `0 ${MARGIN}px` }}>
      <div className="relative mx-auto max-w-full" style={{ width, margin: inside ? undefined : `${MARGIN}px auto` }}>
        <img src={`${IMG_DIR}/${name}.webp`} alt={alt} width={meta?.width} height={meta?.height} loading="lazy"
          className="block h-auto w-full rounded-[3px] border border-rule bg-panel" />
        {meta?.markers.map((m) => (
          <MarkerDot key={m.n} n={m.n} className="absolute -translate-x-1/2 -translate-y-1/2 max-sm:scale-[0.82]" style={position(m.place, m.box, inside)} />
        ))}
      </div>
      {meta?.window && meta.device === 'desktop' && (
        <figcaption className="mt-1.5 text-right text-[12.5px] print:hidden">
          <a href={`${IMG_DIR}/${name}.webp`} target="_blank" rel="noreferrer" data-ui="prose-link"
            className="text-mute underline decoration-mute underline-offset-2 hover:text-ink">Open full size</a>
        </figcaption>
      )}
    </figure>
  )
}
