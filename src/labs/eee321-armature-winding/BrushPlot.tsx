import { useEffect, useMemo, useRef } from 'react'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { si } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { Winding, analyze } from './engine'
import { rotorAngle } from './rotor'

const PAD = { l: 52, r: 12, t: 10, b: 24 }
const PITCHES = 3
const N = 361

/** Coil-level brush voltage against rotor angle over three segment pitches, with the book's E_A = Kφω. */
export function BrushPlot({ w, beta, econd, EA, clock, height = 170 }: {
  w: Winding; beta: number; econd: number; EA: number; clock: Clock; height?: number
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const W = size.w, H = height
  const span = PITCHES * w.delta
  const samples = useMemo(() => Array.from({ length: N }, (_, j) => analyze(w, (j / (N - 1)) * span, beta, econd).brushVoltage), [w, beta, econd, span])
  const vMax = Math.max(EA, ...samples) * 1.12 || 1
  const iw = Math.max(1, W - PAD.l - PAD.r), ih = H - PAD.t - PAD.b
  const X = (a: number) => PAD.l + (a / span) * iw
  const Yv = (v: number) => PAD.t + (1 - v / vMax) * ih
  const avg = samples.reduce((s, v) => s + v, 0) / samples.length
  const cursor = useRef<SVGLineElement>(null)
  useEffect(() => {
    if (W <= 0) return
    const place = (phase: number) => {
      const x = X(rotorAngle(phase) % span).toFixed(1)
      cursor.current?.setAttribute('x1', x); cursor.current?.setAttribute('x2', x)
    }
    place(clock.phase)
    return clock.subscribe(place)
  }, [W, clock, span])
  const d = samples.map((v, j) => `${j ? 'L' : 'M'}${X((j / (N - 1)) * span).toFixed(1)} ${Yv(v).toFixed(1)}`).join('')
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-mute" aria-hidden>
        <span className="flex items-center gap-1.5"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={MC.voltage} strokeWidth="2" /></svg>brush voltage (coil level)</span>
        <span className="flex items-center gap-1.5"><svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="var(--ink)" strokeWidth="1.5" /></svg><Tex>{'E_A = K\\phi\\omega'}</Tex> (book)</span>
        <span className="num">average {si(avg, 'V', 4)}</span>
      </div>
      <div ref={ref} className="relative" style={{ height: H }}>
        {W > 0 && (
          <svg width={W} height={H} className="absolute inset-0" role="img" aria-label={`Brush voltage over three segment pitches; average ${avg.toFixed(2)} V; book E_A ${EA.toFixed(2)} V.`}>
            {[0, 0.5, 1].map((g) => (
              <g key={g}>
                <line x1={PAD.l} x2={W - PAD.r} y1={Yv(g * vMax / 1.12)} y2={Yv(g * vMax / 1.12)} stroke={g === 0 ? 'var(--faint)' : 'var(--rule)'} strokeDasharray={g === 0 ? undefined : '2 4'} />
                <text x={PAD.l - 6} y={Yv(g * vMax / 1.12) + 3.5} textAnchor="end" className="num" fontSize={10.5} fill="var(--mute)">{si(g * vMax / 1.12, 'V', 3)}</text>
              </g>
            ))}
            {Array.from({ length: PITCHES + 1 }, (_, i) => (
              <g key={i}>
                <line x1={X(i * w.delta)} x2={X(i * w.delta)} y1={H - PAD.b} y2={H - PAD.b + 4} stroke="var(--mute)" />
                <text x={X(i * w.delta)} y={H - 7} textAnchor={i === 0 ? 'start' : i === PITCHES ? 'end' : 'middle'} className="num" fontSize={10.5} fill="var(--mute)">
                  {((i * 360) / w.spec.C).toFixed(1)}°
                </text>
              </g>
            ))}
            <line x1={PAD.l} x2={W - PAD.r} y1={Yv(EA)} y2={Yv(EA)} stroke="var(--ink)" strokeWidth={1.5} />
            <path d={d} fill="none" stroke={MC.voltage} strokeWidth={2} strokeLinejoin="round" />
            <line ref={cursor} y1={PAD.t} y2={H - PAD.b} stroke="var(--mute)" strokeWidth={1} />
          </svg>
        )}
      </div>
      <div className="mt-0.5 text-right text-[11px] text-mute">rotor angle <Tex>{'\\theta_m'}</Tex>, three segment pitches (one pitch = 360°/C)</div>
    </div>
  )
}
