import { useMemo, useRef } from 'react'
import { DEG, Polarization, abs, solveInterface } from '../../physics'
import { useSize } from '../../ui/controls'
import { fixed } from '../../ui/format'
import { Tex } from '../../ui/Tex'
import type { Model } from './derive'

const PAD = { l: 34, r: 14, t: 14, b: 26 }
const N = 361

/** |Gamma_perp| and |Gamma_par| against the angle of incidence. Drag to set the angle. */
export function GammaPlot({ model, onTheta, height = 190 }: { model: Model; onTheta: (deg: number) => void; height?: number }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const { state, sol } = model
  const W = size.w, H = height
  const iw = Math.max(1, W - PAD.l - PAD.r), ih = H - PAD.t - PAD.b
  const X = (d: number) => PAD.l + (d / 90) * iw
  const Y = (g: number) => PAD.t + (1 - g) * ih

  const curves = useMemo(() => {
    const out: Record<Polarization, number[]> = { perp: [], par: [] }
    for (const pol of ['perp', 'par'] as const)
      for (let i = 0; i < N; i++) {
        const d = Math.min(89.999, (i * 90) / (N - 1))
        out[pol].push(Math.min(1, abs(solveInterface(state.m1, state.m2, state.f, d * DEG, pol).Gamma)))
      }
    return out
  }, [state.m1, state.m2, state.f])

  const path = (pol: Polarization) => curves[pol].map((g, i) => `${i ? 'L' : 'M'}${X((i * 90) / (N - 1)).toFixed(1)} ${Y(g).toFixed(1)}`).join('')
  const other: Polarization = state.pol === 'perp' ? 'par' : 'perp'
  const cur = Math.min(1, abs(sol.Gamma))

  const set = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const d = ((e.clientX - rect.left - PAD.l) / iw) * 90
    onTheta(Math.min(89.9, Math.max(0, Math.round(d * 10) / 10)))
  }
  const marks: { d: number; tex: string }[] = []
  if (model.thetaC !== null) marks.push({ d: model.thetaC / DEG, tex: '\\theta_c' })
  if (model.thetaB.par !== null) marks.push({ d: model.thetaB.par / DEG, tex: '\\theta_{B\\parallel}' })
  if (model.thetaB.perp !== null) marks.push({ d: model.thetaB.perp / DEG, tex: '\\theta_{B\\perp}' })
  return (
    <div>
    <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-mute" aria-hidden>
      <span className="flex items-center gap-1.5 text-ink">
        <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="var(--ink)" strokeWidth="2" /></svg>
        <Tex>{state.pol === 'perp' ? '|\\Gamma_\\perp|' : '|\\Gamma_\\parallel|'}</Tex> (current)
      </span>
      <span className="flex items-center gap-1.5">
        <svg width="20" height="6"><line x1="0" y1="3" x2="20" y2="3" stroke="var(--faint)" strokeWidth="1.5" strokeDasharray="5 4" /></svg>
        <Tex>{other === 'perp' ? '|\\Gamma_\\perp|' : '|\\Gamma_\\parallel|'}</Tex>
      </span>
    </div>
    <div ref={ref} className="relative" style={{ height: H }}>
      {W > 0 && (
        <svg
          ref={svgRef} width={W} height={H} className="absolute inset-0 cursor-ew-resize" style={{ touchAction: 'none' }}
          role="slider" tabIndex={0} aria-label="Reflection magnitude against angle of incidence. Drag or use arrow keys to set the angle."
          aria-valuemin={0} aria-valuemax={89.9} aria-valuenow={state.thetaDeg}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e) }}
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e) }}
          onKeyDown={(e) => {
            const d = e.shiftKey ? 0.1 : 1
            if (e.key === 'ArrowLeft') { e.preventDefault(); onTheta(Math.max(0, Math.round((state.thetaDeg - d) * 10) / 10)) }
            if (e.key === 'ArrowRight') { e.preventDefault(); onTheta(Math.min(89.9, Math.round((state.thetaDeg + d) * 10) / 10)) }
          }}
        >
          {[0, 0.5, 1].map((g) => (
            <g key={g}>
              <line x1={PAD.l} x2={W - PAD.r} y1={Y(g)} y2={Y(g)} stroke="var(--rule)" strokeDasharray={g === 0 ? undefined : '2 4'} />
              <text x={PAD.l - 6} y={Y(g) + 3.5} textAnchor="end" className="num" fontSize={10.5} fill="var(--mute)">{g.toFixed(1)}</text>
            </g>
          ))}
          {[0, 30, 60, 90].map((d) => (
            <g key={d}>
              <line x1={X(d)} x2={X(d)} y1={Y(0)} y2={Y(0) + 4} stroke="var(--mute)" />
              <text x={X(d)} y={H - 7} textAnchor="middle" className="num" fontSize={10.5} fill="var(--mute)">{d}°</text>
            </g>
          ))}
          {marks.map((m) => (
            <line key={m.tex} x1={X(m.d)} x2={X(m.d)} y1={PAD.t - 2} y2={Y(0)} stroke="var(--mute)" strokeWidth={1} strokeDasharray="3 3" />
          ))}
          <path d={path(other)} fill="none" stroke="var(--faint)" strokeWidth={1.5} strokeDasharray="5 4" />
          <path d={path(state.pol)} fill="none" stroke="var(--ink)" strokeWidth={2} strokeLinejoin="round" />
          <line x1={X(state.thetaDeg)} x2={X(state.thetaDeg)} y1={PAD.t - 2} y2={Y(0)} stroke="var(--inc)" strokeWidth={1.5} />
          <circle cx={X(state.thetaDeg)} cy={Y(cur)} r={5} fill="var(--ref)" stroke="var(--panel)" strokeWidth={2} />
        </svg>
      )}
      {W > 0 && (
        <div className="pointer-events-none absolute inset-0 text-[11px]">
          {marks.map((m) => (
            <span key={m.tex} className="absolute -translate-x-1/2 bg-panel px-0.5 text-mute" style={{ left: X(m.d), top: -4 }}>
              <Tex>{m.tex}</Tex>
            </span>
          ))}
          <span
            className="num absolute -translate-y-1/2 whitespace-nowrap bg-panel px-1 text-ink"
            style={{
              top: Y(cur) + (cur > 0.8 ? 13 : -12),
              ...(state.thetaDeg < 62 ? { left: X(state.thetaDeg) + 9 } : { left: X(state.thetaDeg) - 9, transform: 'translate(-100%, -50%)' }),
            }}
          >
            {fixed(cur, 4)}
          </span>
        </div>
      )}
    </div>
    </div>
  )
}
