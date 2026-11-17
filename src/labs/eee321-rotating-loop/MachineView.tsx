import { ReactNode, useEffect, useMemo, useRef } from 'react'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { plain, si } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Badge } from '../../ui/Row'
import { Tex } from '../../ui/Tex'
import { conductorStates, isCommutating } from './engine'
import type { Model } from './derive'

const DEG = Math.PI / 180
/** Half-width of each gap between commutator segments, as drawn. */
const SEG_GAP = 7 * DEG

/** Front view of the machine (x right, y up, angles CCW from +x) drawn in screen pixels. */
interface Geo {
  W: number
  H: number
  C: { x: number; y: number }
  s: number
  Ro: number
  yokeIn: number
  rShoe: number
  rPole: number
  rRot: number
  rc: number
  cr: number
  comIn: number
  comOut: number
  brushIn: number
  brushOut: number
  brushW: number
  /** Left edge of the circuit area. */
  cx0: number
  /** x of the battery. */
  xB: number
  yTop: number
  yBot: number
}

function layout(W: number, H: number, compact: boolean): Geo {
  const pad = 6
  const circuitMin = compact ? 112 : 260
  const Ro = Math.max(40, Math.min(H / 2 - pad, (W - circuitMin - 28) / 2))
  const s = Ro / 200
  const C = { x: pad + Ro, y: H / 2 }
  return {
    W, H, C, s, Ro,
    yokeIn: Ro - 14 * s,
    rShoe: 148 * s,
    rPole: 130 * s,
    rRot: 121 * s,
    rc: 102 * s,
    cr: Math.max(7, 12 * s),
    comIn: 19 * s,
    comOut: 29 * s,
    brushIn: 30 * s,
    brushOut: 44 * s,
    brushW: Math.max(5, 10 * s),
    cx0: pad + 2 * Ro + 26,
    xB: W - (compact ? 14 : 22),
    yTop: 5,
    yBot: H - 5,
  }
}

/** Screen point of the math-angle polar coordinate (r, a). */
const pt = (g: Geo, r: number, a: number) => [g.C.x + r * Math.cos(a), g.C.y - r * Math.sin(a)] as const
const f1 = (n: number) => n.toFixed(1)

/** Annular sector between radii r0 < r1 and math angles a0 < a1. */
function sector(g: Geo, r0: number, r1: number, a0: number, a1: number): string {
  const [x0, y0] = pt(g, r1, a0), [x1, y1] = pt(g, r1, a1), [x2, y2] = pt(g, r0, a1), [x3, y3] = pt(g, r0, a0)
  const large = a1 - a0 > Math.PI ? 1 : 0
  // screen y is flipped, so a CCW (math) sweep is sweep-flag 0
  return `M${f1(x0)} ${f1(y0)} A${f1(r1)} ${f1(r1)} 0 ${large} 0 ${f1(x1)} ${f1(y1)} L${f1(x2)} ${f1(y2)} A${f1(r0)} ${f1(r0)} 0 ${large} 1 ${f1(x3)} ${f1(y3)}Z`
}

/** Arrow from (x0, y0) to (x1, y1) with a filled head: [line path, head path]. */
function arrow(x0: number, y0: number, x1: number, y1: number, head = 7): [string, string] {
  const a = Math.atan2(y1 - y0, x1 - x0)
  const bx = x1 - head * Math.cos(a), by = y1 - head * Math.sin(a)
  const w = head * 0.5
  return [
    `M${f1(x0)} ${f1(y0)} L${f1(bx)} ${f1(by)}`,
    `M${f1(x1)} ${f1(y1)} L${f1(bx - w * Math.sin(a))} ${f1(by + w * Math.cos(a))} L${f1(bx + w * Math.sin(a))} ${f1(by - w * Math.cos(a))}Z`,
  ]
}

function Html({ x, y, children, align = 'left', className = '', style }: {
  x: number; y: number; children: ReactNode; align?: 'left' | 'right' | 'center'; className?: string; style?: React.CSSProperties
}) {
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'
  return (
    <div
      className={`pointer-events-none absolute whitespace-nowrap text-[12px] leading-tight ${className}`}
      style={{ left: x, top: y, transform: `translate(${tx}, -50%)`, ...style }}
    >
      {children}
    </div>
  )
}

const MODE_LABEL = { motor: 'MOTOR', generator: 'GENERATOR', idle: 'NO LOAD' } as const

export function MachineView({ model, clock, compact = false, className = '' }: {
  model: Model; clock: Clock; compact?: boolean; className?: string
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const g = useMemo(() => (size.w > 0 && size.h > 0 ? layout(size.w, size.h, compact) : null), [size.w, size.h, compact])
  return (
    <div ref={ref} className={`relative select-none overflow-hidden border border-rule bg-panel ${className}`}>
      {g && <Scene model={model} clock={clock} g={g} compact={compact} />}
    </div>
  )
}

function Scene({ model, clock, g, compact }: { model: Model; clock: Clock; g: Geo; compact: boolean }) {
  const { op, state } = model
  const f = state.poleArc
  const half = (f * Math.PI) / 2
  const bodyHalf = Math.min(half, 34 * DEG)
  const Fref = op.iStart * op.l * op.B // largest |F| in the allowed range (|i| <= V_B / R)
  const Lmax = Math.max(26, 72 * g.s)

  // ---- per-frame elements (moved by the clock, outside React) ----
  const loopLine = useRef<SVGLineElement>(null)
  const seg = [useRef<SVGPathElement>(null), useRef<SVGPathElement>(null)]
  const cond = [useRef<SVGGElement>(null), useRef<SVGGElement>(null)]
  const dot = [useRef<SVGCircleElement>(null), useRef<SVGCircleElement>(null)]
  const cross = [useRef<SVGPathElement>(null), useRef<SVGPathElement>(null)]
  const emf = [useRef<SVGTextElement>(null), useRef<SVGTextElement>(null)]
  const name = [useRef<SVGTextElement>(null), useRef<SVGTextElement>(null)]
  const fLine = [useRef<SVGPathElement>(null), useRef<SVGPathElement>(null)]
  const fHead = [useRef<SVGPathElement>(null), useRef<SVGPathElement>(null)]
  const fText = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)]
  const brushes = [useRef<SVGRectElement>(null), useRef<SVGRectElement>(null)]
  const shortNote = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const draw = (phase: number) => {
      const th = phase
      const states = conductorStates(th, op, f)
      const [ax, ay] = pt(g, g.rc, th), [bx, by] = pt(g, g.rc, th + Math.PI)
      loopLine.current?.setAttribute('x1', f1(ax)); loopLine.current?.setAttribute('y1', f1(ay))
      loopLine.current?.setAttribute('x2', f1(bx)); loopLine.current?.setAttribute('y2', f1(by))
      seg[0].current?.setAttribute('d', sector(g, g.comIn, g.comOut, th + SEG_GAP, th + Math.PI - SEG_GAP))
      seg[1].current?.setAttribute('d', sector(g, g.comIn, g.comOut, th + Math.PI + SEG_GAP, th + 2 * Math.PI - SEG_GAP))
      states.forEach((c, k) => {
        const [x, y] = pt(g, g.rc, c.angle)
        cond[k].current?.setAttribute('transform', `translate(${f1(x)} ${f1(y)})`)
        dot[k].current?.setAttribute('visibility', c.current === 'out' ? 'visible' : 'hidden')
        cross[k].current?.setAttribute('visibility', c.current === 'in' ? 'visible' : 'hidden')
        const e = emf[k].current
        if (e) {
          e.setAttribute('visibility', c.emf ? 'visible' : 'hidden')
          e.textContent = c.emf === 'out' ? '+' : '−'
        }
        // conductor name and voltage sign sit radially inward, where nothing else is drawn
        const [nx, ny] = pt(g, g.rc - g.cr - 11, c.angle)
        name[k].current?.setAttribute('x', f1(nx)); name[k].current?.setAttribute('y', f1(ny + 4))
        // tangential force, CCW positive; screen tangent of CCW motion at angle a is (-sin a, -cos a)
        const show = c.current !== null && c.force !== 0
        const sign = Math.sign(c.force)
        const dx = -Math.sin(c.angle) * sign, dy = -Math.cos(c.angle) * sign
        const L = Math.max(6, (Lmax * Math.abs(c.force)) / Fref)
        const x0 = x + dx * (g.cr + 3), y0 = y + dy * (g.cr + 3)
        const [line, head] = arrow(x0, y0, x0 + dx * L, y0 + dy * L, 7)
        fLine[k].current?.setAttribute('d', show ? line : '')
        fHead[k].current?.setAttribute('d', show ? head : '')
        // voltage sign on the tangent side away from the force arrow, so the two never overlap
        const away = c.force !== 0 ? -Math.sign(c.force) : -1
        const ex = x - Math.sin(c.angle) * away * (g.cr + 9), ey = y - Math.cos(c.angle) * away * (g.cr + 9)
        emf[k].current?.setAttribute('x', f1(ex)); emf[k].current?.setAttribute('y', f1(ey + 5))
        const t = fText[k].current
        if (t) {
          t.style.visibility = show && !compact ? 'visible' : 'hidden'
          const tx = x0 + dx * (L + 8), ty = y0 + dy * (L + 8)
          t.style.left = `${f1(tx)}px`
          t.style.top = `${f1(ty)}px`
          t.style.transform = `translate(${dx < -0.3 ? '-100%' : dx > 0.3 ? '0' : '-50%'}, ${dy < -0.3 ? '-100%' : dy > 0.3 ? '0' : '-50%'})`
        }
      })
      const shorting = isCommutating(th, f)
      brushes.forEach((b) => b.current?.setAttribute('fill', shorting ? 'var(--warn)' : 'var(--ink)'))
      if (shortNote.current) shortNote.current.style.visibility = shorting ? 'visible' : 'hidden'
    }
    draw(clock.phase)
    return clock.subscribe(draw)
  }, [g, op, f, clock, Fref, Lmax, compact])

  // ---- static elements ----
  const fieldLines: ReactNode[] = []
  for (const [pole, centre] of [['N', Math.PI], ['S', 0]] as const) {
    const n = Math.max(3, Math.round((2 * half) / (11 * DEG)))
    for (let j = 0; j < n; j++) {
      const a = centre - half + ((j + 0.5) * 2 * half) / n
      const [x0, y0] = pt(g, g.rShoe - 6 * g.s, a), [x1, y1] = pt(g, g.rRot - 14 * g.s, a)
      const rm = (g.rRot + g.rPole) / 2
      // N: field goes from the pole into the rotor (inward); S: out of the rotor into the pole
      const [hx, hy] = pt(g, pole === 'N' ? rm - 3 : rm + 3, a)
      const [tx, ty] = pt(g, pole === 'N' ? rm + 3 : rm - 3, a)
      const [, head] = arrow(tx, ty, hx, hy, 5)
      fieldLines.push(
        <g key={`${pole}${j}`}>
          <line x1={f1(x0)} y1={f1(y0)} x2={f1(x1)} y2={f1(y1)} stroke={MC.field} strokeOpacity={0.55} strokeWidth={1} />
          <path d={head} fill={MC.field} fillOpacity={0.8} />
        </g>,
      )
    }
  }
  const [nX, nY] = pt(g, (g.rShoe + g.yokeIn) / 2, Math.PI), [sX, sY] = pt(g, (g.rShoe + g.yokeIn) / 2, 0)
  const brushRect = (top: boolean) => {
    const y = top ? g.C.y - g.brushOut : g.C.y + g.brushIn
    return { x: g.C.x - g.brushW / 2, y, width: g.brushW, height: g.brushOut - g.brushIn }
  }
  const turning = op.omega > 0
  const rArc = Math.max(g.comOut + 14, 64 * g.s)
  const [arcA0x, arcA0y] = pt(g, rArc, 58 * DEG), [arcA1x, arcA1y] = pt(g, rArc, 122 * DEG)
  const [tipX, tipY] = pt(g, rArc, 128 * DEG)
  const [, rotHead] = arrow(arcA1x, arcA1y, tipX, tipY, 7)

  // circuit
  const { cx0, xB, yTop, yBot, C } = g
  const xa = cx0 + (xB - cx0) * (compact ? 0.18 : 0.42)
  const xb = xa + (compact ? 30 : 46)
  const zig = (() => {
    const n = 6, w = (xb - xa) / n
    let d = `M${f1(xa)} ${yTop}`
    for (let j = 0; j < n; j++) d += ` L${f1(xa + (j + 0.5) * w)} ${yTop + (j % 2 ? 6 : -6)}`
    return d + ` L${f1(xb)} ${yTop}`
  })()
  const wire = `M${C.x} ${f1(C.y - g.brushOut)} L${C.x} ${yTop} L${f1(xa)} ${yTop} M${f1(xb)} ${yTop} L${xB} ${yTop} L${xB} ${f1(C.y - 7)}`
    + ` M${xB} ${f1(C.y + 7)} L${xB} ${yBot} L${C.x} ${yBot} L${C.x} ${f1(C.y + g.brushOut)}`
  const iArrowX = (cx0 + xa) / 2 + (compact ? -6 : 0)
  const iSign = Math.sign(op.i)
  const [iLine, iHead] = arrow(iArrowX + 11 * iSign, yTop, iArrowX - 11 * iSign, yTop, 8)

  return (
    <>
      <svg width={g.W} height={g.H} className="absolute inset-0" role="img"
        aria-label={`Front view of the rotating loop. ${MODE_LABEL[op.mode]}. omega ${op.omega.toFixed(1)} rad/s, current ${op.i.toFixed(2)} A.`}>
        {/* stator: yoke ring and two poles with curved faces (constant air gap) */}
        {/* yoke as two circles: a single 360° arc is ambiguous in SVG once its end points round together */}
        <circle cx={C.x} cy={C.y} r={g.Ro} fill="var(--rule)" stroke={MC.structure} strokeWidth={1} />
        <circle cx={C.x} cy={C.y} r={g.yokeIn} fill="var(--panel)" stroke={MC.structure} strokeWidth={1} />
        {[Math.PI, 0].map((centre) => (
          <g key={centre} fill="var(--rule)" stroke={MC.structure} strokeWidth={1}>
            <path d={sector(g, g.rShoe - 1, g.yokeIn + 1, centre - bodyHalf, centre + bodyHalf)} />
            <path d={sector(g, g.rPole, g.rShoe, centre - half, centre + half)} />
          </g>
        ))}
        {fieldLines}
        {/* rotor */}
        <circle cx={C.x} cy={C.y} r={g.rRot} fill="var(--sunk)" stroke={MC.structure} strokeWidth={1.25} />
        {/* rotation direction */}
        {turning && (
          <g stroke={MC.mechanical} fill="none" strokeWidth={1.5}>
            <path d={`M${f1(arcA0x)} ${f1(arcA0y)} A${f1(rArc)} ${f1(rArc)} 0 0 0 ${f1(arcA1x)} ${f1(arcA1y)}`} />
            <path d={rotHead} fill={MC.mechanical} stroke="none" />
          </g>
        )}
        {/* loop plane (the end connections bc and da are behind and in front of the rotor) */}
        <line ref={loopLine} stroke="var(--faint)" strokeWidth={1} strokeDasharray="4 4" />
        {/* commutator: two half rings on the shaft, two fixed brushes midway between the poles */}
        <path ref={seg[0]} fill="var(--panel)" stroke={MC.structure} strokeWidth={1} />
        <path ref={seg[1]} fill="var(--panel)" stroke={MC.structure} strokeWidth={1} />
        <circle cx={C.x} cy={C.y} r={Math.max(3, 7 * g.s)} fill={MC.structure} />
        <rect ref={brushes[0]} {...brushRect(true)} rx={1} />
        <rect ref={brushes[1]} {...brushRect(false)} rx={1} />
        {/* wiring and the external circuit */}
        <path d={wire} fill="none" stroke={MC.structure} strokeWidth={1.25} />
        <path d={zig} fill="none" stroke={MC.structure} strokeWidth={1.25} strokeLinejoin="round" />
        <line x1={xB - 13} x2={xB + 13} y1={C.y - 7} y2={C.y - 7} stroke={MC.structure} strokeWidth={2} />
        <line x1={xB - 7} x2={xB + 7} y1={C.y + 7} y2={C.y + 7} stroke={MC.structure} strokeWidth={3} />
        <text x={xB + 10} y={C.y - 12} fontSize={12} fill={MC.voltage} className="num">+</text>
        {/* brush polarity, marked where the leads leave the machine */}
        <text x={C.x + 6} y={yTop + 14} fontSize={12} fill={MC.voltage} className="num">+</text>
        <text x={C.x + 6} y={yBot - 5} fontSize={12} fill={MC.voltage} className="num">−</text>
        {iSign !== 0 && (
          <g>
            <path d={iLine} stroke={MC.current} strokeWidth={2.5} />
            <path d={iHead} fill={MC.current} />
          </g>
        )}
        {/* conductors ab and cd */}
        {[0, 1].map((k) => (
          <g key={k}>
            <path ref={fLine[k]} stroke={MC.mechanical} strokeWidth={2} fill="none" strokeLinecap="round" />
            <path ref={fHead[k]} fill={MC.mechanical} />
            <g ref={cond[k]}>
              <circle r={g.cr} fill="var(--panel)" stroke={MC.structure} strokeWidth={1.25} />
              <circle ref={dot[k]} r={Math.max(2.2, g.cr * 0.3)} fill={MC.current} />
              <path ref={cross[k]} d={`M${-g.cr * 0.55} ${-g.cr * 0.55} L${g.cr * 0.55} ${g.cr * 0.55} M${g.cr * 0.55} ${-g.cr * 0.55} L${-g.cr * 0.55} ${g.cr * 0.55}`}
                stroke={MC.current} strokeWidth={2} />
            </g>
            <text ref={emf[k]} fontSize={compact ? 12 : 14} fontWeight={600} fill={MC.voltage} textAnchor="middle" className="num" />
            <text ref={name[k]} fontSize={11} fill="var(--mute)" textAnchor="middle" className="num">{k === 0 ? 'ab' : 'cd'}</text>
          </g>
        ))}
        <text x={f1(nX)} y={f1(nY + 7)} textAnchor="middle" fontSize={compact ? 16 : 20} fontWeight={600} fill={MC.structure} className="num">N</text>
        <text x={f1(sX)} y={f1(sY + 7)} textAnchor="middle" fontSize={compact ? 16 : 20} fontWeight={600} fill={MC.structure} className="num">S</text>
      </svg>

      {/* labels (HTML, so maths goes through KaTeX) */}
      <div className="absolute left-2 top-2"><Badge strong={op.mode !== 'idle'}>{MODE_LABEL[op.mode]}</Badge></div>
      {[0, 1].map((k) => (
        <div key={k} ref={fText[k]} className="pointer-events-none absolute whitespace-nowrap text-[11.5px] leading-tight" style={{ color: MC.mechanical }}>
          <span className="rounded-[3px] px-0.5" style={{ background: 'color-mix(in srgb, var(--panel) 80%, transparent)' }}>
            <Tex>F</Tex> <span className="num">= {si(Math.abs(op.F), 'N', 3)}</span>
          </span>
        </div>
      ))}
      <div ref={shortNote} className="pointer-events-none absolute whitespace-nowrap text-[11px] font-medium text-warn"
        style={{ left: C.x + g.brushW, top: C.y + g.brushOut + 2 }}>
        {compact ? 'brushes short' : 'brushes short the segments'}
      </div>
      {turning && (
        <Html x={C.x} y={C.y - rArc - 11} align="center" className="text-[11.5px]" style={{ color: MC.mechanical }}>
          <span className="rounded-[3px] px-0.5" style={{ background: 'color-mix(in srgb, var(--sunk) 80%, transparent)' }}><Tex>\omega</Tex></span>
        </Html>
      )}
      <Html x={nX} y={nY + 26 * g.s + 14} align="center" className="text-mute"><Tex>{'\\mathbf{B}'}</Tex></Html>

      {/* circuit labels */}
      {iSign !== 0 && (
        <Html x={iArrowX} y={yTop + 16} align="center" style={{ color: MC.current }}>
          <Tex>i</Tex> <span className="num">= {si(op.i, 'A', 3)}</span>
        </Html>
      )}
      <Html x={(xa + xb) / 2} y={yTop + (compact ? 30 : 16)} align="center" className="text-mute">
        <Tex>R</Tex> <span className="num">= {plain(op.R, 'Ω')}</span>
      </Html>
      <Html x={xB - 18} y={C.y} align="right" style={{ color: MC.voltage }}>
        <Tex>{'V_B'}</Tex> <span className="num">= {si(op.VB, 'V', 3)}</span>
      </Html>
      <Html x={cx0} y={C.y - (compact ? 46 : 52)} style={{ color: MC.voltage }}>
        <Tex>{'e_{ind}'}</Tex> <span className="num">= {si(op.eInd, 'V', 3)}</span>
      </Html>
      {!compact && (
        <Html x={cx0} y={C.y + 44} style={{ color: MC.mechanical }}>
          <Tex>\omega</Tex> <span className="num">= {si(op.omega, 'rad/s', 4)}</span>
        </Html>
      )}
      {!compact && (
        <Html x={cx0} y={C.y + 64} className="text-[11.5px] text-mute">
          <span className="num">n = {op.n.toFixed(0)} r/min</span>
        </Html>
      )}
      <TorqueBlock model={model} g={g} compact={compact} />
    </>
  )
}

/** Shaft block: the load (Mode A) or the prime mover (Mode B) with its torque. */
function TorqueBlock({ model, g, compact }: { model: Model; g: Geo; compact: boolean }) {
  const { op } = model
  const speedGiven = op.given === 'speed'
  const title = speedGiven ? 'Prime mover' : op.tauLoad < 0 ? 'Applied torque' : 'Load'
  const tau = speedGiven ? op.tauPrimeMover : op.tauLoad
  const tex = speedGiven ? '\\tau_{pm}' : '\\tau_{load}'
  const top = g.yBot - (compact ? 50 : 62)
  return (
    <div
      className={`absolute whitespace-nowrap rounded-[3px] border border-rule bg-panel leading-snug ${compact ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-1 text-[11.5px]'}`}
      style={{ left: g.cx0 - (compact ? 8 : 0), top }}
    >
      <div className="tag !text-ink">{title}{!compact && ' · on the shaft'}</div>
      <div style={{ color: MC.mechanical }}>
        <Tex>{tex}</Tex> <span className="num">= {si(tau, 'N·m', 3)}</span>
      </div>
    </div>
  )
}
