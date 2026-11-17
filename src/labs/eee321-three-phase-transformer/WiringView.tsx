import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { C, ZERO, abs, add, arg, scale } from '../../physics/complex'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { phaseDeg, si } from '../../ui/format'
import { PHASE_COLOR } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { atPhase, isStar } from './engine'
import type { Model } from './derive'

type Pt = [number, number]

/** One wire (or winding) with the phasor of the current that flows along it, from its first point to its last. */
interface Seg {
  pts: Pt[]
  I: C
  color: string
  side: 0 | 1
  /** Winding paths are thicker and coloured by phase. */
  winding: boolean
}

interface Layout {
  W: number
  H: number
  segs: Seg[]
  coils: { x: number; yT: number; yB: number; dir: 1 | -1; color: string; side: 0 | 1; k: number; d: string }[]
  junctions: Pt[]
  rails: { node: string; x: number; y0: number; y1: number; side: 0 | 1 }[]
  cores: { x: number; yT: number; yB: number }[]
  labels: { x: number; y: number; align: 'left' | 'right' | 'center'; node: ReactNode; className?: string }[]
}

const length = (pts: Pt[]) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0)
const toD = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('')

/** Point and direction at a fraction of a polyline's length. */
function along(pts: Pt[], frac: number): { p: Pt; ang: number } {
  const L = length(pts) * frac
  let acc = 0
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]
    const l = Math.hypot(x1 - x0, y1 - y0)
    if (acc + l >= L && l > 0) {
      const t = (L - acc) / l
      return { p: [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t], ang: Math.atan2(y1 - y0, x1 - x0) }
    }
    acc += l
  }
  const n = pts.length
  return { p: pts[n - 1], ang: Math.atan2(pts[n - 1][1] - pts[n - 2][1], pts[n - 1][0] - pts[n - 2][0]) }
}

/** Coil: straight leads and four half-turns bulging towards the core. */
function coilPoints(x: number, yT: number, yB: number, dir: 1 | -1): Pt[] {
  const lead = (yB - yT) * 0.16
  const y0 = yT + lead, y1 = yB - lead
  const n = 4, r = (y1 - y0) / (2 * n)
  const pts: Pt[] = [[x, yT], [x, y0]]
  for (let j = 0; j < n; j++) {
    const cy = y0 + r * (2 * j + 1)
    for (let s = 1; s <= 8; s++) {
      const a = -Math.PI / 2 + (Math.PI * s) / 8
      pts.push([x + dir * r * 1.15 * Math.cos(a), cy + r * Math.sin(a)])
    }
  }
  pts.push([x, yB])
  return pts
}

function layout(model: Model, W: number, H: number, compact: boolean): Layout {
  const { sol } = model
  const n = sol.params.netlist
  const top = compact ? 30 : 40, bottom = 8
  const rh = (H - top - bottom) / 3
  const sp = compact ? 15 : 26
  const priNodes = isStar(n.primary) ? ['A', 'B', 'C', 'N'] : ['A', 'B', 'C']
  const secNodes = isStar(n.secondary) ? ['a', 'b', 'c', 'n'] : ['a', 'b', 'c']
  const x0 = compact ? 14 : 22
  const railX = new Map<string, number>()
  priNodes.forEach((nd, i) => railX.set(nd, x0 + i * sp))
  secNodes.forEach((nd, i) => railX.set(nd, W - x0 - (secNodes.length - 1 - i) * sp))
  const xPc = W * (compact ? 0.4 : 0.39), xSc = W - xPc
  const segs: Seg[] = []
  const coils: Layout['coils'] = []
  const cores: Layout['cores'] = []
  const labels: Layout['labels'] = []
  // branch currents leaving each rail at each connection point (for KCL along the rail)
  const conns = new Map<string, { y: number; I: C }[]>()
  const addConn = (node: string, y: number, I: C) => {
    if (!conns.has(node)) conns.set(node, [])
    conns.get(node)!.push({ y, I })
  }
  for (let k = 0; k < 3; k++) {
    const yT = top + k * rh + rh * 0.16, yB = top + k * rh + rh * 0.84
    const color = PHASE_COLOR[k]
    for (const side of [0, 1] as const) {
      const wd = side === 0 ? n.primary[k] : n.secondary[k]
      const x = side === 0 ? xPc : xSc
      const dir = side === 0 ? 1 : -1
      const coil = coilPoints(x, yT, yB, dir)
      const pts: Pt[] = [[railX.get(wd.dot)!, yT], ...coil, [railX.get(wd.other)!, yB]]
      // primary: I_P flows into the dot (dot rail -> other rail); secondary: I_S flows out of the dot (other -> dot)
      const I = side === 0 ? sol.pri.Iw[k] : scale(sol.sec.Iw[k], -1)
      segs.push({ pts, I, color, side, winding: true })
      addConn(wd.dot, yT, I)
      addConn(wd.other, yB, scale(I, -1))
      coils.push({ x, yT, yB, dir, color, side, k, d: toD(coil) })
      if (!compact) {
        const Vw = side === 0 ? sol.pri.Vw[k] : sol.sec.Vw[k]
        const sub = side === 0 ? 'p\\text{-}pri' : 'p\\text{-}sec'
        labels.push({
          x: side === 0 ? x - 16 : x + 16, y: (yT + yB) / 2, align: side === 0 ? 'right' : 'left',
          node: <><Tex>{`V_{${sub}}`}</Tex> <span className="num">= {si(abs(Vw), 'V', 4)} ∠ {phaseDeg(arg(Vw))}</span></>,
          className: 'text-[11.5px]',
        })
      }
    }
    cores.push({ x: W / 2, yT: yT + 4, yB: yB - 4 })
  }
  // rails: current along each piece from KCL, top (terminal) to bottom
  const rails: Layout['rails'] = []
  const junctions: Pt[] = []
  for (const [node, list] of conns) {
    const side: 0 | 1 = node === node.toUpperCase() ? 0 : 1
    const x = railX.get(node)!
    const sorted = [...list].sort((p, q) => p.y - q.y)
    const yTerm = top - (compact ? 14 : 18)
    rails.push({ node, x, y0: yTerm, y1: sorted[sorted.length - 1].y, side })
    let y = yTerm
    for (let j = 0; j < sorted.length; j++) {
      // downward current in this piece = sum of the branch currents leaving the rail below it
      const I = sorted.slice(j).reduce((s, b) => add(s, b.I), ZERO)
      if (sorted[j].y > y) segs.push({ pts: [[x, y], [x, sorted[j].y]], I, color: 'var(--ink)', side, winding: false })
      y = sorted[j].y
      junctions.push([x, sorted[j].y])
    }
    labels.push({ x, y: yTerm - 9, align: 'center', node: <Tex>{node}</Tex>, className: 'text-[13px]' })
  }
  return { W, H, segs, coils, junctions, rails, cores, labels }
}

/** Y or Δ symbol. */
function SideSymbol({ x, y, star }: { x: number; y: number; star: boolean }) {
  const r = 7
  return star ? (
    <g stroke="var(--ink)" strokeWidth={1.4} fill="none">
      <line x1={x} y1={y} x2={x} y2={y + r} />
      <line x1={x} y1={y} x2={x - r * 0.87} y2={y - r * 0.5} />
      <line x1={x} y1={y} x2={x + r * 0.87} y2={y - r * 0.5} />
    </g>
  ) : (
    <path d={`M${x} ${y - r} L${x + r * 0.95} ${y + r * 0.6} L${x - r * 0.95} ${y + r * 0.6}Z`} stroke="var(--ink)" strokeWidth={1.4} fill="none" />
  )
}

/** Peak pixels moved per radian of ωt by a dot carrying the largest line current of its side. */
const DOT_SPEED = 26
const DOT_GAP = 14

export function WiringView({ model, clock, reduced, compact = false, className = '' }: {
  model: Model; clock: Clock; reduced: boolean; compact?: boolean; className?: string
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const L = useMemo(() => (size.w > 0 && size.h > 0 ? layout(model, size.w, size.h, compact) : null), [model, size.w, size.h, compact])
  const dotRefs = useRef<(SVGPathElement | null)[]>([])
  const arrowRefs = useRef<(SVGPathElement | null)[]>([])

  useEffect(() => {
    if (!L) return
    const { sol } = model
    // dot speed is normalized separately on each side (display only)
    const peak = [Math.SQRT2 * sol.pri.IL, Math.SQRT2 * sol.sec.IL]
    const k = peak.map((p) => (p > 0 ? DOT_SPEED / p : 0))
    const offsets = L.segs.map(() => 0)
    const mids = L.segs.map((s) => along(s.pts, 0.5))
    let last = clock.phase
    const draw = (phase: number) => {
      let d = phase - last
      if (d < -Math.PI) d += 2 * Math.PI // the clock wrapped
      if (d > Math.PI) d -= 2 * Math.PI
      last = phase
      L.segs.forEach((s, j) => {
        const i = atPhase(s.I, phase)
        if (!reduced) {
          offsets[j] = (offsets[j] + k[s.side] * i * d) % 1e6
          dotRefs.current[j]?.setAttribute('stroke-dashoffset', (-offsets[j]).toFixed(2))
        } else {
          const a = arrowRefs.current[j]
          if (!a) return
          const rel = peak[s.side] > 0 ? Math.abs(i) / peak[s.side] : 0
          if (rel < 0.04) { a.setAttribute('visibility', 'hidden'); return }
          const { p, ang } = mids[j]
          const deg = (ang * 180) / Math.PI + (i < 0 ? 180 : 0)
          a.setAttribute('visibility', 'visible')
          a.setAttribute('transform', `translate(${p[0].toFixed(1)} ${p[1].toFixed(1)}) rotate(${deg.toFixed(1)}) scale(${(0.6 + 0.6 * rel).toFixed(2)})`)
        }
      })
    }
    draw(clock.phase)
    return clock.subscribe(draw)
  }, [L, model, clock, reduced])

  const loaded = model.sol.params.S3 > 0
  const n = model.sol.params.netlist
  const priStar = isStar(n.primary), secStar = isStar(n.secondary)
  return (
    <div ref={ref} className={`relative select-none overflow-hidden border border-rule bg-panel ${className}`}>
      {L && (
        <>
          <svg width={L.W} height={L.H} className="absolute inset-0" role="img"
            aria-label={`Wiring of the ${n.name} bank: three single-phase transformers, primary on the left, secondary on the right.`}>
            {L.cores.map((c, k) => (
              <g key={k} stroke="var(--mute)" strokeWidth={2}>
                <line x1={c.x - 4} x2={c.x - 4} y1={c.yT} y2={c.yB} />
                <line x1={c.x + 4} x2={c.x + 4} y1={c.yT} y2={c.yB} />
              </g>
            ))}
            {L.rails.map((r) => (
              <line key={r.node} x1={r.x} x2={r.x} y1={r.y0} y2={r.y1} stroke="var(--ink)" strokeWidth={1.25} />
            ))}
            {L.segs.map((s, j) => (
              <path key={j} d={toD(s.pts)} fill="none" stroke={s.winding ? 'var(--ink)' : 'none'} strokeWidth={1.25} strokeLinejoin="round" />
            ))}
            {L.coils.map((c) => (
              <g key={`${c.side}${c.k}`}>
                <path d={c.d} fill="none" stroke={c.color} strokeWidth={2.25} strokeLinejoin="round" />
                {/* polarity dot beside the dotted (upper) end */}
                <circle cx={c.x - c.dir * 7} cy={c.yT + (c.yB - c.yT) * 0.2} r={2.6} fill="var(--ink)" />
              </g>
            ))}
            {L.junctions.map(([x, y], j) => <circle key={j} cx={x} cy={y} r={2.6} fill="var(--ink)" />)}
            {/* moving dots (dashes of zero length with round caps), or static arrows under reduced motion */}
            {loaded && !reduced && L.segs.map((s, j) => (
              <path key={`d${j}`} ref={(el) => { dotRefs.current[j] = el }} d={toD(s.pts)} fill="none"
                stroke={s.winding ? s.color : 'var(--ink)'} strokeOpacity={s.winding ? 1 : 0.75}
                strokeWidth={s.winding ? 4.5 : 3.5} strokeLinecap="round" strokeDasharray={`0.01 ${DOT_GAP}`} />
            ))}
            {loaded && reduced && L.segs.map((s, j) => (
              <path key={`a${j}`} ref={(el) => { arrowRefs.current[j] = el }} d="M6 0 L-4 -4.5 L-4 4.5Z"
                fill={s.winding ? s.color : 'var(--ink)'} stroke="var(--panel)" strokeWidth={1} visibility="hidden" />
            ))}
            <SideSymbol x={L.W * (compact ? 0.27 : 0.25)} y={compact ? 12 : 16} star={priStar} />
            <SideSymbol x={L.W * (compact ? 0.73 : 0.75)} y={compact ? 12 : 16} star={secStar} />
          </svg>
          {L.labels.map((l, j) => (
            <div key={j} className={`pointer-events-none absolute whitespace-nowrap leading-tight ${l.className ?? ''}`}
              style={{ left: l.x, top: l.y, transform: `translate(${l.align === 'center' ? '-50%' : l.align === 'right' ? '-100%' : '0'}, -50%)` }}>
              {l.node}
            </div>
          ))}
          {!compact && (
            <>
              <div className="tag pointer-events-none absolute" style={{ left: L.W * 0.25 + 14, top: 9 }}>Primary · {priStar ? 'Y' : 'Δ'}</div>
              <div className="tag pointer-events-none absolute -translate-x-full" style={{ left: L.W * 0.75 - 14, top: 9 }}>Secondary · {secStar ? 'Y' : 'Δ'}</div>
              {[0, 1, 2].map((k) => (
                <div key={k} className="num pointer-events-none absolute -translate-x-1/2 text-[10.5px] text-faint"
                  style={{ left: L.W / 2, top: L.cores[k].yT - 15 }}>T{k + 1}</div>
              ))}
            </>
          )}
          {!loaded && (
            <div className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[11.5px] text-mute">No load: no current flows.</div>
          )}
        </>
      )}
    </div>
  )
}
