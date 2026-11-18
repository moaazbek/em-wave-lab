import { useEffect, useRef } from 'react'
import type { Clock } from '../../ui/clock'
import { useSize } from '../../ui/controls'
import { PALETTES } from '../../ui/palette'
import { Tex } from '../../ui/Tex'
import { useTheme } from '../../ui/theme'
import { sig } from '../../ui/format'
import { PoleGeometry, Snapshot, Winding, segmentAngle, slotAngle } from './engine'
import { rotorAngle } from './rotor'

const f1 = (n: number) => n.toFixed(1)

/**
 * End view: C slots with both coil sides (top layer outside, bottom layer inside), P poles, commutator, fixed brushes.
 * Each pole face is an arc of exactly θ_arc,m = β·360°/P at a fixed radius (the air gap does not change with β);
 * field lines are drawn only under the pole faces, and one dead zone is marked with its angles.
 */
export function EndView({ w, snap, geo, clock, className = '' }: { w: Winding; snap: Snapshot; geo: PoleGeometry; clock: Clock; className?: string }) {
  const [ref, size] = useSize<HTMLDivElement>()
  const { theme } = useTheme()
  const plus = PALETTES[theme].field[4], minus = PALETTES[theme].field[0]
  const S = Math.min(size.w, size.h)
  const cx = size.w / 2, cy = size.h / 2
  const rotor = useRef<SVGGElement>(null)
  const readout = useRef<HTMLDivElement>(null)
  const { C, P } = w.spec

  useEffect(() => {
    if (S < 60) return
    const place = (phase: number) => {
      const a = rotorAngle(phase)
      rotor.current?.setAttribute('transform', `rotate(${f1((-a * 180) / Math.PI)} ${f1(cx)} ${f1(cy)})`)
      if (readout.current) {
        const dm = (a * 180) / Math.PI
        const de = (((P / 2) * dm) % 360 + 360) % 360
        readout.current.textContent = `θm = ${dm.toFixed(1)}°\nθe = ${de.toFixed(1)}°`
      }
    }
    place(clock.phase)
    return clock.subscribe(place)
  }, [clock, S, cx, cy, P])

  if (S < 60) return <div ref={ref} className={`relative border border-rule bg-panel ${className}`} />
  const R = S / 2 - 6
  const rPoleOut = R, rPoleIn = R * 0.86, rRot = R * 0.82, rTop = R * 0.74, rBot = R * 0.63, rC2 = R * 0.4, rC1 = R * 0.3, rB1 = R * 0.41, rB2 = R * 0.52
  const at = (r: number, a: number) => [cx + r * Math.cos(a), cy - r * Math.sin(a)] as const
  const arc = (r0: number, r1: number, a0: number, a1: number) => {
    const [x0, y0] = at(r1, a0), [x1, y1] = at(r1, a1), [x2, y2] = at(r0, a1), [x3, y3] = at(r0, a0)
    const lg = a1 - a0 > Math.PI ? 1 : 0
    return `M${f1(x0)} ${f1(y0)}A${f1(r1)} ${f1(r1)} 0 ${lg} 0 ${f1(x1)} ${f1(y1)}L${f1(x2)} ${f1(y2)}A${f1(r0)} ${f1(r0)} 0 ${lg} 1 ${f1(x3)} ${f1(y3)}Z`
  }
  const markR = Math.max(2.6, Math.min(6, (rBot * Math.PI) / C * 0.42))
  const mark = (a: number, r: number, s: -1 | 0 | 1, key: string) => {
    const [x, y] = at(r, a)
    return (
      <g key={key}>
        <circle cx={x} cy={y} r={markR} fill="var(--panel)" stroke={s === 0 ? 'var(--faint)' : s > 0 ? plus : minus} strokeWidth={1.2} />
        {s > 0 && <circle cx={x} cy={y} r={markR * 0.35} fill={plus} />}
        {s < 0 && <path d={`M${x - markR * 0.5} ${y - markR * 0.5}L${x + markR * 0.5} ${y + markR * 0.5}M${x + markR * 0.5} ${y - markR * 0.5}L${x - markR * 0.5} ${y + markR * 0.5}`} stroke={minus} strokeWidth={1.1} />}
      </g>
    )
  }
  const poleHalf = (snap.beta * Math.PI) / P
  // field lines: radial, from the pole face across the air gap into the rotor, only under the pole faces
  const nLines = Math.max(2, Math.round(geo.arcM / 9))
  const fieldLines = Array.from({ length: P }, (_, i) => {
    const c = (2 * Math.PI * i) / P
    return Array.from({ length: nLines }, (_, k) => {
      const a = c - poleHalf + ((k + 0.5) / nLines) * 2 * poleHalf
      const [x0, y0] = at(rPoleIn, a), [x1, y1] = at(rBot - markR - 4, a)
      // arrowhead in the air gap: into the rotor under N, out of it under S
      const north = i % 2 === 0
      const [hx, hy] = at(north ? rRot + 1 : rPoleIn - 1, a)
      const dir = north ? -1 : 1, ux = Math.cos(a) * dir, uy = -Math.sin(a) * dir, px = -uy, py = ux
      const tip = `M${f1(hx)} ${f1(hy)}l${f1(-ux * 4 + px * 2.2)} ${f1(-uy * 4 + py * 2.2)}M${f1(hx)} ${f1(hy)}l${f1(-ux * 4 - px * 2.2)} ${f1(-uy * 4 - py * 2.2)}`
      return <path key={`${i}.${k}`} d={`M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}${tip}`} stroke="var(--mute)" strokeWidth={0.8} fill="none" opacity={0.75} />
    })
  })
  // one dead zone marked: between the first two poles
  const g0 = poleHalf, g1 = (2 * Math.PI) / P - poleHalf, gm = (g0 + g1) / 2
  const rG = (rPoleIn + rPoleOut) / 2
  const [ga0x, ga0y] = at(rG, g0), [ga1x, ga1y] = at(rG, g1), [gmx, gmy] = at(rG, gm)
  const tick = (a: number) => { const [x0, y0] = at(rG - 4, a), [x1, y1] = at(rG + 4, a); return `M${f1(x0)} ${f1(y0)}L${f1(x1)} ${f1(y1)}` }
  const labelX = size.w - 6, labelY = 13
  return (
    <div ref={ref} className={`relative overflow-hidden border border-rule bg-panel ${className}`}>
      <svg width={size.w} height={size.h} className="absolute inset-0" role="img" aria-label={`End view: ${P} poles, ${C} slots and commutator segments, fixed brushes.`}>
        {Array.from({ length: P }, (_, i) => {
          const c = (2 * Math.PI * i) / P
          const [lx, ly] = at((rPoleIn + rPoleOut) / 2, c)
          return (
            <g key={i}>
              <path d={arc(rPoleIn, rPoleOut, c - poleHalf, c + poleHalf)} fill="var(--rule)" stroke="var(--ink)" strokeWidth={1} />
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize={11} fontWeight={600} className="num" fill="var(--ink)">{i % 2 === 0 ? 'N' : 'S'}</text>
            </g>
          )
        })}
        <circle cx={cx} cy={cy} r={rRot} fill="var(--sunk)" stroke="var(--ink)" strokeWidth={1} />
        {fieldLines}
        {geo.gapM > 1e-9 && (
          <g stroke="var(--mute)" fill="none" strokeWidth={1}>
            <path d={`M${f1(ga0x)} ${f1(ga0y)}A${f1(rG)} ${f1(rG)} 0 0 0 ${f1(ga1x)} ${f1(ga1y)}${tick(g0)}${tick(g1)}`} />
            <path d={`M${f1(gmx)} ${f1(gmy)}L${f1(labelX - 40)} ${f1(labelY + 30)}`} strokeWidth={0.6} strokeDasharray="2 2" />
          </g>
        )}
        <g ref={rotor}>
          {w.coils.map((c) => mark(slotAngle(w, c.top, 0), rTop, snap.topSign[c.k], `t${c.k}`))}
          {w.coils.map((c) => mark(slotAngle(w, c.bottom, 0), rBot, snap.bottomSign[c.k], `b${c.k}`))}
          {Array.from({ length: C }, (_, j) => {
            const a = segmentAngle(w, j, 0)
            const tapped = snap.tapped.some((t) => t.includes(j))
            return <path key={j} d={arc(rC1, rC2, a - w.delta / 2 + 0.01, a + w.delta / 2 - 0.01)} fill={tapped ? 'var(--rule)' : 'var(--panel)'} stroke="var(--ink)" strokeWidth={0.8} />
          })}
        </g>
        <circle cx={cx} cy={cy} r={rC1 * 0.45} fill="var(--ink)" />
        {w.brushAngles.map((b, i) => {
          const [x0, y0] = at(rB1, b), [x1, y1] = at(rB2, b), [lx, ly] = at(rB2 + 9, b)
          return (
            <g key={i}>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--ink)" strokeWidth={Math.max(4, ((w.brushWidth * rC2) / 1) * 0.9)} strokeLinecap="butt" />
              <text x={lx} y={ly + 4} textAnchor="middle" fontSize={12} fontWeight={600} className="num" fill="var(--ink)">{snap.polarity[i] > 0 ? '+' : '−'}</text>
            </g>
          )
        })}
      </svg>
      <div ref={readout} className="num pointer-events-none absolute left-2 top-1.5 whitespace-pre text-[10.5px] leading-tight text-mute" />
      <div className="pointer-events-none absolute right-1.5 top-1 rounded-[3px] px-1 py-px text-right text-[10.5px] leading-tight text-mute" style={{ background: 'color-mix(in srgb, var(--panel) 85%, transparent)' }}>
        {geo.gapM > 1e-9
          ? <>dead zone<br /><span className="num">{sig(geo.gapM, 3)}° mech<br />{sig(geo.gapE, 3)}° elec</span></>
          : <>no dead zone<br /><span className="num">β = 1</span></>}
      </div>
      <div className="pointer-events-none absolute bottom-1 right-2 text-[10.5px] text-mute"><Tex>{'\\theta_e = \\tfrac{P}{2}\\theta_m'}</Tex></div>
    </div>
  )
}
