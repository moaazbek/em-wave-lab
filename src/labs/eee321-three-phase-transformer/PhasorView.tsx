import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { C, abs, arg } from '../../physics/complex'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { PHASE_COLOR } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { shiftWords } from './derive'
import type { Model } from './derive'

interface Arrow {
  z: C
  /** Pixels per volt or per ampere. */
  k: number
  color: string
  width: number
  dash?: string
  opacity?: number
  label: string
}

const f1 = (n: number) => n.toFixed(1)

/** One phasor diagram. All phasors rotate together with ωt (when rotating), so their real parts match the waveforms. */
function Diagram({ title, arrows, cx, cy, R, ghost, arc, note }: {
  title: ReactNode; arrows: Arrow[]; cx: number; cy: number; R: number
  ghost?: { ang: number; label: string }
  arc?: { from: number; to: number; text: string }
  note?: ReactNode
}) {
  return (
    <>
      <circle cx={cx} cy={cy} r={R} fill="none" stroke="var(--rule)" />
      <line x1={cx - R - 6} x2={cx + R + 6} y1={cy} y2={cy} stroke="var(--rule)" />
      <line x1={cx} x2={cx} y1={cy - R - 6} y2={cy + R + 6} stroke="var(--rule)" strokeDasharray="2 4" />
      <text x={cx + R + 4} y={cy - 4} fontSize={10} fill="var(--faint)" className="num">Re</text>
      {/* rotating group: everything drawn at its t = 0 angle, then rotated by ωt */}
      <g data-rot={`${cx},${cy}`}>
        {ghost && (
          <line x1={cx} y1={cy} x2={cx + R * 0.92 * Math.cos(ghost.ang)} y2={cy - R * 0.92 * Math.sin(ghost.ang)}
            stroke="var(--ink)" strokeOpacity={0.45} strokeWidth={1} strokeDasharray="3 3" />
        )}
        {arc && (() => {
          const r = R * 0.34
          const a0 = arc.from, a1 = arc.to
          const sweep = a1 > a0 ? 0 : 1
          return Math.abs(a1 - a0) > 1e-6 ? (
            <path d={`M${f1(cx + r * Math.cos(a0))} ${f1(cy - r * Math.sin(a0))} A${r} ${r} 0 0 ${sweep} ${f1(cx + r * Math.cos(a1))} ${f1(cy - r * Math.sin(a1))}`}
              fill="none" stroke="var(--ink)" strokeWidth={1.25} />
          ) : null
        })()}
        {arrows.map((a, j) => {
          const L = abs(a.z) * a.k, ang = arg(a.z)
          const x = cx + L * Math.cos(ang), y = cy - L * Math.sin(ang)
          const hl = Math.min(9, L * 0.3), hw = hl * 0.45
          const bx = x - hl * Math.cos(ang), by = y + hl * Math.sin(ang)
          return L < 1 ? null : (
            <g key={j} opacity={a.opacity ?? 1}>
              <line x1={cx} y1={cy} x2={bx} y2={by} stroke={a.color} strokeWidth={a.width} strokeDasharray={a.dash} />
              <path d={`M${f1(x)} ${f1(y)} L${f1(bx - hw * Math.sin(ang))} ${f1(by - hw * Math.cos(ang))} L${f1(bx + hw * Math.sin(ang))} ${f1(by + hw * Math.cos(ang))}Z`} fill={a.color} />
            </g>
          )
        })}
      </g>
      <foreignObject x={cx - R} y={4} width={2 * R} height={18}>
        <div className="tag text-center !text-ink">{title}</div>
      </foreignObject>
      {note && (
        <foreignObject x={cx - R - 10} y={cy + R + 6} width={2 * R + 20} height={30}>
          <div className="text-center text-[10.5px] leading-tight text-mute">{note}</div>
        </foreignObject>
      )}
    </>
  )
}

export function PhasorView({ model, clock, className = '', compact = false }: { model: Model; clock: Clock; className?: string; compact?: boolean }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const { sol, state } = model
  const W = size.w, H = size.h
  const geo = useMemo(() => {
    if (W <= 0 || H <= 0) return null
    const half = W / 2
    const R = Math.max(30, Math.min(half / 2 - 34, H / 2 - (compact ? 26 : 38)))
    return { R, c1: { x: half / 2, y: H / 2 + (compact ? 4 : 2) }, c2: { x: half + half / 2, y: H / 2 + (compact ? 4 : 2) } }
  }, [W, H, compact])

  const lists = useMemo(() => {
    if (!geo) return null
    const n = sol.params.netlist
    const R = geo.R
    const vScale = (side: typeof sol.pri) => (0.9 * R) / Math.max(side.VLLmag, side.Vp)
    const iScale = (side: typeof sol.pri) => (side.IL > 0 ? (0.55 * R) / Math.max(side.IL, side.Ip) : 0)
    const make = (side: typeof sol.pri, upper: boolean, kv: number, ki: number, faded = false): Arrow[] => {
      const nodes = upper ? ['A', 'B', 'C'] : ['a', 'b', 'c']
      const ws = upper ? n.primary : n.secondary
      const out: Arrow[] = []
      side.Vw.forEach((z, k) => out.push({ z, k: kv, color: PHASE_COLOR[k], width: 1.5, opacity: faded ? 0.5 : 1, label: `V_{${ws[k].dot}${ws[k].other}}` }))
      side.Vll.forEach((z, k) => out.push({ z, k: kv, color: 'var(--ink)', width: 2.75, opacity: faded ? 0.45 : 1, label: `V_{${nodes[k]}${nodes[(k + 1) % 3]}}` }))
      if (!faded) side.Iline.forEach((z, k) => out.push({ z, k: ki, color: PHASE_COLOR[k], width: 1.5, dash: '4 3', label: `I_{${nodes[k]}}` }))
      return out
    }
    const kp = vScale(sol.pri), ks = vScale(sol.sec)
    const pri = make(sol.pri, true, kp, iScale(sol.pri))
    // overlay: the secondary on the primary diagram, scaled by V_LL / V_ll (display only)
    if (state.overlay) pri.push(...make(sol.sec, false, kp * sol.ratio, 0, true))
    const sec = make(sol.sec, false, ks, iScale(sol.sec))
    return { pri, sec }
  }, [geo, sol, state.overlay])

  const svgRef = useRef<SVGSVGElement>(null)
  const labelRefs = useRef<(HTMLDivElement | null)[]>([])
  const all = lists && geo ? [...lists.pri.map((a) => ({ a, c: geo.c1 })), ...lists.sec.map((a) => ({ a, c: geo.c2 }))] : []

  useEffect(() => {
    if (!geo || !lists) return
    const draw = (phase: number) => {
      const wt = state.rotate ? phase : 0
      const deg = (-wt * 180) / Math.PI
      svgRef.current?.querySelectorAll<SVGGElement>('g[data-rot]').forEach((g) => {
        g.setAttribute('transform', `rotate(${deg.toFixed(2)} ${g.dataset.rot!.replace(',', ' ')})`)
      })
      all.forEach(({ a, c }, j) => {
        const el = labelRefs.current[j]
        if (!el) return
        const L = abs(a.z) * a.k
        if (L < 1) { el.style.visibility = 'hidden'; return }
        const ang = arg(a.z) + wt
        el.style.visibility = 'visible'
        el.style.left = `${f1(c.x + (L + 11) * Math.cos(ang))}px`
        el.style.top = `${f1(c.y - (L + 11) * Math.sin(ang))}px`
      })
    }
    draw(clock.phase)
    return clock.subscribe(draw)
  }, [geo, lists, clock, state.rotate])

  const angAB = arg(sol.pri.Vll[0]), angab = arg(sol.sec.Vll[0])
  return (
    <div ref={ref} className={`relative select-none overflow-hidden border border-rule bg-panel ${className}`}>
      {geo && lists && (
        <>
          <svg ref={svgRef} width={W} height={H} className="absolute inset-0" role="img"
            aria-label={`Phasor diagrams. Secondary line voltages: ${shiftWords(sol.shiftDeg)} relative to the primary.`}>
            <line x1={W / 2} x2={W / 2} y1={8} y2={H - 8} stroke="var(--rule)" />
            <Diagram title="Primary" arrows={lists.pri} cx={geo.c1.x} cy={geo.c1.y} R={geo.R}
              note={state.overlay && !compact ? <>faded: secondary <Tex>{'\\times V_{LL}/V_{ll}'}</Tex> (display only)</> : undefined} />
            <Diagram title="Secondary" arrows={lists.sec} cx={geo.c2.x} cy={geo.c2.y} R={geo.R}
              ghost={{ ang: angAB, label: 'V_AB' }} arc={{ from: angAB, to: angab, text: shiftWords(sol.shiftDeg) }}
              note={!compact ? <>dashed line: direction of <Tex>{'V_{AB}'}</Tex></> : undefined} />
          </svg>
          {all.map(({ a }, j) => (
            <div key={j} ref={(el) => { labelRefs.current[j] = el }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-[11px] leading-none"
              style={{ color: a.color === 'var(--ink)' ? 'var(--ink)' : a.color, opacity: a.opacity ?? 1 }}>
              <Tex>{a.label}</Tex>
            </div>
          ))}
          <div className="pointer-events-none absolute whitespace-nowrap rounded-[3px] px-1 text-[11.5px] font-medium text-ink"
            style={{ left: W / 2 + 10, top: 24, background: 'color-mix(in srgb, var(--panel) 80%, transparent)' }}>
            <Tex>{'V_{ab}'}</Tex> vs <Tex>{'V_{AB}'}</Tex>: {shiftWords(sol.shiftDeg)}
          </div>
        </>
      )}
    </div>
  )
}
