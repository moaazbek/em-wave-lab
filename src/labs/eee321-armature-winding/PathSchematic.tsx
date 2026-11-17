import { sig } from '../../ui/format'
import { Tex } from '../../ui/Tex'
import type { Chain, Snapshot } from './engine'
import type { Highlight } from './DevelopedDiagram'

/**
 * Like the book's voltage diagrams, drawn our own way: + brush rail on the left, − rail on the right,
 * one row per parallel path with each coil's contribution to V+ − V−, and the path sum.
 */
export function PathSchematic({ snap, highlight, onHighlight, compact = false }: {
  snap: Snapshot; highlight: Highlight; onHighlight: (h: Highlight) => void; compact?: boolean
}) {
  /** Coils ordered from the + brush to the − brush, each with its contribution to V+ − V−. */
  const oriented = (c: Chain) => {
    const fromPlus = snap.polarity[c.fromBrush] > 0
    const items = c.coils.map((k) => ({ k, v: (fromPlus ? -1 : 1) * snap.coilEmf[k] }))
    return { items: fromPlus ? items : items.reverse(), plus: fromPlus ? c.fromBrush : c.toBrush, minus: fromPlus ? c.toBrush : c.fromBrush }
  }
  const maxCoils = Math.max(1, ...snap.paths.map((p) => p.coils.length))
  const showValues = maxCoils <= (compact ? 6 : 10)
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[11px] text-mute">
        <span><span className="num font-semibold text-ink">+</span> brushes</span>
        <span>coil voltages, in order from + to −</span>
        <span>brushes <span className="num font-semibold text-ink">−</span></span>
      </div>
      <div className="flex flex-col gap-1">
        {snap.paths.map((p, i) => {
          const o = oriented(p)
          const on = highlight.path === i || (highlight.brush !== null && (p.fromBrush === highlight.brush || p.toBrush === highlight.brush))
          return (
            <button key={i} type="button" onClick={() => onHighlight({ path: highlight.path === i ? null : i, brush: null })}
              onMouseEnter={() => onHighlight({ path: i, brush: null })} onMouseLeave={() => onHighlight({ path: null, brush: null })}
              className="flex items-center gap-1 text-left" aria-label={`Path ${i + 1}: ${o.items.length} coils, ${sig(Math.abs(p.voltage), 3)} V`}>
              <span className={`h-6 w-1 shrink-0 ${on ? 'bg-ref' : 'bg-ink'}`} />
              <span className="num w-9 shrink-0 text-[10.5px] text-faint">B{o.plus + 1}</span>
              <span className="flex min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
                {o.items.map(({ k, v }) => (
                  <span key={k} title={`coil ${k + 1}: ${sig(v, 3)} V`}
                    className={`num flex h-6 min-w-0 flex-1 items-center justify-center rounded-[2px] border text-[10px] leading-none ${on ? 'border-ref text-ref' : 'border-rule text-mute'} ${v === 0 ? 'opacity-50' : ''}`}>
                    {showValues ? sig(v, 2) : v > 0 ? '+' : v < 0 ? '−' : '0'}
                  </span>
                ))}
              </span>
              <span className="num w-9 shrink-0 text-right text-[10.5px] text-faint">B{o.minus + 1}</span>
              <span className={`num w-16 shrink-0 text-right text-[11.5px] ${on ? 'text-ref' : 'text-ink'}`}>{sig(Math.abs(p.voltage), 3)} V</span>
              <span className={`h-6 w-1 shrink-0 ${on ? 'bg-ref' : 'bg-ink'}`} />
            </button>
          )
        })}
      </div>
      {snap.commutated.length > 0 ? (
        <p className="text-[11.5px] leading-snug text-mute">
          <span className="mr-1 inline-block h-2 w-2 rotate-45 bg-warn align-middle" /> Shorted by a brush (being commutated):{' '}
          {snap.commutated.map((c) => `${c.coils.map((k) => k + 1).join(', ')} (B${c.fromBrush + 1})`).join('; ')}.
        </p>
      ) : (
        <p className="text-[11.5px] leading-snug text-mute">No coil is being commutated at this angle: every brush touches exactly <Tex>m</Tex> segments.</p>
      )}
    </div>
  )
}
