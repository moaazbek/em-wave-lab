/**
 * Small static schematics for the home-page tiles: decorative only (no numbers, no results), drawn with the
 * design tokens. 280 × 96 viewBox, scaled to the tile width.
 */
const SW = { fill: 'none', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
const head = (x: number, y: number, ang: number) => {
  const a = (ang * Math.PI) / 180, s = 6
  const p = (d: number) => `${(x - s * Math.cos(a + d)).toFixed(1)} ${(y - s * Math.sin(a + d)).toFixed(1)}`
  return `M${p(0.45)}L${x} ${y}L${p(-0.45)}`
}
const Frame = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 280 96" preserveAspectRatio="xMidYMid meet" className="h-full w-full" aria-hidden>{children}</svg>
)

/** EEE 361: incident, reflected and transmitted rays at a boundary. */
export function PlaneWavePreview() {
  return (
    <Frame>
      <rect x="140" y="4" width="136" height="88" fill="var(--sunk)" />
      <line x1="140" y1="4" x2="140" y2="92" stroke="var(--ink)" strokeWidth="1.2" />
      <line x1="30" y1="48" x2="250" y2="48" stroke="var(--rule)" strokeDasharray="3 3" />
      <path d={`M50 88L140 48${head(140, 48, -24)}`} stroke="var(--inc)" {...SW} />
      <path d={`M140 48L50 8${head(50, 8, 204)}`} stroke="var(--ref)" {...SW} />
      <path d={`M140 48L250 22${head(250, 22, -13)}`} stroke="var(--trn)" {...SW} />
    </Frame>
  )
}

/** EEE 321 Lab 01: a Y and a Δ joined by three coupled coil pairs. */
export function TransformerPreview() {
  const coil = (x: number, y: number, dir: number) => `M${x} ${y - 9}` + [0, 1, 2].map(() => `a4.5 3 0 0 ${dir > 0 ? 1 : 0} 0 6`).join('')
  const cols = ['var(--inc)', 'var(--ref)', 'var(--trn)']
  return (
    <Frame>
      <path d="M40 48V22M40 48L18 62M40 48L62 62" stroke="var(--ink)" {...SW} />
      <path d="M240 24L262 64H218Z" stroke="var(--ink)" {...SW} />
      {[0, 1, 2].map((k) => {
        const y = 22 + k * 26
        return (
          <g key={k}>
            <path d={coil(124, y, 1)} stroke={cols[k]} {...SW} />
            <path d={coil(156, y, -1)} stroke={cols[k]} {...SW} />
            <path d={`M76 ${y}H120M160 ${y}H204`} stroke="var(--mute)" strokeWidth="1" />
          </g>
        )
      })}
      <path d="M136 10V86M144 10V86" stroke="var(--ink)" strokeWidth="1.2" />
    </Frame>
  )
}

/** EEE 321 Lab 02: a rotor between two curved pole faces, with one loop. */
export function LoopPreview() {
  return (
    <Frame>
      <path d="M82 10a52 52 0 0 0 0 76h-22V10Z" fill="var(--sunk)" stroke="var(--ink)" strokeWidth="1.2" />
      <path d="M198 10a52 52 0 0 1 0 76h22V10Z" fill="var(--sunk)" stroke="var(--ink)" strokeWidth="1.2" />
      <circle cx="140" cy="48" r="38" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
      <path d="M118 30L162 66" stroke="var(--inc)" {...SW} />
      <circle cx="118" cy="30" r="6" fill="var(--panel)" stroke="var(--ref)" strokeWidth="1.4" />
      <circle cx="118" cy="30" r="2" fill="var(--ref)" />
      <circle cx="162" cy="66" r="6" fill="var(--panel)" stroke="var(--ref)" strokeWidth="1.4" />
      <path d="M158 62l8 8M166 62l-8 8" stroke="var(--ref)" strokeWidth="1.3" />
      <path d="M100 82a42 42 0 0 0 40 8" stroke="var(--trn)" {...SW} />
      <path d={head(140, 90, -12)} stroke="var(--trn)" {...SW} />
    </Frame>
  )
}

/** EEE 321 Lab 03: a short developed lap winding over a commutator strip. */
export function ArmaturePreview() {
  const coils = [0, 1, 2, 3, 4, 5]
  return (
    <Frame>
      {coils.map((k) => {
        const x = 28 + k * 38
        return (
          <g key={k}>
            <path d={`M${x} 46L${x + 38} 14L${x + 76} 46`} stroke={k === 2 ? 'var(--ref)' : 'var(--ink)'} {...SW} strokeWidth={k === 2 ? 2 : 1.2} opacity={k === 2 ? 1 : 0.8} />
            <path d={`M${x} 46V58L${x + 19} 72M${x + 76} 46V58L${x + 57} 72`} stroke={k === 2 ? 'var(--ref)' : 'var(--ink)'} {...SW} strokeWidth={k === 2 ? 2 : 1.2} opacity={k === 2 ? 1 : 0.8} />
          </g>
        )
      })}
      {Array.from({ length: 7 }, (_, j) => (
        <rect key={j} x={30 + j * 36} y={72} width={33} height={14} fill="var(--panel)" stroke="var(--ink)" strokeWidth="1" />
      ))}
      <rect x="116" y="88" width="16" height="6" fill="var(--ink)" />
    </Frame>
  )
}

export const PREVIEWS: Record<string, () => React.ReactNode> = {
  'plane-wave-incidence': PlaneWavePreview,
  'eee321-three-phase-transformer': TransformerPreview,
  'eee321-rotating-loop': LoopPreview,
  'eee321-armature-winding': ArmaturePreview,
}
