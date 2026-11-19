import { ReactNode } from 'react'
import { C, abs, arg, c, mul, scale } from '../../physics/complex'
import { Segmented, useSize } from '../../ui/controls'
import { phaseDeg, si, sig } from '../../ui/format'
import { PERPHASE_COLOR as PC } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { Model, sideTag } from './derive'
import type { CircuitValues } from './engine'

const f1 = (x: number) => x.toFixed(1)

interface Label { x: number; y: number; node: ReactNode; align?: 'left' | 'right' | 'center'; className?: string }

function Labels({ items }: { items: Label[] }) {
  return (
    <>
      {items.map((l, i) => (
        <div key={i} className={`pointer-events-none absolute whitespace-nowrap text-[11px] leading-tight ${l.className ?? ''}`}
          style={{ left: l.x, top: l.y, transform: `translate(${l.align === 'right' ? '-100%' : l.align === 'center' ? '-50%' : '0'}, -50%)` }}>
          {l.node}
        </div>
      ))}
    </>
  )
}

const polarTxt = (z: C, unit: string, d = 4) => `${unit ? si(abs(z), unit, d) : sig(abs(z), d)} ∠ ${phaseDeg(arg(z))}`

/** Zig-zag resistor between two points (horizontal or vertical). */
function resistor(x0: number, y0: number, x1: number, y1: number, n = 6, amp = 5): string {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, px = -uy, py = ux
  const lead = L * 0.15, body = L - 2 * lead
  let d = `M${f1(x0)} ${f1(y0)}L${f1(x0 + ux * lead)} ${f1(y0 + uy * lead)}`
  for (let i = 0; i < n; i++) {
    const t = lead + ((i + 0.5) / n) * body, s = i % 2 ? -amp : amp
    d += `L${f1(x0 + ux * t + px * s)} ${f1(y0 + uy * t + py * s)}`
  }
  return d + `L${f1(x1 - ux * lead)} ${f1(y1 - uy * lead)}L${f1(x1)} ${f1(y1)}`
}
/** Inductor (four bumps) between two points. */
function inductor(x0: number, y0: number, x1: number, y1: number, n = 4): string {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L
  const lead = L * 0.12, step = (L - 2 * lead) / n, r = step / 2
  let d = `M${f1(x0)} ${f1(y0)}L${f1(x0 + ux * lead)} ${f1(y0 + uy * lead)}`
  for (let i = 0; i < n; i++) {
    const ex = x0 + ux * (lead + (i + 1) * step), ey = y0 + uy * (lead + (i + 1) * step)
    d += `A${f1(r)} ${f1(r)} 0 0 1 ${f1(ex)} ${f1(ey)}`
  }
  return d + `L${f1(x1)} ${f1(y1)}`
}
/** Small arrow head at (x, y) pointing along (ux, uy). */
const head = (x: number, y: number, ux: number, uy: number, s = 6) =>
  `M${f1(x)} ${f1(y)}l${f1(-ux * s - uy * s * 0.55)} ${f1(-uy * s + ux * s * 0.55)}M${f1(x)} ${f1(y)}l${f1(-ux * s + uy * s * 0.55)} ${f1(-uy * s - ux * s * 0.55)}`

/** Per-phase approximate equivalent circuit of one transformer with live values on the chosen side. */
export function CircuitDiagram({ model, className = '' }: { model: Model; className?: string }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const r = model.real!, o = model.sol.real
  const side = model.state.refSide
  const W = size.w, H = 230
  if (!o || !r.circuit || W <= 0) return <div ref={ref} className={`relative border border-rule bg-panel ${className}`} style={{ height: H }} />
  const R = r.rating, b = r.bases, a = R.a
  const vals: CircuitValues = side === 'P' ? r.circuit.P : side === 'S' ? r.circuit.S : r.circuit.pu
  const unit = side === 'pu' ? '' : 'Ω'
  const ohm = (v: number) => (unit ? si(v, 'Ω', 4) : `${sig(v, 4)} pu`)
  // voltages and currents on the chosen side (per-phase frame: V_φS at 0°)
  const Vl = side === 'P' ? o.VphiP : side === 'S' ? scale(o.VphiP, 1 / a) : scale(o.VphiP, 1 / R.VphiP)
  const Vr = side === 'P' ? scale(o.VphiS, a) : side === 'S' ? o.VphiS : scale(o.VphiS, 1 / R.VphiS)
  const Il = side === 'P' ? o.IphiP : side === 'S' ? scale(o.IphiP, a) : scale(o.IphiP, 1 / b.IphiBaseP)
  const Ie = side === 'P' ? o.Iex : side === 'S' ? scale(o.Iex, a) : scale(o.Iex, 1 / b.IphiBaseP)
  const Ir = side === 'P' ? scale(o.IphiS, 1 / a) : side === 'S' ? o.IphiS : scale(o.IphiS, 1 / b.IphiBaseS)
  const vu = side === 'pu' ? '' : 'V', iu = side === 'pu' ? '' : 'A'
  const VlSym = side === 'P' ? 'V_{\\phi P}' : side === 'S' ? 'V_{\\phi P}/a' : 'V_P'
  const VrSym = side === 'P' ? 'aV_{\\phi S}' : side === 'S' ? 'V_{\\phi S}' : 'V_S'
  const IlSym = side === 'P' ? 'I_{\\phi P}' : side === 'S' ? 'aI_{\\phi P}' : 'I_P'
  const IrSym = side === 'P' ? 'I_{\\phi S}/a' : side === 'S' ? 'I_{\\phi S}' : 'I_S'
  const sub = side === 'P' ? ',P' : side === 'S' ? ',S' : ''

  const xL = 28, xR = W - 28, span = xR - xL
  const yT = 70, yB = 182
  const xs = xL + span * 0.24
  const xRc = xs - 18, xXm = xs + 18
  const xr0 = xL + span * 0.45, xr1 = xr0 + Math.min(70, span * 0.15)
  const xx0 = xr1 + Math.max(14, span * 0.04), xx1 = xx0 + Math.min(80, span * 0.17)
  const shuntOff = r.noShunt, seriesOff = r.noSeries
  const col = (off: boolean) => (off ? PC.neglected : PC.element)
  const labels: Label[] = [
    { x: xL - 4, y: yT - 22, node: <><Tex>{VlSym}</Tex></>, className: 'font-medium' },
    { x: xL - 4, y: yT - 8, node: <span className="num" style={{ color: PC.voltage }}>{polarTxt(Vl, vu)}</span> },
    { x: xR + 4, y: yT - 22, align: 'right', node: <Tex>{VrSym}</Tex>, className: 'font-medium' },
    { x: xR + 4, y: yT - 8, align: 'right', node: <span className="num" style={{ color: PC.voltage }}>{polarTxt(Vr, vu)}</span> },
    { x: xL + 6, y: (yT + yB) / 2 - 7, node: <span className="text-mute">+ primary</span> },
    { x: xL + 6, y: (yT + yB) / 2 + 7, node: <span className="text-mute">({sideTag(model, 'P')})</span> },
    { x: xR - 6, y: (yT + yB) / 2 - 7, align: 'right', node: <span className="text-mute">secondary +</span> },
    { x: xR - 6, y: (yT + yB) / 2 + 7, align: 'right', node: <span className="text-mute">({sideTag(model, 'S')})</span> },
    { x: (xr0 + xr1) / 2, y: yT - 30, align: 'center', node: <Tex>{`R_{eq${sub}}`}</Tex> },
    { x: (xr0 + xr1) / 2, y: yT - 17, align: 'center', node: <span className="num" style={{ color: col(seriesOff) }}>{seriesOff ? 'neglected' : ohm(vals.Req)}</span> },
    { x: (xx0 + xx1) / 2, y: yT - 30, align: 'center', node: <Tex>{`jX_{eq${sub}}`}</Tex> },
    { x: (xx0 + xx1) / 2, y: yT - 17, align: 'center', node: <span className="num" style={{ color: col(seriesOff) }}>{seriesOff ? 'neglected' : ohm(vals.Xeq)}</span> },
    { x: xRc - 10, y: (yT + yB) / 2 - 6, align: 'right', node: <Tex>{`R_{C${sub}}`}</Tex> },
    { x: xRc - 10, y: (yT + yB) / 2 + 8, align: 'right', node: <span className="num" style={{ color: col(shuntOff) }}>{shuntOff ? 'neglected' : vals.RC === null || !Number.isFinite(vals.RC) ? '∞' : ohm(vals.RC)}</span> },
    { x: xXm + 10, y: (yT + yB) / 2 - 6, node: <Tex>{`jX_{M${sub}}`}</Tex> },
    { x: xXm + 10, y: (yT + yB) / 2 + 8, node: <span className="num" style={{ color: col(shuntOff) }}>{shuntOff ? 'neglected' : vals.XM === null || !Number.isFinite(vals.XM) ? '∞' : ohm(vals.XM)}</span> },
    { x: (xL + xRc) / 2 - 4, y: yT + 14, align: 'center', node: <><Tex>{IlSym}</Tex></> },
    { x: (xL + xRc) / 2 - 4, y: yT + 28, align: 'center', node: <span className="num" style={{ color: PC.current }}>{polarTxt(Il, iu, 3)}</span> },
    { x: xs, y: yB + 18, align: 'center', node: <><Tex>{'I_{ex}'}</Tex> <span className="num" style={{ color: shuntOff ? PC.neglected : PC.current }}>{shuntOff ? '0' : polarTxt(Ie, iu, 3)}</span></> },
    { x: (xx1 + xR) / 2 + 6, y: yT + 14, align: 'center', node: <Tex>{IrSym}</Tex> },
    { x: (xx1 + xR) / 2 + 6, y: yT + 28, align: 'center', node: <span className="num" style={{ color: PC.current }}>{polarTxt(Ir, iu, 3)}</span> },
  ]
  const yS0 = yT + 24, yS1 = yB - 24
  return (
    <div ref={ref} className={`relative overflow-hidden border border-rule bg-panel ${className}`} style={{ height: H }}>
      <svg width={W} height={H} className="absolute inset-0" role="img"
        aria-label={`Approximate equivalent circuit of one transformer, referred to the ${side === 'pu' ? 'per-unit system' : side === 'P' ? 'primary' : 'secondary'}.`}>
        <g fill="none" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
          {/* wires */}
          <path d={`M${xL} ${yT}H${xr0}M${xr1} ${yT}H${xx0}M${xx1} ${yT}H${xR}M${xL} ${yB}H${xR}`} stroke={PC.element} />
          {/* shunt branch: R_C ∥ jX_M */}
          <path d={`M${xRc} ${yT}V${yS0}M${xXm} ${yT}V${yS0}M${xRc} ${yS1}V${yB}M${xXm} ${yS1}V${yB}M${xRc} ${yT}H${xXm}M${xRc} ${yB}H${xXm}`} stroke={col(shuntOff)} />
          <path d={resistor(xRc, yS0, xRc, yS1)} stroke={col(shuntOff)} strokeDasharray={shuntOff ? '3 3' : undefined} />
          <path d={inductor(xXm, yS0, xXm, yS1)} stroke={col(shuntOff)} strokeDasharray={shuntOff ? '3 3' : undefined} />
          {/* series branch */}
          <path d={resistor(xr0, yT, xr1, yT)} stroke={col(seriesOff)} strokeDasharray={seriesOff ? '3 3' : undefined} />
          <path d={inductor(xx0, yT, xx1, yT)} stroke={col(seriesOff)} strokeDasharray={seriesOff ? '3 3' : undefined} />
          {/* current arrows */}
          <path d={`M${xL + 10} ${yT}H${xRc - 14}${head(xRc - 14, yT, 1, 0)}`} stroke={PC.current} strokeWidth={1.8} />
          <path d={`M${xx1 + 10} ${yT}H${xR - 10}${head(xR - 10, yT, 1, 0)}`} stroke={PC.current} strokeWidth={1.8} />
          {!shuntOff && <path d={`M${xs} ${yT + 6}V${yT + 20}${head(xs, yT + 20, 0, 1, 5)}`} stroke={PC.current} strokeWidth={1.6} />}
        </g>
        {[[xL, yT], [xL, yB], [xR, yT], [xR, yB]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r={3.2} fill="var(--panel)" stroke={PC.element} strokeWidth={1.3} />)}
        {[[xRc, yT], [xXm, yT], [xRc, yB], [xXm, yB]].map(([x, y], i) => <circle key={`j${i}`} cx={x} cy={y} r={2} fill={col(shuntOff)} />)}
      </svg>
      <Labels items={labels} />
    </div>
  )
}

/** Small sketch of one test: meters on the test side, the other side open (OC) or shorted (SC). */
export function TestSketch({ model, kind }: { model: Model; kind: 'OC' | 'SC' }) {
  const s = model.state
  const r = model.real!
  const res = kind === 'OC' ? r.tests?.oc : r.tests?.sc
  const on = kind === 'OC' ? s.ocOn : s.scOn
  const sideP = (kind === 'OC' ? s.ocSide : s.scSide) === 'P'
  const form = kind === 'OC' ? s.ocForm : s.scForm
  const star = sideP ? model.sol.pri.star : model.sol.sec.star
  const W = 230, H = 104
  // meters on the left when the test is on the primary, else mirrored
  const mx = (x: number) => (sideP ? x : W - x)
  const coil = (x: number, dir: number) => inductor(x, 30, x, 74, 3).replace(/A(\S+) (\S+) 0 0 1/g, `A$1 $2 0 0 ${dir > 0 ? 1 : 0}`)
  return (
    <div className="min-w-0">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="tag !text-ink">{kind === 'OC' ? 'Open-circuit test' : 'Short-circuit test'}</span>
        <span className="text-[11px] text-mute">{on ? `on the ${sideP ? 'primary' : 'secondary'} (${sideTag(model, sideP ? 'P' : 'S')})` : 'not used'}</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full max-w-[260px]" role="img"
        aria-label={`${kind} test set-up: meters on the ${sideP ? 'primary' : 'secondary'} side, other side ${kind === 'OC' ? 'open' : 'shorted'}.`}>
        <g fill="none" stroke={on ? PC.element : PC.neglected} strokeWidth={1.3} strokeLinecap="round">
          {/* transformer: two coils and the core */}
          <path d={coil(mx(98), sideP ? 1 : -1)} />
          <path d={coil(mx(132), sideP ? -1 : 1)} />
          <path d={`M${W / 2 - 3} 26V78M${W / 2 + 3} 26V78`} />
          {/* test side: source, ammeter in series, voltmeter across, wattmeter */}
          <path d={`M${mx(98)} 30V20H${mx(14)}V84H${mx(98)}V74`} />
          <circle cx={mx(14)} cy={52} r={9} fill="var(--panel)" />
          <path d={`M${mx(14) - 5} 52q2.5 -5 5 0t5 0`} />
          <circle cx={mx(46)} cy={20} r={8} fill="var(--panel)" />
          <rect x={mx(70) - 9} y={12} width={18} height={16} fill="var(--panel)" />
          <path d={`M${mx(84)} 20V84`} strokeDasharray="0" />
          <circle cx={mx(84)} cy={52} r={8} fill="var(--panel)" />
          {/* other side: open or shorted */}
          <path d={kind === 'OC' ? `M${mx(132)} 30V20H${mx(170)}M${mx(132)} 74V84H${mx(170)}` : `M${mx(132)} 30V20H${mx(170)}V84H${mx(132)}V74`} />
          {kind === 'OC' && <><circle cx={mx(172)} cy={20} r={2.5} fill="var(--panel)" /><circle cx={mx(172)} cy={84} r={2.5} fill="var(--panel)" /></>}
        </g>
        <g fontSize={9.5} textAnchor="middle" fill={on ? 'var(--ink)' : 'var(--faint)'} className="num">
          <text x={mx(46)} y={23.5}>A</text>
          <text x={mx(70)} y={23.5}>W</text>
          <text x={mx(84)} y={55.5}>V</text>
          <text x={mx(196)} y={55}>{kind === 'OC' ? 'open' : 'short'}</text>
        </g>
      </svg>
      {on && res ? (
        <p className="mt-1 text-[11px] leading-snug text-mute">
          One transformer: <span className="num text-ink">{si(res.perPhase.V, 'V', 4)}, {si(res.perPhase.I, 'A', 4)}, {si(res.perPhase.P, 'W', 4)}</span>
          {form === 'bank' && <> — from line readings on a {star ? 'Y side: V ÷ √3, I as read' : 'Δ side: V as read, I ÷ √3'}, P ÷ 3.</>}
        </p>
      ) : <p className="mt-1 text-[11px] leading-snug text-mute">{kind === 'OC' ? 'No OC data: the shunt branch is neglected.' : 'No SC data: the series impedance is zero.'}</p>}
    </div>
  )
}

/** Per-phase phasor diagram (Chapman Figs. 2-24, 2-25): V_φS, I_φS, the R and jX drops, V_φP/a, δ and VR. */
export function PerPhasePhasors({ model, onGain, className = '' }: { model: Model; onGain: (g: 1 | 5 | 10) => void; className?: string }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const o = model.sol.real
  const r = model.real!
  const gain = model.state.gain
  const W = size.w, H = 240
  if (!o || !r.circuit || W <= 0) return <div ref={ref} className={`relative border border-rule bg-panel ${className}`} style={{ height: H }} />
  const V = o.VphiS, I = o.IphiS
  const RI = scale(I, r.circuit.ZseS.re), XI = mul(c(0, r.circuit.ZseS.im), I)
  // drawn (drops magnified by the display gain)
  const P1 = { re: V.re + gain * RI.re, im: V.im + gain * RI.im }
  const P2 = { re: P1.re + gain * XI.re, im: P1.im + gain * XI.im }
  const Imag = abs(I), Ilen = 0.42 * abs(V)
  const Id = Imag > 0 ? scale(I, Ilen / Imag) : c(0)
  const xs = [0, V.re, P1.re, P2.re, Id.re], ys = [0, V.im, P1.im, P2.im, Id.im]
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys)
  const pad = 34
  const k = Math.min((W - 2 * pad) / Math.max(maxX - minX, 1e-9), (H - 2 * pad) / Math.max(maxY - minY, 1e-9 + 0.25 * (maxX - minX)))
  const ox = pad - minX * k, oy = H / 2 + ((maxY + minY) / 2) * k
  const X = (z: C) => ox + z.re * k, Y = (z: C) => oy - z.im * k
  const arrow = (from: C, to: C, color: string, width = 2, dash?: string) => {
    const x0 = X(from), y0 = Y(from), x1 = X(to), y1 = Y(to), L = Math.hypot(x1 - x0, y1 - y0) || 1
    return <path d={`M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}${head(x1, y1, (x1 - x0) / L, (y1 - y0) / L, 7)}`} stroke={color} strokeWidth={width} fill="none" strokeDasharray={dash} strokeLinecap="round" />
  }
  const delta = Math.atan2(P2.im, P2.re)
  const ra = Math.min(60, 0.35 * abs(P2) * k)
  const labels: Label[] = [
    { x: (ox + X(V)) / 2, y: Y(V) + 13, align: 'center', node: <Tex>{'V_{\\phi S}'}</Tex> },
    { x: X(Id) + 4, y: Y(Id) + (Id.im < 0 ? 10 : -10), node: <><Tex>{'I_{\\phi S}'}</Tex> <span className="text-mute">(own scale)</span></> },
    { x: X(P1) + 8, y: Y(P1) + (P1.im <= V.im ? 12 : -12), node: <Tex>{'R_{eq,S}I_{\\phi S}'}</Tex> },
    { x: X(P2) + 6, y: (Y(P1) + Y(P2)) / 2, node: <Tex>{'jX_{eq,S}I_{\\phi S}'}</Tex> },
    { x: (X(P2)) / 2 + ox / 2 - 8, y: (Y(P2) + oy) / 2 - 12, align: 'right', node: <Tex>{'V_{\\phi P}/a'}</Tex> },
    { x: ox + ra + 6, y: oy - (Math.sin(delta / 2) * ra) - 4, node: <><Tex>{'\\delta'}</Tex> <span className="num">= {sig(o.deltaDeg, 4)}°</span></> },
  ]
  return (
    <div className={className}>
      <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11.5px] text-mute">One transformer, referred to the secondary. <span className="num text-ink">VR = {sig(o.VR, 5)} %</span></span>
        <Segmented<'1' | '5' | '10'> label="Display gain of the drops" value={String(gain) as '1' | '5' | '10'} onChange={(v) => onGain(Number(v) as 1 | 5 | 10)}
          options={[{ value: '1', label: 'drops ×1' }, { value: '5', label: '×5' }, { value: '10', label: '×10' }]} />
      </div>
      <div ref={ref} className="relative overflow-hidden border border-rule bg-panel" style={{ height: H }}>
        <svg width={W} height={H} className="absolute inset-0" role="img"
          aria-label={`Per-phase phasor diagram: V_phiP/a leads V_phiS by ${o.deltaDeg.toFixed(2)} degrees; VR ${o.VR.toFixed(2)} percent.`}>
          <line x1={0} x2={W} y1={oy} y2={oy} stroke="var(--rule)" />
          <path d={`M${f1(ox + ra)} ${f1(oy)}A${f1(ra)} ${f1(ra)} 0 0 ${delta > 0 ? 0 : 1} ${f1(ox + ra * Math.cos(delta))} ${f1(oy - ra * Math.sin(delta))}`} stroke="var(--mute)" fill="none" />
          {arrow(c(0), Id, PC.current, 1.8, '5 3')}
          {arrow(c(0), V, PC.voltage, 2.4)}
          {arrow(V, P1, PC.voltage, 1.6)}
          {arrow(P1, P2, PC.voltage, 1.6)}
          {arrow(c(0), P2, PC.voltage, 2.4, '7 3')}
        </svg>
        <Labels items={labels} />
        {gain > 1 && (
          <div className="pointer-events-none absolute left-2 top-1.5 rounded-[3px] px-1 text-[11px] text-warn" style={{ background: 'color-mix(in srgb, var(--panel) 85%, transparent)' }}>
            drops shown ×{gain}, display only
          </div>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-snug text-mute">
        True values: <span className="num text-ink">V_φS = {polarTxt(V, 'V')}, I_φS = {polarTxt(I, 'A')}, R·I = {si(abs(RI), 'V', 4)}, X·I = {si(abs(XI), 'V', 4)}, V_φP/a = {polarTxt(o.VPa, 'V', 5)}</span>.
        {' '}Solid: <Tex>{'V_{\\phi S}'}</Tex> and the drops; long dashes: <Tex>{'V_{\\phi P}/a'}</Tex>; short dashes: current.
      </p>
    </div>
  )
}
