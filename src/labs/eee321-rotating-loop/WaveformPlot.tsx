import { useEffect, useMemo, useRef } from 'react'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { si } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { brushVoltageAtAngle, loopEmfAtAngle, poleAt } from './engine'
import type { Model } from './derive'

const PAD = { l: 48, r: 18, t: 10, b: 24 }
const TURNS = 2
const N = 1441

/** Loop voltage and brush voltage against rotor angle over two revolutions, with a cursor at the current angle. */
export function WaveformPlot({ model, clock, height = 190 }: { model: Model; clock: Clock; height?: number }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const { op, state } = model
  const f = state.poleArc
  const W = size.w, H = height
  const iw = Math.max(1, W - PAD.l - PAD.r), ih = H - PAD.t - PAD.b
  // Fixed range from V_B: e_ind <= 2 V_B over the allowed speeds (omega <= 2 omega_nl).
  const yMax = 2.2 * op.VB
  const X = (th: number) => PAD.l + (th / (2 * Math.PI * TURNS)) * iw
  const Y = (e: number) => PAD.t + ((yMax - e) / (2 * yMax)) * ih

  const paths = useMemo(() => {
    if (W <= 0) return null
    let loop = '', out = ''
    for (let j = 0; j < N; j++) {
      const th = (j / (N - 1)) * 2 * Math.PI * TURNS
      const x = X(th).toFixed(1)
      loop += `${j ? 'L' : 'M'}${x} ${Y(loopEmfAtAngle(th, op, f)).toFixed(1)}`
      out += `${j ? 'L' : 'M'}${x} ${Y(brushVoltageAtAngle(th, op, f)).toFixed(1)}`
    }
    // gaps between the poles (conductors beyond the pole edges), from the engine's pole test
    const gaps: [number, number][] = []
    let start: number | null = null
    for (let j = 0; j < N; j++) {
      const th = (j / (N - 1)) * 2 * Math.PI * TURNS
      const inGap = poleAt(th, f) === null
      if (inGap && start === null) start = th
      if ((!inGap || j === N - 1) && start !== null) { gaps.push([start, th]); start = null }
    }
    return { loop, out, gaps }
  }, [W, op, f, yMax])

  const cursor = useRef<SVGLineElement>(null)
  const dotOut = useRef<SVGCircleElement>(null)
  const dotLoop = useRef<SVGCircleElement>(null)
  useEffect(() => {
    if (W <= 0) return
    const draw = (phase: number) => {
      const th = phase % (2 * Math.PI * TURNS)
      const x = X(th).toFixed(1)
      cursor.current?.setAttribute('x1', x); cursor.current?.setAttribute('x2', x)
      dotOut.current?.setAttribute('cx', x); dotOut.current?.setAttribute('cy', Y(brushVoltageAtAngle(th, op, f)).toFixed(1))
      dotLoop.current?.setAttribute('cx', x); dotLoop.current?.setAttribute('cy', Y(loopEmfAtAngle(th, op, f)).toFixed(1))
    }
    draw(clock.phase)
    return clock.subscribe(draw)
  }, [W, op, f, clock, yMax])

  const yTicks = [-2, -1, 0, 1, 2]
  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-mute" aria-hidden>
        <span className="flex items-center gap-1.5 text-ink">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={MC.voltage} strokeWidth="2" /></svg>
          <Tex>{'e_{out}'}</Tex> at the brushes
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke={MC.voltage} strokeWidth="1.5" strokeDasharray="4 3" /></svg>
          <Tex>{'e_{loop}'}</Tex> in the loop
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 bg-ink opacity-10" /> conductors between the poles
        </span>
      </div>
      <div ref={ref} className="relative" style={{ height: H }}>
        {W > 0 && paths && (
          <svg width={W} height={H} className="absolute inset-0" role="img"
            aria-label={`Voltage against rotor angle. Brush voltage ${op.eInd.toFixed(1)} V under the poles, zero in the gaps.`}>
            {paths.gaps.map(([a, b], j) => (
              <rect key={j} x={X(a)} y={PAD.t} width={Math.max(1, X(b) - X(a))} height={ih} fill="var(--ink)" fillOpacity={0.07} />
            ))}
            {yTicks.map((t) => (
              <g key={t}>
                <line x1={PAD.l} x2={W - PAD.r} y1={Y(t * op.VB)} y2={Y(t * op.VB)} stroke={t === 0 ? 'var(--faint)' : 'var(--rule)'} strokeDasharray={t === 0 ? undefined : '2 4'} />
                <text x={PAD.l - 6} y={Y(t * op.VB) + 3.5} textAnchor="end" className="num" fontSize={10.5} fill="var(--mute)">
                  {t === 0 ? '0' : si(t * op.VB, 'V', 3).replace('-', '−')}
                </text>
              </g>
            ))}
            {[0, 90, 180, 270, 360, 450, 540, 630, 720].map((d) => (
              <g key={d}>
                <line x1={X((d * Math.PI) / 180)} x2={X((d * Math.PI) / 180)} y1={H - PAD.b} y2={H - PAD.b + 4} stroke="var(--mute)" />
                <text x={X((d * Math.PI) / 180)} y={H - 7} textAnchor="middle" className="num" fontSize={10.5} fill="var(--mute)">{d}°</text>
              </g>
            ))}
            <path d={paths.loop} fill="none" stroke={MC.voltage} strokeWidth={1.5} strokeDasharray="4 3" strokeOpacity={0.9} />
            <path d={paths.out} fill="none" stroke={MC.voltage} strokeWidth={2} strokeLinejoin="round" />
            <line ref={cursor} y1={PAD.t} y2={H - PAD.b} stroke="var(--ink)" strokeWidth={1} />
            <circle ref={dotLoop} r={3.5} fill="var(--panel)" stroke={MC.voltage} strokeWidth={1.5} />
            <circle ref={dotOut} r={4} fill={MC.voltage} stroke="var(--panel)" strokeWidth={1.5} />
          </svg>
        )}
      </div>
      <div className="mt-0.5 text-right text-[11px] text-mute">rotor angle <Tex>\theta</Tex> of conductor ab, two revolutions</div>
    </div>
  )
}
