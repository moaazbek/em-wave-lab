import { ReactNode } from 'react'
import { Tex } from './Tex'

/** Result row: optional colour dot, KaTeX symbol, small qualifier; value on the right in the number face. */
export function Row({ sym, children, color, sub }: { sym: string; children: ReactNode; color?: string; sub?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-[3px]">
      <dt className="flex shrink-0 items-baseline gap-1.5">
        {color && <span className="inline-block h-2 w-2 translate-y-[-1px] rounded-full" style={{ background: color }} />}
        <Tex>{sym}</Tex>
        {sub && <span className="text-[11.5px] text-mute">{sub}</span>}
      </dt>
      <dd className="num min-w-0 text-right text-[13px]">{children}</dd>
    </div>
  )
}

/** Small label badge. Strong: filled with ink; otherwise outlined. */
export function Badge({ strong, children }: { strong: boolean; children: ReactNode }) {
  return (
    <span className={`rounded-[3px] border px-1.5 py-px text-[11.5px] ${strong ? 'border-ink bg-ink text-bg' : 'border-faint text-ink'}`}>
      {children}
    </span>
  )
}

/** "beyond the textbook" badge (`--warn`, DESIGN.md): a result or formula the course does not give. */
export function BeyondBadge({ title }: { title?: string }) {
  return <span title={title} className="whitespace-nowrap rounded-[3px] border border-warn px-1 py-px text-[11px] text-warn">beyond the textbook</span>
}
