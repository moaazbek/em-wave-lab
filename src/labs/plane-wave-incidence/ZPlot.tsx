import { useEffect, useMemo, useRef } from 'react'
import { sampleZProfile } from '../../physics'
import { useSize } from '../../ui/controls'
import { niceBelow, sig, siShort } from '../../ui/format'
import { Tex } from '../../ui/Tex'
import type { Clock } from './clock'
import { Model, medium2Gain, shownAxis } from './derive'
import { makeViewport, pxToZ, zToPx } from './viewport'

const PAD_T = 26
const PAD_B = 22
/** Vertical range in units of the incident amplitude (same as the colour range of the map). */
const RANGE = 2.15

const PART_COLOR = { total: 'var(--ink)', inc: 'var(--inc)', ref: 'var(--ref)', trans: 'var(--trn)' } as const

/** Field along z through x = 0: instantaneous value plus the envelope |F(z)|. Shares the z axis of the map. */
export function ZPlot({ model, clock, height = 150 }: { model: Model; clock: Clock; height?: number }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const pathRef = useRef<SVGPathElement>(null)
  const { sol, state } = model
  const axis = shownAxis(state)
  const gain = medium2Gain(sol, state.part, state.quantity, axis)
  const W = size.w
  const H = height
  const mid = PAD_T + (H - PAD_T - PAD_B) / 2
  const unit = (H - PAD_T - PAD_B) / 2 / RANGE // px per incident amplitude

  const data = useMemo(() => {
    if (W <= 0) return null
    const v = makeViewport(W, H, sol)
    const n = Math.max(2, Math.round(W))
    const zs = new Float64Array(n)
    for (let i = 0; i < n; i++) zs[i] = pxToZ(v, (i * W) / (n - 1))
    const re = new Float64Array(n), im = new Float64Array(n)
    sampleZProfile(sol, state.part, state.quantity, axis, zs, re, im)
    // Display only: Medium 2 is drawn amplified when its field is weak (labelled on the plot, with a true-value axis).
    for (let i = 0; i < n; i++) if (zs[i] >= 0) { re[i] *= gain; im[i] *= gain }
    const norm = state.quantity === 'E' ? sol.e0 : sol.e0 / sol.p1.eta.re
    const y = (val: number) => mid - Math.max(-RANGE, Math.min(RANGE, val / norm)) * unit
    let up = '', down = ''
    for (let i = 0; i < n; i++) {
      const x = ((i * W) / (n - 1)).toFixed(1)
      const m = Math.hypot(re[i], im[i])
      up += `${i ? 'L' : 'M'}${x} ${y(m).toFixed(1)}`
      down = `L${x} ${y(-m).toFixed(1)}` + down
    }
    return { v, n, re, im, y, envelope: up + down + 'Z' }
  }, [W, H, sol, state.part, state.quantity, axis, mid, unit, gain])

  useEffect(() => {
    if (!data) return
    const { n, re, im, y } = data
    const draw = (phase: number) => {
      const cs = Math.cos(phase), sn = Math.sin(phase)
      let d = ''
      for (let i = 0; i < n; i++) d += `${i ? 'L' : 'M'}${((i * W) / (n - 1)).toFixed(1)} ${y(re[i] * cs - im[i] * sn).toFixed(1)}`
      pathRef.current?.setAttribute('d', d)
    }
    draw(clock.phase)
    return clock.subscribe(draw)
  }, [data, clock, W])

  const v = data?.v
  const lam = sol.p1.lambda
  const ticks1: number[] = []
  const ticks2: { z: number; label: string }[] = []
  if (v) {
    for (let k = 0; k * 0.5 <= v.n1 + 1e-9; k++) ticks1.push(-k * 0.5)
    if (!v.magnified) {
      for (let k = 1; zToPx(v, k * 0.5 * lam) < W - 4; k++) ticks2.push({ z: k * 0.5 * lam, label: k % 2 === 0 ? `${k / 2}` : '' })
    } else {
      // At least ~80 px between labelled ticks, and none too close to the "z = 0" label.
      const step = niceBelow(Math.max((W - v.bx) / 4, 80) / v.ppm2z * 1.999)
      for (let k = 1; zToPx(v, k * step) < W - 16; k++)
        ticks2.push({ z: k * step, label: zToPx(v, k * step) - v.bx > 44 ? siShort(k * step, 'm') : '' })
    }
  }
  const showSw = model.normal && axis === 'y' && state.part === 'total' && state.quantity === 'E' && sol.R > 1e-4
  const fieldTex = `${state.quantity}_${axis}`
  const normTex = state.quantity === 'E' ? 'E_{i0}' : '(E_{i0}/\\eta_1)'

  return (
    <div ref={ref} className="relative border-x border-b border-rule bg-panel" style={{ height: H }}>
      {v && data && (
        <svg width={W} height={H} className="absolute inset-0" role="img" aria-label="Field along z through x = 0">
          {[-2, -1, 1, 2].map((g) => (
            <line key={g} x1={0} x2={W} y1={mid - g * unit} y2={mid - g * unit} stroke="var(--rule)" strokeWidth={1} strokeDasharray={Math.abs(g) === 1 ? undefined : '2 4'} />
          ))}
          <line x1={0} x2={W} y1={mid} y2={mid} stroke="var(--faint)" strokeWidth={1} />
          <path d={data.envelope} fill="var(--ink)" fillOpacity={0.06} stroke="var(--faint)" strokeWidth={1} />
          <path ref={pathRef} fill="none" stroke={PART_COLOR[state.part]} strokeWidth={2} strokeLinejoin="round" />
          <line x1={v.bx} x2={v.bx} y1={0} y2={H - PAD_B + 4} stroke="var(--ink)" strokeWidth={1.5} />
          {/* ticks: Medium 1 in units of lambda_1 */}
          {ticks1.map((t) => {
            const x = zToPx(v, t * lam)
            return x < 2 ? null : (
              <g key={t}>
                <line x1={x} x2={x} y1={H - PAD_B} y2={H - PAD_B + (Number.isInteger(t) ? 5 : 3)} stroke="var(--mute)" />
                {Number.isInteger(t) && t !== 0 && <text x={x} y={H - 5} textAnchor="middle" className="num" fontSize={10.5} fill="var(--mute)">{`−${-t}λ₁`}</text>}
              </g>
            )
          })}
          <text x={v.bx} y={H - 5} textAnchor="middle" className="num" fontSize={10.5} fill="var(--mute)">z = 0</text>
          {ticks2.map((t) => {
            const x = zToPx(v, t.z)
            return (
              <g key={t.z}>
                <line x1={x} x2={x} y1={H - PAD_B} y2={H - PAD_B + (t.label ? 5 : 3)} stroke={v.magnified ? 'var(--warn)' : 'var(--mute)'} />
                {t.label && (
                  <text x={x} y={H - 5} textAnchor="middle" className="num" fontSize={10.5} fill={v.magnified ? 'var(--warn)' : 'var(--mute)'}>
                    {v.magnified ? t.label : `${t.label}λ₁`}
                  </text>
                )}
              </g>
            )
          })}
          <line x1={0} x2={W} y1={H - PAD_B} y2={H - PAD_B} stroke="var(--rule)" />
          {showSw && model.sw.zMax.concat(model.sw.zMin).map((z, i) => {
            const isMax = i < model.sw.zMax.length
            const x = zToPx(v, z)
            if (x < 6) return null
            const amp = isMax ? 1 + Math.sqrt(sol.R) : 1 - Math.sqrt(sol.R)
            return <circle key={i} cx={x} cy={mid - amp * unit} r={2.75} fill={isMax ? 'var(--ink)' : 'var(--panel)'} stroke="var(--ink)" strokeWidth={1.25} />
          })}
          {[2, 1, -1, -2].map((g) => (
            <g key={g}>
              {/* Medium 1 scale: next to the boundary when Medium 2 is amplified, else at the right edge. */}
              <text x={gain > 1 ? v.bx - 4 : W - 4} y={mid - g * unit - 3} textAnchor="end" className="num" fontSize={10} fill="var(--faint)">
                {g > 0 ? `+${g}` : `−${-g}`}
              </text>
              {/* Medium 2 scale when amplified: the true values, i.e. the tick value divided by the gain. */}
              {gain > 1 && (
                <text x={W - 4} y={mid - g * unit - 3} textAnchor="end" className="num" fontSize={10} fill="var(--warn)">
                  {g > 0 ? `+${sig(g / gain, 2)}` : `−${sig(-g / gain, 2)}`}
                </text>
              )}
            </g>
          ))}
        </svg>
      )}
      {v && gain > 1 && (
        <div className="pointer-events-none absolute right-2 top-1.5 text-[11.5px] font-medium text-warn" style={{ left: v.bx + 8, textAlign: 'right' }}>
          Medium 2 drawn ×{sig(gain, 3)} · right axis: true values
        </div>
      )}
      <div className="pointer-events-none absolute left-2 top-1.5 flex items-baseline gap-3 text-[11.5px] text-mute">
        <span><Tex>{`${fieldTex}(z,t)\\,/\\,${normTex}`}</Tex> at <Tex>{'x=0'}</Tex></span>
        <span className="hidden sm:inline">outline: envelope <Tex>{`|${fieldTex}(z)|`}</Tex></span>
        {showSw && (
          <span className="text-ink">
            <span className="mr-1 inline-block h-[7px] w-[7px] rounded-full bg-ink align-middle" />max
            <span className="ml-2 mr-1 inline-block h-[7px] w-[7px] rounded-full border border-ink align-middle" />min
            <span className="ml-3"><Tex>S</Tex> <span className="num">= {sig(model.sw.S, 4)}</span></span>
          </span>
        )}
      </div>
    </div>
  )
}
