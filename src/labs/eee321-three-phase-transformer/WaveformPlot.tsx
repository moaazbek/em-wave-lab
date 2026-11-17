import { useEffect, useMemo, useRef } from 'react'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { si } from '../../ui/format'
import { PHASE_COLOR } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { argDeg, instantaneousAtPhase } from './engine'
import type { Model } from './derive'

const PAD = { l: 54, r: 14, t: 16, b: 24 }
const N = 361

interface Curve { key: string; color: string; width: number; dash?: string; values: number[]; label: React.ReactNode; opacity?: number }

/** One period against time. Normal view: v_AB and the scaled v_ab. Third-harmonic view: phase voltages and their harmonic. */
export function WaveformPlot({ model, clock, height = 210 }: { model: Model; clock: Clock; height?: number }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const { sol, state } = model
  const W = size.w, H = height
  const iw = Math.max(1, W - PAD.l - PAD.r), ih = H - PAD.t - PAD.b
  const T = 1 / state.f
  const yMax = 1.12 * Math.SQRT2 * sol.pri.VLLmag
  const X = (wt: number) => PAD.l + (wt / (2 * Math.PI)) * iw
  const Y = (v: number) => PAD.t + ((yMax - v) / (2 * yMax)) * ih

  const curves = useMemo<Curve[]>(() => {
    const samples = Array.from({ length: N }, (_, j) => instantaneousAtPhase(sol, (j / (N - 1)) * 2 * Math.PI, state.harmonic ? state.h : 0))
    if (!state.harmonic) {
      return [
        { key: 'AB', color: 'var(--ink)', width: 2, values: samples.map((s) => s.pri.Vll[0]), label: <Tex>{'v_{AB}(t)'}</Tex> },
        { key: 'ab', color: 'var(--ink)', width: 2, dash: '6 4', values: samples.map((s) => s.sec.Vll[0] * sol.ratio), label: <><Tex>{'v_{ab}(t)\\cdot V_{LL}/V_{ll}'}</Tex> (scaled)</> },
      ]
    }
    const names = ['A', 'B', 'C']
    return [
      ...[0, 1, 2].map((k) => ({ key: `p${k}`, color: PHASE_COLOR[k], width: 1.5, values: samples.map((s) => s.harmonic.phase[k]), label: <Tex>{`v_{${names[k]}N}`}</Tex> })),
      { key: 'third', color: 'var(--mute)', width: 1.5, dash: '2 3', values: samples.map((s) => s.harmonic.third[0]), label: <>third-harmonic part (same in all three)</> },
      { key: 'AB', color: 'var(--ink)', width: 2.25, values: samples.map((s) => s.harmonic.lineLine[0]), label: <><Tex>{'v_{AB}'}</Tex>: no third harmonic</> },
      { key: 'loop', color: 'var(--warn)', width: 1.75, dash: '7 3 2 3', values: samples.map((s) => s.harmonic.deltaThirdSum), label: <>sum around a delta = 3 × third harmonic</> },
    ]
  }, [sol, state.harmonic, state.h])

  const paths = useMemo(() => (W > 0 ? curves.map((c) => c.values.map((v, j) => `${j ? 'L' : 'M'}${X((j / (N - 1)) * 2 * Math.PI).toFixed(1)} ${Y(v).toFixed(1)}`).join('')) : []),
    [curves, W])

  const cursor = useRef<SVGLineElement>(null)
  useEffect(() => {
    if (W <= 0) return
    const draw = (phase: number) => {
      const x = X(phase % (2 * Math.PI)).toFixed(1)
      cursor.current?.setAttribute('x1', x); cursor.current?.setAttribute('x2', x)
    }
    draw(clock.phase)
    return clock.subscribe(draw)
  }, [W, clock])

  // shift bracket: from the positive peak of v_AB to the next peak of the scaled v_ab, |shift| / 360 of a period
  const shift = sol.shiftDeg
  const peakAB = (((-argDeg(sol.pri.Vll[0]) % 360) + 360) % 360) * (Math.PI / 180)
  const peakab = peakAB - (shift * Math.PI) / 180
  const dt = (Math.abs(shift) / 360) * T
  const msTicks = [0, 0.25, 0.5, 0.75, 1]
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-mute" aria-hidden>
        {curves.map((c) => (
          <span key={c.key} className="flex items-center gap-1.5">
            <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={c.color} strokeWidth={c.width} strokeDasharray={c.dash} /></svg>
            {c.label}
          </span>
        ))}
      </div>
      <div ref={ref} className="relative" style={{ height: H }}>
        {W > 0 && (
          <svg width={W} height={H} className="absolute inset-0" role="img"
            aria-label={state.harmonic ? 'Phase voltages with a third harmonic; the line-to-line voltage has none.' : `One period of v_AB and the scaled v_ab; ${Math.abs(shift).toFixed(0)} degree shift.`}>
            {[-1, -0.5, 0, 0.5, 1].map((g) => {
              const v = g * Math.SQRT2 * sol.pri.VLLmag
              return (
                <g key={g}>
                  <line x1={PAD.l} x2={W - PAD.r} y1={Y(v)} y2={Y(v)} stroke={g === 0 ? 'var(--faint)' : 'var(--rule)'} strokeDasharray={g === 0 ? undefined : '2 4'} />
                  {g !== 0.5 && g !== -0.5 && (
                    <text x={PAD.l - 6} y={Y(v) + 3.5} textAnchor="end" className="num" fontSize={10.5} fill="var(--mute)">{g === 0 ? '0' : si(v, 'V', 3).replace('-', '−')}</text>
                  )}
                </g>
              )
            })}
            {msTicks.map((m) => (
              <g key={m}>
                <line x1={X(m * 2 * Math.PI)} x2={X(m * 2 * Math.PI)} y1={H - PAD.b} y2={H - PAD.b + 4} stroke="var(--mute)" />
                <text x={X(m * 2 * Math.PI)} y={H - 7} textAnchor={m === 0 ? 'start' : m === 1 ? 'end' : 'middle'} className="num" fontSize={10.5} fill="var(--mute)">
                  {si(m * T, 's', 3)}
                </text>
              </g>
            ))}
            {curves.map((c, j) => (
              <path key={c.key} d={paths[j]} fill="none" stroke={c.color} strokeWidth={c.width} strokeDasharray={c.dash} strokeOpacity={c.opacity ?? 1} strokeLinejoin="round" />
            ))}
            {!state.harmonic && Math.abs(shift) > 1e-6 && (() => {
              const xa = X(peakAB), xb = X(peakab < 0 ? peakab + 2 * Math.PI : peakab > 2 * Math.PI ? peakab - 2 * Math.PI : peakab)
              const y = Y(Math.SQRT2 * sol.pri.VLLmag) - 7
              return Math.abs(xb - xa) < iw / 2 ? (
                <g stroke="var(--ink)" strokeWidth={1.25}>
                  <line x1={xa} x2={xb} y1={y} y2={y} />
                  <line x1={xa} x2={xa} y1={y - 4} y2={y + 4} />
                  <line x1={xb} x2={xb} y1={y - 4} y2={y + 4} />
                </g>
              ) : null
            })()}
            <line ref={cursor} y1={PAD.t} y2={H - PAD.b} stroke="var(--mute)" strokeWidth={1} />
          </svg>
        )}
        {W > 0 && !state.harmonic && (
          <div className="pointer-events-none absolute whitespace-nowrap rounded-[3px] px-1 text-[11.5px]"
            style={{ left: Math.min(Math.max(X(Math.min(peakAB, peakab < 0 ? peakab + 2 * Math.PI : peakab)), PAD.l), W - 230), top: 0, background: 'color-mix(in srgb, var(--panel) 85%, transparent)' }}>
            {Math.abs(shift) > 1e-6
              ? <><span className="num">{Math.abs(shift).toFixed(0)}° = T/12 = {si(dt, 's', 4)}</span> ({shift < 0 ? <Tex>{'v_{ab}'}</Tex> : <Tex>{'v_{AB}'}</Tex>} later)</>
              : <>no shift: the two curves coincide</>}
          </div>
        )}
      </div>
      <div className="mt-0.5 text-right text-[11px] text-mute">one period at {state.f} Hz; the cursor follows the slowed <Tex>{'\\omega t'}</Tex></div>
    </div>
  )
}
