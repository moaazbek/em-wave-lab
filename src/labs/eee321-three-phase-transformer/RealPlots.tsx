import { useMemo } from 'react'
import { useSize } from '../../ui/controls'
import { si, sig } from '../../ui/format'
import { PERPHASE_COLOR as PC } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import type { Model } from './derive'
import { NETLISTS, Params, realParams, sweepLoad } from './engine'

/** P_in → P_out + P_Cu + P_core on one scale, with η; the reactive powers in a second, smaller row. */
export function PowerBars({ model }: { model: Model }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const o = model.sol.real
  const W = size.w
  if (!o) return null
  const Pin = o.Sin.re
  const parts = [
    { key: 'out', label: <Tex>{'P_{out}'}</Tex>, v: o.Pout, fill: PC.power, opacity: 1 },
    { key: 'cu', label: <Tex>{'P_{Cu}'}</Tex>, v: o.Pcu, fill: PC.power, opacity: 0.45 },
    { key: 'core', label: <Tex>{'P_{core}'}</Tex>, v: o.Pcore, fill: 'url(#xf-hatch)', opacity: 1 },
  ]
  const Qtot = o.Qwind + o.Qcore
  const q = [
    { key: 'qw', label: <Tex>{'Q_{windings}'}</Tex>, v: o.Qwind, fill: PC.power, opacity: 0.45 },
    { key: 'qc', label: <Tex>{'Q_{core}'}</Tex>, v: o.Qcore, fill: 'url(#xf-hatch)', opacity: 1 },
  ]
  const bar = (items: typeof parts, total: number, y: number, h: number) => {
    let x = 0
    return items.map((p) => {
      const w = total > 0 ? Math.max(p.v > 0 ? 2 : 0, (p.v / total) * W) : 0
      const el = <rect key={p.key} x={x} y={y} width={w} height={h} fill={p.fill} opacity={p.opacity} stroke="var(--panel)" strokeWidth={0.5} />
      x += w
      return el
    })
  }
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[11.5px] text-mute">
        <span><Tex>{'P_{in}'}</Tex> = <span className="num text-ink">{si(Pin, 'W', 5)}</span> → </span>
        <span className="num text-ink"><Tex>{'\\eta'}</Tex> = {sig(o.eta, 5)} %</span>
      </div>
      <div ref={ref}>
        {W > 0 && (
          <svg width={W} height={52} className="block" role="img"
            aria-label={`P_in ${Pin.toFixed(0)} W: P_out ${o.Pout.toFixed(0)} W, copper loss ${o.Pcu.toFixed(1)} W, core loss ${o.Pcore.toFixed(1)} W.`}>
            <defs>
              <pattern id="xf-hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="5" height="5" fill="var(--panel)" /><line x1="0" y1="0" x2="0" y2="5" stroke={PC.power} strokeWidth="2.2" />
              </pattern>
            </defs>
            {bar(parts, Pin, 0, 26)}
            {Qtot > 0 && bar(q, Qtot, 36, 12)}
          </svg>
        )}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-mute">
        {parts.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5">
            <svg width="14" height="10" aria-hidden><rect width="14" height="10" fill={p.fill} opacity={p.opacity} /></svg>
            {p.label} <span className="num text-ink">{si(p.v, 'W', 4)}</span> ({sig(Pin > 0 ? (p.v / Pin) * 100 : 0, 3)} %)
          </span>
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mute">
        <span>Second row (own scale):</span>
        {q.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5">
            <svg width="14" height="8" aria-hidden><rect width="14" height="8" fill={p.fill} opacity={p.opacity} /></svg>
            {p.label} <span className="num text-ink">{si(p.v, 'var', 4)}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

const FRAC = Array.from({ length: 51 }, (_, i) => (i / 50) * 1.25)
const PAD = { l: 44, r: 10, t: 10, b: 26 }

function Plot({ series, cursor, yLabel, unit, height = 170 }: {
  series: { key: string; ys: number[]; color: string; dash?: string; label: string }[]
  cursor: { x: number; y: number }
  yLabel: React.ReactNode
  unit: string
  height?: number
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const W = size.w, H = height
  const all = series.flatMap((s) => s.ys).filter(Number.isFinite)
  let lo = Math.min(0, ...all), hi = Math.max(...all, lo + 1e-6)
  // efficiency: zoom on the useful range (from 10 % load); lighter loads fall below the axis and are not drawn
  if (unit === '%' && hi > 90) { lo = Math.max(0, Math.floor(Math.min(...series.flatMap((s) => s.ys.slice(5)).filter(Number.isFinite))) - 1); hi = 100 }
  const span = hi - lo || 1
  const iw = Math.max(1, W - PAD.l - PAD.r), ih = H - PAD.t - PAD.b
  const X = (x: number) => PAD.l + (x / 1.25) * iw
  const Y = (y: number) => PAD.t + (1 - (y - lo) / span) * ih
  const path = (ys: number[]) => {
    let d = '', pen = false
    ys.forEach((y, i) => {
      if (!Number.isFinite(y) || y < lo || y > hi + 1e-9 * span) { pen = false; return }
      d += `${pen ? 'L' : 'M'}${X(FRAC[i]).toFixed(1)} ${Y(y).toFixed(1)}`
      pen = true
    })
    return d
  }
  const ticks = [lo, lo + span / 2, hi]
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-mute">
        <span>{yLabel}</span>
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <svg width="22" height="6" aria-hidden><line x1="0" y1="3" x2="22" y2="3" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} /></svg>{s.label}
          </span>
        ))}
      </div>
      <div ref={ref} className="relative" style={{ height: H }}>
        {W > 0 && (
          <svg width={W} height={H} className="absolute inset-0" role="img" aria-label={`Plot against load: ${series.map((s) => s.label).join(', ')}.`}>
            {ticks.map((t, i) => (
              <g key={i}>
                <line x1={PAD.l} x2={W - PAD.r} y1={Y(t)} y2={Y(t)} stroke="var(--rule)" strokeDasharray={i ? '2 4' : undefined} />
                <text x={PAD.l - 5} y={Y(t) + 3.5} textAnchor="end" fontSize={10.5} className="num" fill="var(--mute)">{sig(t, 3)}{unit}</text>
              </g>
            ))}
            {lo < 0 && hi > 0 && <line x1={PAD.l} x2={W - PAD.r} y1={Y(0)} y2={Y(0)} stroke="var(--faint)" />}
            {[0, 0.25, 0.5, 0.75, 1, 1.25].map((x) => (
              <text key={x} x={X(x)} y={H - 8} textAnchor={x === 0 ? 'start' : x === 1.25 ? 'end' : 'middle'} fontSize={10.5} className="num" fill="var(--mute)">{x * 100}%</text>
            ))}
            {series.map((s) => <path key={s.key} d={path(s.ys)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash} strokeLinejoin="round" />)}
            {Number.isFinite(cursor.y) && cursor.x <= 1.25 && (
              <>
                <line x1={X(cursor.x)} x2={X(cursor.x)} y1={PAD.t} y2={H - PAD.b} stroke="var(--mute)" />
                <circle cx={X(cursor.x)} cy={Y(cursor.y)} r={4} fill="var(--panel)" stroke="var(--ink)" strokeWidth={1.5} />
              </>
            )}
          </svg>
        )}
      </div>
      <div className="mt-0.5 text-right text-[11px] text-mute">load, % of rated (<Tex>{'S_{load}/S'}</Tex>)</div>
    </div>
  )
}

/** VR (chosen PF lagging, unity, leading) and η (chosen PF) against load, 0–125 % (Problem 2-13(c)–(d)). */
export function LoadPlots({ model }: { model: Model }) {
  const r = model.real!
  const s = model.state
  const o = model.sol.real
  const data = useMemo(() => {
    if (!r.circuit || !o) return null
    const base: Params = { netlist: NETLISTS[s.conn], VLL: r.rating.VLL, a: r.rating.a, S3: 0, pf: s.pf, lagging: s.lagging, seq: s.seq, f: s.f, real: realParams(r.rating, r.circuit, s.hold) }
    const pf = s.pf >= 1 ? 0.8 : s.pf
    const lag = sweepLoad({ ...base, pf, lagging: true }, r.rating.S, FRAC)
    const unity = sweepLoad({ ...base, pf: 1 }, r.rating.S, FRAC)
    const lead = sweepLoad({ ...base, pf, lagging: false }, r.rating.S, FRAC)
    const own = sweepLoad(base, r.rating.S, FRAC)
    return { pf, lag, unity, lead, own }
  }, [r.circuit, r.rating, s.conn, s.pf, s.lagging, s.hold, s.seq, s.f])
  if (!data || !o) return null
  const pfTxt = sig(data.pf, 3)
  const kind = s.pf >= 1 ? 'unity PF' : `PF ${sig(s.pf, 3)} ${s.lagging ? 'lagging' : 'leading'}`
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Plot
        yLabel={<>VR (%)</>} unit="%"
        series={[
          { key: 'lag', ys: data.lag.map((p) => p.VR), color: PC.voltage, label: `${pfTxt} lagging` },
          { key: 'unity', ys: data.unity.map((p) => p.VR), color: PC.voltage, dash: '6 4', label: 'unity' },
          { key: 'lead', ys: data.lead.map((p) => p.VR), color: PC.voltage, dash: '2 3', label: `${pfTxt} leading` },
        ]}
        cursor={{ x: r.frac, y: o.VR }}
      />
      <Plot
        yLabel={<><Tex>{'\\eta'}</Tex> (%), {kind}</>} unit="%"
        series={[{ key: 'eta', ys: data.own.map((p) => p.eta), color: PC.power, label: kind }]}
        cursor={{ x: r.frac, y: o.eta }}
      />
    </div>
  )
}
