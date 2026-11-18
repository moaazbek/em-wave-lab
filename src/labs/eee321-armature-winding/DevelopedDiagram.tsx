import { useEffect, useId, useMemo, useRef } from 'react'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { sig } from '../../ui/format'
import { PALETTES } from '../../ui/palette'
import { useTheme } from '../../ui/theme'
import { Snapshot, Winding } from './engine'
import { rotorAngle } from './rotor'

/** Vertical layout (px). */
const Y = { pole0: 4, poleH: 20, slotNum: 37, apex: 46, c1: 88, c2: 152, comm0: 210, commH: 20, brush0: 234, brushH: 13, brushLabel: 260, H: 272 }
const MIN_PITCH = 26

export interface Highlight {
  /** Highlighted path index, or a brush index (all paths touching it), or none. */
  path: number | null
  brush: number | null
}

/**
 * Developed winding diagram: poles and brushes fixed; slots, coils and commutator segments slide with the rotor.
 * Top-layer coil sides are solid, bottom-layer sides dashed. Everything comes from the engine's winding and snapshot.
 */
export function DevelopedDiagram({ w, snap, clock, alphaStatic, highlight, onHighlight, labels = true, className = '' }: {
  w: Winding
  snap: Snapshot
  /** Live rotor angle from the clock, or a fixed angle (exam mode). */
  clock?: Clock
  alphaStatic?: number
  highlight?: Highlight
  onHighlight?: (h: Highlight) => void
  /** Brush polarity and path colouring (hidden in exam mode). */
  labels?: boolean
  className?: string
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const { theme } = useTheme()
  const plus = PALETTES[theme].field[4], minus = PALETTES[theme].field[0]
  const { C, P } = w.spec
  const pitch = Math.max(MIN_PITCH, size.w > 0 ? Math.floor(size.w / C) : MIN_PITCH)
  const Wt = C * pitch
  const segOff = (w.ys - w.yc) / 2
  const clipId = `dd-clip-${useId().replace(/:/g, '')}`
  const rotor = useRef<SVGGElement>(null)
  const slotNums = useRef<SVGGElement>(null)

  useEffect(() => {
    const place = (alpha: number) => {
      const t = ((alpha / w.delta) * pitch) % Wt
      rotor.current?.setAttribute('transform', `translate(${t.toFixed(2)} 0)`)
      slotNums.current?.setAttribute('transform', `translate(${t.toFixed(2)} 0)`)
    }
    if (clock) {
      place(rotorAngle(clock.phase))
      return clock.subscribe((p) => place(rotorAngle(p)))
    }
    place(alphaStatic ?? 0)
  }, [clock, alphaStatic, w, pitch, Wt])

  // which path each coil belongs to (for highlighting); commutated coils
  const pathOf = useMemo(() => {
    const m = new Map<number, number>()
    snap.paths.forEach((p, i) => p.coils.forEach((k) => m.set(k, i)))
    return m
  }, [snap])
  const commutated = useMemo(() => new Set(snap.commutated.flatMap((c) => c.coils)), [snap])
  const hot = useMemo(() => new Set(snap.shortedWithVoltage), [snap])
  const lit = (k: number) => {
    if (!labels || !highlight) return false
    const pi = pathOf.get(k)
    if (pi === undefined) return false
    if (highlight.path !== null) return highlight.path === pi
    if (highlight.brush !== null) { const p = snap.paths[pi]; return p.fromBrush === highlight.brush || p.toBrush === highlight.brush }
    return false
  }
  const anyLit = labels && highlight && (highlight.path !== null || highlight.brush !== null)

  const coilShape = (k: number, off: number) => {
    const c = w.coils[k]
    const xt = (c.top) * pitch + off - 3
    const xb = (c.top + w.ys) * pitch + off + 3
    const xs = (c.start + segOff) * pitch + off
    const xe = (c.start + w.yc + segOff) * pitch + off
    const xm = (xt + xb) / 2
    const on = lit(k)
    const stroke = on ? 'var(--ref)' : 'var(--ink)'
    const width = on ? 2.4 : 1.1
    const op = anyLit && !on ? 0.35 : 0.9
    const yMid = (Y.c1 + Y.c2) / 2
    const markR = Math.min(5.5, pitch * 0.2)
    const mark = (x: number, y: number, s: -1 | 0 | 1) => (
      <g>
        <circle cx={x} cy={y} r={markR} fill="var(--panel)" stroke={s === 0 ? 'var(--faint)' : s > 0 ? plus : minus} strokeWidth={1.4} />
        {s > 0 && <circle cx={x} cy={y} r={markR * 0.35} fill={plus} />}
        {s < 0 && <path d={`M${x - markR * 0.55} ${y - markR * 0.55}L${x + markR * 0.55} ${y + markR * 0.55}M${x + markR * 0.55} ${y - markR * 0.55}L${x - markR * 0.55} ${y + markR * 0.55}`} stroke={minus} strokeWidth={1.3} />}
      </g>
    )
    return (
      <g key={`${k}:${off}`}>
        <g stroke={stroke} strokeWidth={width} fill="none" opacity={op} strokeLinejoin="round">
          <path d={`M${xt} ${Y.c1} L${xm} ${Y.apex} L${xb} ${Y.c1}`} />
          <line x1={xt} x2={xt} y1={Y.c1} y2={Y.c2} />
          <line x1={xb} x2={xb} y1={Y.c1} y2={Y.c2} strokeDasharray="4 3" />
          <path d={`M${xt} ${Y.c2} L${xs} ${Y.comm0}`} />
          <path d={`M${xb} ${Y.c2} L${xe} ${Y.comm0}`} />
        </g>
        <g opacity={anyLit && !on ? 0.45 : 1}>
          {mark(xt, yMid - 9, snap.topSign[k])}
          {mark(xb, yMid + 9, snap.bottomSign[k])}
        </g>
        {commutated.has(k) && (
          <path d={`M${xm} ${Y.apex - 7} l4 4 l-4 4 l-4 -4z`} fill="var(--warn)" stroke="var(--panel)" strokeWidth={0.8}>
            <title>{hot.has(k) ? 'shorted while it has voltage' : 'commutating: shorted by a brush'}</title>
          </path>
        )}
        {hot.has(k) && labels && (
          <text x={xm + 7} y={Y.apex + 1} fontSize={9.5} fill="var(--warn)" stroke="var(--panel)" strokeWidth={3} paintOrder="stroke">V ≠ 0</text>
        )}
      </g>
    )
  }
  const segRect = (j: number, off: number) => {
    const x = (j + segOff) * pitch + off - pitch / 2
    const tappedBy = snap.tapped.findIndex((t) => t.includes(j))
    return (
      <g key={`s${j}:${off}`}>
        <rect x={x + 0.5} y={Y.comm0} width={pitch - 1} height={Y.commH} fill={tappedBy >= 0 ? 'var(--sunk)' : 'var(--panel)'} stroke="var(--ink)" strokeWidth={1} />
        <text x={x + pitch / 2} y={Y.comm0 + 14} textAnchor="middle" fontSize={10} className="num" fill="var(--mute)">{j + 1}</text>
      </g>
    )
  }
  const offsets = [-Wt, 0, Wt]
  const brushX = (b: number) => (b / w.delta) * pitch
  const bw = (w.brushWidth / w.delta) * pitch

  return (
    <div className={`scroll-thin overflow-x-auto border border-rule bg-panel ${className}`} ref={ref}>
      <svg width={Wt} height={Y.H} className="block" role="img"
        aria-label={`Developed winding diagram: ${C} coils, ${P} poles, ${snap.paths.length} parallel paths.`}>
        <defs>
          <clipPath id={clipId}><rect x={0} y={0} width={Wt} height={Y.H} /></clipPath>
        </defs>
        <g clipPath={`url(#${clipId})`}>
          {/* poles (fixed): blocks over β of each pole pitch */}
          {Array.from({ length: P + 1 }, (_, i) => {
            const cx = (i * Wt) / P
            const half = (snap.beta * Wt) / P / 2
            const north = i % 2 === 0
            return (
              <g key={i}>
                <rect x={cx - half} y={Y.pole0} width={2 * half} height={Y.poleH} fill="var(--rule)" stroke="var(--ink)" strokeWidth={1} />
                <text x={cx} y={Y.pole0 + 14.5} textAnchor="middle" fontSize={12} fontWeight={600} className="num" fill="var(--ink)">{north ? 'N' : 'S'}</text>
              </g>
            )
          })}
          {/* slot numbers move with the rotor */}
          <g ref={slotNums}>
            {offsets.map((off) => Array.from({ length: C }, (_, k) => (
              <text key={`${k}:${off}`} x={k * pitch + off} y={Y.slotNum} textAnchor="middle" fontSize={9.5} className="num" fill="var(--faint)">{k + 1}</text>
            )))}
          </g>
          <g ref={rotor}>
            {offsets.map((off) => Array.from({ length: C }, (_, j) => segRect(j, off)))}
            {offsets.map((off) => w.coils.map((c) => coilShape(c.k, off)))}
          </g>
          {/* brushes (fixed) */}
          {w.brushAngles.flatMap((b, i) => [0, Wt].map((off) => {
            const x = brushX(b) + off
            const pol = snap.polarity[i]
            const on = labels && highlight?.brush === i
            return (
              <g key={`${i}:${off}`} style={{ cursor: labels ? 'pointer' : undefined }}
                onMouseEnter={labels && onHighlight ? () => onHighlight({ path: null, brush: i }) : undefined}
                onMouseLeave={labels && onHighlight ? () => onHighlight({ path: null, brush: null }) : undefined}
                onClick={labels && onHighlight ? () => onHighlight({ path: null, brush: highlight?.brush === i ? null : i }) : undefined}>
                <rect x={x - bw / 2} y={Y.brush0} width={bw} height={Y.brushH} fill={on ? 'var(--ref)' : 'var(--ink)'} rx={1} />
                <text x={x} y={Y.brushLabel + 4} textAnchor="middle" fontSize={13} fontWeight={600} className="num" fill="var(--ink)">
                  {labels ? (pol > 0 ? '+' : '−') : ''}
                </text>
              </g>
            )
          }))}
        </g>
      </svg>
      {labels && pitch * C > (size.w || Infinity) && <div className="sr-only">The diagram scrolls sideways inside its frame.</div>}
    </div>
  )
}

/** `--warn` note when a brush shorts a coil that still has voltage (§ 7.2: it should short a coil only at 0 V). */
export function ShortedNote({ snap }: { snap: Snapshot }) {
  if (snap.shortedWithVoltage.length === 0) return null
  const list = snap.shortedWithVoltage.map((k) => k + 1).join(', ')
  return (
    <p className="text-[11.5px] leading-snug text-warn" role="status">
      Coil{snap.shortedWithVoltage.length > 1 ? 's' : ''} {list}: shorted while it has voltage. A brush should short a coil only when the coil has 0 V (§ 7.2).
    </p>
  )
}

/** Path chips: "Path 1 · 12.3 V"; hover or tap highlights the path. */
export function PathChips({ snap, highlight, onHighlight, unit = 'V' }: { snap: Snapshot; highlight: Highlight; onHighlight: (h: Highlight) => void; unit?: string }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Parallel paths">
      {snap.paths.map((p, i) => {
        const on = highlight.path === i
        return (
          <button key={i} type="button" aria-pressed={on}
            onMouseEnter={() => onHighlight({ path: i, brush: null })} onMouseLeave={() => onHighlight({ path: null, brush: null })}
            onClick={() => onHighlight({ path: on ? null : i, brush: null })}
            className={`h-7 rounded-[3px] border px-2 text-[11.5px] ${on ? 'border-ref text-ref' : 'border-rule text-mute hover:text-ink'}`}>
            Path {i + 1} <span className="num">{sig(Math.abs(p.voltage), 3)} {unit}</span>
          </button>
        )
      })}
    </div>
  )
}
