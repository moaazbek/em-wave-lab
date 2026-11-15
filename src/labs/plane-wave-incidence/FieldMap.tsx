import { useEffect, useMemo, useRef } from 'react'
import { DEG, sampleZProfile, xFactor } from '../../physics'
import { useSize } from '../../ui/controls'
import { deg, niceBelow, si, sig, siShort } from '../../ui/format'
import { PALETTES, ThemeName, fieldLut } from '../../ui/palette'
import { Prose, Tex } from '../../ui/Tex'
import type { Clock } from './clock'
import { CLASS_LABEL, Model, medium2Gain, shownAxis } from './derive'
import { Viewport, makeViewport, pxToX, pxToZ } from './viewport'

interface Props {
  model: Model
  theme: ThemeName
  clock: Clock
  onTheta: (deg: number) => void
  className?: string
}

/** Longest edge of the low-resolution field buffer; it is upscaled with smoothing. */
const MAX_COLS = 640

export function FieldMap({ model, theme, clock, onTheta, className = '' }: Props) {
  const [wrapRef, size] = useSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { sol, state } = model
  const axis = shownAxis(state)
  const gain = medium2Gain(sol, state.part, state.quantity, axis)
  const view = useMemo(() => (size.w > 0 && size.h > 0 ? makeViewport(size.w, size.h, sol) : null), [size.w, size.h, sol])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !view) return
    const { W, H } = view
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(W * dpr)
    canvas.height = Math.round(H * dpr)
    const ctx = canvas.getContext('2d')!
    const cols = Math.max(2, Math.min(Math.round(W), MAX_COLS))
    const rows = Math.max(2, Math.round((cols * H) / W))
    const off = document.createElement('canvas')
    off.width = cols
    off.height = rows
    const octx = off.getContext('2d')!
    const img = octx.createImageData(cols, rows)
    const px = new Uint32Array(img.data.buffer)

    // The field is e^{-j kx x} g(z): sample the two factors once, combine them every frame.
    const zs = new Float64Array(cols)
    for (let i = 0; i < cols; i++) zs[i] = pxToZ(view, ((i + 0.5) * W) / cols)
    const gRe = new Float32Array(cols), gIm = new Float32Array(cols)
    sampleZProfile(sol, state.part, state.quantity, axis, zs, gRe, gIm)
    for (let i = 0; i < cols; i++) if (zs[i] >= 0) { gRe[i] *= gain; gIm[i] *= gain }
    const xRe = new Float32Array(rows), xIm = new Float32Array(rows)
    for (let r = 0; r < rows; r++) {
      const f = xFactor(sol, pxToX(view, ((r + 0.5) * H) / rows))
      xRe[r] = f.re
      xIm[r] = f.im
    }
    const lut = fieldLut(PALETTES[theme])
    // Colour range: -2 ... +2 times the incident amplitude of the shown field.
    const k = 127.5 / (2 * (state.quantity === 'E' ? sol.e0 : sol.e0 / sol.p1.eta.re))
    const cRe = new Float32Array(cols), cIm = new Float32Array(cols)

    const draw = (phase: number) => {
      const cs = Math.cos(phase), sn = Math.sin(phase)
      for (let i = 0; i < cols; i++) {
        cRe[i] = (gRe[i] * cs - gIm[i] * sn) * k
        cIm[i] = (gRe[i] * sn + gIm[i] * cs) * k
      }
      let p = 0
      for (let r = 0; r < rows; r++) {
        const a = xRe[r], b = xIm[r]
        for (let i = 0; i < cols; i++) {
          let t = a * cRe[i] - b * cIm[i] + 127.5
          if (t < 0) t = 0
          else if (t > 255) t = 255
          px[p++] = lut[t | 0]
        }
      }
      octx.putImageData(img, 0, 0)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(off, 0, 0, canvas.width, canvas.height)
    }
    draw(clock.phase)
    return clock.subscribe(draw)
  }, [view, sol, state.part, state.quantity, axis, theme, clock, gain])

  return (
    <div ref={wrapRef} className={`relative touch-pan-y select-none overflow-hidden border border-rule bg-sunk ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-label="Animated map of the instantaneous field" role="img" />
      {view && <Overlay model={model} v={view} onTheta={onTheta} gain={gain} />}
    </div>
  )
}

/* ------------------------------------------------------------------ */

const INK = 'var(--map-ink)'
const HALO = 'var(--map-halo)'

function Ray({ x1, y1, x2, y2, color, opacity, dashed, head }: {
  x1: number; y1: number; x2: number; y2: number; color: string; opacity: number; dashed?: boolean; head: number
}) {
  if (opacity < 0.004) return null
  const a = Math.atan2(y2 - y1, x2 - x1)
  const hx = x1 + (x2 - x1) * head, hy = y1 + (y2 - y1) * head
  const L = 11, w = 4.5
  const pts = [
    [hx + L * 0.5 * Math.cos(a), hy + L * 0.5 * Math.sin(a)],
    [hx - L * 0.5 * Math.cos(a) - w * Math.sin(a), hy - L * 0.5 * Math.sin(a) + w * Math.cos(a)],
    [hx - L * 0.5 * Math.cos(a) + w * Math.sin(a), hy - L * 0.5 * Math.sin(a) - w * Math.cos(a)],
  ].map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ')
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={HALO} strokeWidth={5} strokeOpacity={0.55} strokeLinecap="round" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2} strokeLinecap="round" strokeDasharray={dashed ? '6 5' : undefined} />
      <polygon points={pts} fill={color} stroke={HALO} strokeWidth={1} strokeOpacity={0.6} paintOrder="stroke" />
    </g>
  )
}

/** Arc of radius r around (cx, cy) between two screen angles. */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const p0 = [cx + r * Math.cos(a0), cy + r * Math.sin(a0)]
  const p1 = [cx + r * Math.cos(a1), cy + r * Math.sin(a1)]
  return `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`
}

/** Note inside Medium 2 that wraps to the panel width. */
function Note({ left, bottom, children }: { left: number; bottom: number; children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute right-2.5 flex" style={{ left, bottom }}>
      <div className="rounded-[3px] px-1.5 py-0.5 text-[11.5px] leading-snug" style={{ color: INK, background: 'color-mix(in srgb, var(--map-halo) 78%, transparent)' }}>
        {children}
      </div>
    </div>
  )
}

function Label({ x, y, children, align = 'center' }: { x: number; y: number; children: React.ReactNode; align?: 'center' | 'left' | 'right' }) {
  const tx = align === 'center' ? '-50%' : align === 'right' ? '-100%' : '0'
  return (
    <div
      className="pointer-events-none absolute whitespace-nowrap rounded-[3px] px-1 py-px text-[12px] leading-tight"
      style={{ left: x, top: y, transform: `translate(${tx}, -50%)`, color: INK, background: 'color-mix(in srgb, var(--map-halo) 72%, transparent)' }}
    >
      {children}
    </div>
  )
}

function Overlay({ model, v, onTheta, gain }: { model: Model; v: Viewport; onTheta: (deg: number) => void; gain: number }) {
  const { sol, state } = model
  const svgRef = useRef<SVGSVGElement>(null)
  const { W, H, bx, cy } = v
  const th = sol.thetaI
  const s = Math.sin(th), c = Math.cos(th)
  const inset = 12
  // Keep the rays clear of the medium labels (top) and of the axes and scale bar (bottom).
  const vInset = 44
  const t1 = Math.min((bx - inset) / Math.max(c, 1e-6), (H / 2 - vInset) / Math.max(s, 1e-6))
  // At normal incidence the incident and reflected rays coincide; draw them a few pixels apart.
  const sep = th < 0.5 * DEG ? 5 : 0
  const incStart = [bx - t1 * c, cy + t1 * s + sep]
  const refEnd = [bx - t1 * c, cy - t1 * s - sep]

  // Transmitted ray: only where a single real direction exists and the panel is drawn to scale.
  let trans: { x: number; y: number; angle: number; dashed: boolean } | null = null
  const lossyOblique = sol.regime === 'lossy' && !model.normal
  if (sol.regime !== 'pec' && sol.regime !== 'total-reflection') {
    let a: number | null = null
    if (model.normal) a = 0
    else if (!v.magnified) a = sol.regime === 'refraction' ? sol.thetaT : Math.atan2(sol.kx, sol.k2z.re)
    if (a !== null) {
      const t2 = Math.min((W - bx - inset) / Math.max(Math.cos(a), 1e-6), (H / 2 - vInset) / Math.max(Math.sin(a), 1e-6))
      trans = { x: bx + t2 * Math.cos(a), y: cy - t2 * Math.sin(a), angle: a, dashed: lossyOblique }
    }
  }

  const r = Math.max(30, Math.min(52, bx * 0.2))
  const lab = (base: number, dir: number, half: number, rr = r + 26) => {
    const a = base + dir * Math.max(half, 0.19)
    return [bx + rr * Math.cos(a), cy + rr * Math.sin(a)]
  }
  const li = lab(Math.PI, -1, th / 2)
  const lr = lab(-Math.PI, 1, th / 2)
  const lt = trans ? lab(0, -1, trans.angle / 2) : null
  const showRays = state.rays
  const incOn = state.part === 'total' || state.part === 'inc'
  const refOn = state.part === 'total' || state.part === 'ref'
  const trnOn = state.part === 'total' || state.part === 'trans'

  const setFromPointer = (e: React.PointerEvent) => {
    const rect = svgRef.current!.getBoundingClientRect()
    const px = e.clientX - rect.left, py = e.clientY - rect.top
    let a = px >= bx ? (py > cy ? 89.9 : 0) : Math.atan2(py - cy, bx - px) / DEG
    a = Math.min(89.9, Math.max(0, Math.round(a * 10) / 10))
    onTheta(a)
  }
  const drag = {
    onPointerDown: (e: React.PointerEvent) => { (e.currentTarget as Element).setPointerCapture(e.pointerId); setFromPointer(e) },
    onPointerMove: (e: React.PointerEvent) => { if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) setFromPointer(e) },
  }
  const hx = bx - (t1 - 10) * c, hy = cy + (t1 - 10) * s + sep

  // Scale bars
  const bar1 = niceBelow(Math.min(110, bx * 0.4) / v.ppm)
  const bar2 = niceBelow(Math.min(90, (W - bx) * 0.4) / v.ppm2z)
  const jsMag = Math.hypot(model.js.x.re, model.js.x.im) + Math.hypot(model.js.y.re, model.js.y.im)
  const alpha2z = -sol.k2z.im

  return (
    <>
      <svg ref={svgRef} width={W} height={H} className="absolute inset-0" role="group" aria-label="Rays and angles">
        <defs>
          <pattern id="pec-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="0" y2="9" stroke={INK} strokeWidth="1.1" strokeOpacity="0.4" />
          </pattern>
        </defs>
        {sol.regime === 'pec' && <rect x={bx} y={0} width={W - bx} height={H} fill="url(#pec-hatch)" />}
        {v.magnified && (
          <rect x={bx + 4.5} y={4.5} width={W - bx - 9} height={H - 9} fill="none" stroke="var(--warn)" strokeWidth={1} strokeDasharray="2 4" />
        )}
        {/* normal and boundary */}
        <line x1={0} y1={cy} x2={W} y2={cy} stroke={INK} strokeOpacity={0.45} strokeWidth={1} strokeDasharray="5 5" />
        <line x1={bx} y1={0} x2={bx} y2={H} stroke={HALO} strokeOpacity={0.5} strokeWidth={4} />
        <line x1={bx} y1={0} x2={bx} y2={H} stroke={INK} strokeWidth={1.5} />

        {showRays && (
          <>
            {incOn && <Ray x1={incStart[0]} y1={incStart[1]} x2={bx} y2={cy + sep} color="var(--inc)" opacity={1} head={0.5} />}
            {refOn && <Ray x1={bx} y1={cy - sep} x2={refEnd[0]} y2={refEnd[1]} color="var(--ref)" opacity={Math.sqrt(sol.R)} head={0.55} />}
            {trnOn && trans && (
              <Ray x1={bx} y1={cy} x2={trans.x} y2={trans.y} color="var(--trn)" opacity={Math.sqrt(sol.T)} dashed={trans.dashed} head={0.55} />
            )}
            {th > 0.5 * DEG && (
              <g fill="none" strokeWidth={1.25}>
                {incOn && <path d={arcPath(bx, cy, r, Math.PI, Math.PI - th)} stroke="var(--inc)" />}
                {refOn && sol.R > 1e-6 && <path d={arcPath(bx, cy, r + 5, -Math.PI, -Math.PI + th)} stroke="var(--ref)" />}
                {trnOn && trans && !trans.dashed && trans.angle > 0.5 * DEG && (
                  <path d={arcPath(bx, cy, r, 0, -trans.angle)} stroke="var(--trn)" />
                )}
              </g>
            )}
            {incOn && (
              <>
                <line x1={incStart[0]} y1={incStart[1]} x2={bx - 24 * c} y2={cy + 24 * s} stroke="transparent" strokeWidth={30}
                  style={{ cursor: 'grab', touchAction: 'none' }} {...drag} />
                <circle
                  cx={hx} cy={hy} r={7} fill={HALO} stroke="var(--inc)" strokeWidth={2.5}
                  style={{ cursor: 'grab', touchAction: 'none' }}
                  tabIndex={0} role="slider" aria-label="Angle of incidence (drag, or use arrow keys)"
                  aria-valuemin={0} aria-valuemax={89.9} aria-valuenow={state.thetaDeg}
                  onKeyDown={(e) => {
                    const d = e.shiftKey ? 0.1 : 1
                    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); onTheta(Math.max(0, Math.round((state.thetaDeg - d) * 10) / 10)) }
                    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); onTheta(Math.min(89.9, Math.round((state.thetaDeg + d) * 10) / 10)) }
                  }}
                  {...drag}
                />
              </>
            )}
          </>
        )}

        {/* axes glyph */}
        <g transform={`translate(16, ${H - 44})`} stroke={INK} strokeWidth={1.25} fill={INK}>
          <line x1={0} y1={0} x2={22} y2={0} /><polygon points="26,0 20,-3 20,3" stroke="none" />
          <line x1={0} y1={0} x2={0} y2={-22} /><polygon points="0,-26 -3,-20 3,-20" stroke="none" />
        </g>
        {/* scale bar, Medium 1 */}
        <g transform={`translate(${62}, ${H - 16})`} stroke={INK} strokeWidth={1.5}>
          <line x1={0} y1={0} x2={bar1 * v.ppm} y2={0} /><line x1={0} y1={-4} x2={0} y2={4} /><line x1={bar1 * v.ppm} y1={-4} x2={bar1 * v.ppm} y2={4} />
        </g>
        {v.magnified && (
          <g transform={`translate(${W - 16 - bar2 * v.ppm2z}, ${H - 16})`} stroke="var(--warn)" strokeWidth={1.5}>
            <line x1={0} y1={0} x2={bar2 * v.ppm2z} y2={0} /><line x1={0} y1={-4} x2={0} y2={4} /><line x1={bar2 * v.ppm2z} y1={-4} x2={bar2 * v.ppm2z} y2={4} />
          </g>
        )}
      </svg>

      {/* medium labels */}
      <div className="pointer-events-none absolute left-2.5 top-2 text-[11.5px] leading-snug" style={{ color: INK, maxWidth: bx - 16 }}>
        <span className="block truncate rounded-[3px] px-1 py-px" style={{ background: 'color-mix(in srgb, var(--map-halo) 72%, transparent)' }}>
          <span className="tag !text-current">Medium 1</span> · {model.name1}
        </span>
      </div>
      <div className="pointer-events-none absolute top-2 flex flex-col items-start text-[11.5px] leading-snug" style={{ left: bx + 10, right: 8, color: INK }}>
        <span className="block max-w-full truncate rounded-[3px] px-1 py-px" style={{ background: 'color-mix(in srgb, var(--map-halo) 72%, transparent)' }}>
          <span className="tag !text-current">Medium 2</span> · {model.name2}
          {model.cls2 !== 'lossless' && model.cls2 !== 'pec' ? ` · ${CLASS_LABEL[model.cls2]}` : ''}
        </span>
        {v.magnified && (
          <div className="mt-1">
            <span className="inline-block rounded-[3px] px-1 py-px font-medium text-warn" style={{ background: 'color-mix(in srgb, var(--map-halo) 80%, transparent)' }}>
              Different scale: z magnified ×{sig(v.mag, 3)}
            </span>
          </div>
        )}
        {gain > 1 && (
          <div className="mt-1">
            <span className="inline-block rounded-[3px] px-1 py-px font-medium text-warn" style={{ background: 'color-mix(in srgb, var(--map-halo) 80%, transparent)' }}>
              Weak field: colour scale ×{sig(gain, 3)}
            </span>
          </div>
        )}
        {lossyOblique && (
          <div className="mt-1">
            <span className="rounded-[3px] border border-current px-1 py-px text-warn" style={{ background: 'color-mix(in srgb, var(--map-halo) 80%, transparent)' }}>
              beyond the textbook
            </span>
          </div>
        )}
      </div>

      {/* axes and scale labels */}
      <Label x={48} y={H - 44} align="left"><Tex>z</Tex></Label>
      <Label x={10} y={H - 80} align="left"><Tex>x</Tex></Label>
      <Label x={62 + bar1 * v.ppm + 6} y={H - 16} align="left">
        <span className="num text-[11px]">{siShort(bar1, 'm')}</span>
      </Label>
      {v.magnified && (
        <Label x={W - 16 - bar2 * v.ppm2z - 6} y={H - 16} align="right">
          <span className="num text-[11px] text-warn">{siShort(bar2, 'm')}</span>
        </Label>
      )}

      {/* angle labels */}
      {showRays && incOn && (
        <Label x={li[0]} y={li[1]} align="right">
          <span style={{ color: 'var(--inc)' }}><Tex>{'\\theta_i'}</Tex></span> <span className="num">= {deg(th, 1)}</span>
        </Label>
      )}
      {showRays && refOn && sol.R > 1e-6 && (
        <Label x={lr[0]} y={lr[1]} align="right">
          <span style={{ color: 'var(--ref)' }}><Tex>{'\\theta_r'}</Tex></span> <span className="num">= {deg(th, 1)}</span>
        </Label>
      )}
      {showRays && trnOn && trans && lt && !trans.dashed && sol.T > 1e-4 && (
        <Label x={lt[0]} y={lt[1]} align="left">
          <span style={{ color: 'var(--trn)' }}><Tex>{'\\theta_t'}</Tex></span> <span className="num">= {deg(trans.angle, 1)}</span>
        </Label>
      )}
      {showRays && trnOn && trans?.dashed && lt && (
        <Label x={lt[0]} y={lt[1]} align="left">
          <span className="text-[11px]">phase fronts travel at <span className="num">{deg(trans.angle, 1)}</span></span>
        </Label>
      )}

      {/* regime notes inside Medium 2 */}
      {sol.regime === 'total-reflection' && (
        <Note left={bx + 10} bottom={30}>
          <Prose>{`Evanescent field: travels along $x$, decays as $e^{-\\alpha z}$ with $\\alpha$ = `}</Prose>
          <span className="num">{si(alpha2z, 'Np/m')}</span>
        </Note>
      )}
      {sol.regime === 'pec' && (
        <Note left={bx + 10} bottom={30}>
          <Prose>{`No field inside. Surface current $|\\mathbf{J}_s|$ = `}</Prose>
          <span className="num">{si(jsMag, 'A/m')}</span>
          <Prose>{` along $\\mathbf{a}_${state.pol === 'perp' ? 'y' : 'x'}$`}</Prose>
        </Note>
      )}
      {v.magnified && !model.normal && sol.regime === 'refraction' && state.rays && (
        <Note left={bx + 10} bottom={30}>
          <span style={{ color: 'var(--trn)' }}><Tex>{'\\theta_t'}</Tex></span>{' '}
          <span className="num">= {deg(sol.thetaT ?? 0, 2)}</span> (ray not drawn on the magnified panel)
        </Note>
      )}
    </>
  )
}
