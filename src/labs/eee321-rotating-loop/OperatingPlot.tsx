import { useRef } from 'react'
import { useSize } from '../../ui/controls'
import { si } from '../../ui/format'
import { MACHINE_COLOR as MC } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { operatingLineOmega } from './engine'
import type { Model } from './derive'

const PAD = { l: 62, r: 14, t: 14, b: 26 }

/**
 * Operating line omega(tau_load) = omega_nl - R tau_load / ((2/pi) phi)^2 from (7-6), (7-16) and KVL,
 * over tau_load in [-tau_stall, tau_stall]. Fixed axes: they depend only on V_B, R and (2/pi) phi.
 * Dragging sets tau_load (torque given) or omega (speed given).
 */
export function OperatingPlot({ model, onTau, onOmega, height = 190 }: {
  model: Model; onTau: (v: number) => void; onOmega: (v: number) => void; height?: number
}) {
  const [ref, size] = useSize<HTMLDivElement>()
  const svgRef = useRef<SVGSVGElement>(null)
  const { c, op } = model
  const W = size.w, H = height
  const iw = Math.max(1, W - PAD.l - PAD.r), ih = H - PAD.t - PAD.b
  const ts = c.tauStall
  const wTop = 2 * c.omegaNl * 1.05
  const X = (t: number) => PAD.l + ((t + ts) / (2 * ts)) * iw
  const Y = (w: number) => PAD.t + (1 - w / wTop) * ih
  const torqueGiven = op.given === 'torque'

  const set = (e: React.PointerEvent) => {
    const r = svgRef.current!.getBoundingClientRect()
    if (torqueGiven) {
      const t = -ts + ((e.clientX - r.left - PAD.l) / iw) * 2 * ts
      onTau(Math.min(model.tauMax, Math.max(model.tauMin, Math.round(t / model.tauStep) * model.tauStep)))
    } else {
      const w = (1 - (e.clientY - r.top - PAD.t) / ih) * wTop
      const step = model.omegaMax / 1000
      onOmega(Math.min(model.omegaMax, Math.max(0, Math.round(w / step) * step)))
    }
  }
  const key = (e: React.KeyboardEvent) => {
    const big = e.shiftKey ? 10 : 1
    if (torqueGiven && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      e.preventDefault()
      const d = (e.key === 'ArrowRight' ? 1 : -1) * model.tauStep * 5 * big
      onTau(Math.min(model.tauMax, Math.max(model.tauMin, op.tauLoad + d)))
    }
    if (!torqueGiven && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      const d = (e.key === 'ArrowUp' ? 1 : -1) * (model.omegaMax / 200) * big
      onOmega(Math.min(model.omegaMax, Math.max(0, op.omega + d)))
    }
  }
  const px = X(op.tauInd), py = Y(op.omega)
  return (
    <div ref={ref} className="relative" style={{ height: H }}>
      {W > 0 && (
        <svg
          ref={svgRef} width={W} height={H} className={`absolute inset-0 ${torqueGiven ? 'cursor-ew-resize' : 'cursor-ns-resize'}`}
          style={{ touchAction: 'none' }} role="slider" tabIndex={0}
          aria-label={torqueGiven ? 'Operating line. Drag or use left and right arrow keys to set the load torque.' : 'Operating line. Drag or use up and down arrow keys to set the shaft speed.'}
          aria-valuenow={torqueGiven ? op.tauLoad : op.omega}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); set(e) }}
          onPointerMove={(e) => { if (e.currentTarget.hasPointerCapture(e.pointerId)) set(e) }}
          onKeyDown={key}
        >
          {/* generator half (tau_load < 0) lightly shaded */}
          <rect x={PAD.l} y={PAD.t} width={X(0) - PAD.l} height={ih} fill="var(--ink)" fillOpacity={0.04} />
          {[0, c.omegaNl, 2 * c.omegaNl].map((w) => (
            <g key={w}>
              <line x1={PAD.l} x2={W - PAD.r} y1={Y(w)} y2={Y(w)} stroke="var(--rule)" strokeDasharray={w === 0 ? undefined : '2 4'} />
              <text x={PAD.l - 6} y={Y(w) + 3.5} textAnchor="end" className="num" fontSize={10.5} fill="var(--mute)">{w === 0 ? '0' : si(w, '', 3).trim()}</text>
            </g>
          ))}
          {[-ts, 0, ts].map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={PAD.t} y2={Y(0) + 4} stroke={t === 0 ? 'var(--mute)' : 'var(--rule)'} strokeDasharray={t === 0 ? '3 3' : undefined} />
              <text x={X(t)} y={H - 7} textAnchor={t < 0 ? 'start' : t > 0 ? 'end' : 'middle'} className="num" fontSize={10.5} fill="var(--mute)">
                {t === 0 ? '0' : si(t, 'N·m', 3).replace('-', '−')}
              </text>
            </g>
          ))}
          <line x1={X(-ts)} y1={Y(operatingLineOmega(c, -ts))} x2={X(ts)} y2={Y(operatingLineOmega(c, ts))} stroke="var(--ink)" strokeWidth={2} />
          <line x1={px} x2={px} y1={py} y2={Y(0)} stroke={MC.mechanical} strokeWidth={1} strokeDasharray="2 3" />
          <line x1={PAD.l} x2={px} y1={py} y2={py} stroke={MC.mechanical} strokeWidth={1} strokeDasharray="2 3" />
          <circle cx={px} cy={py} r={6} fill={MC.mechanical} stroke="var(--panel)" strokeWidth={2} />
        </svg>
      )}
      {W > 0 && (
        <div className="pointer-events-none absolute inset-0 text-[11px]">
          <span className="absolute whitespace-nowrap" style={{ left: PAD.l + 6, top: PAD.t + ih - 18 }}>
            <span className="tag">Generator</span> <span className="text-mute"><Tex>{'\\tau_{load}<0'}</Tex></span>
          </span>
          <span className="absolute -translate-x-full whitespace-nowrap" style={{ left: W - PAD.r - 6, top: PAD.t + 4 }}>
            <span className="tag">Motor</span> <span className="text-mute"><Tex>{'\\tau_{load}>0'}</Tex></span>
          </span>
          <span className="absolute -translate-y-1/2 text-mute" style={{ left: 4, top: PAD.t + ih / 2, writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}>
            <Tex>\omega</Tex> (rad/s)
          </span>
          <span className="num absolute whitespace-nowrap bg-panel px-1 text-ink" style={{ left: Math.min(px + 9, W - 140), top: py - 22 }}>
            {si(op.tauInd, 'N·m', 3)}, {si(op.omega, 'rad/s', 4)}
          </span>
        </div>
      )}
    </div>
  )
}
