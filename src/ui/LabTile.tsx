import { ReactNode } from 'react'
import { ArrowIcon } from './buttons'

/**
 * Home-page tile for one lab (`data-ui="lab-tile"`). The whole tile is one `<a href>` to the lab's own route,
 * so it opens normally, in a new tab with ⌘/Ctrl-click, and with the browser's back button.
 * A planned lab has the same shape with a dashed border, a "Planned" tag and no link.
 */
export function LabTile({ href, number, tag, title, summary, preview }: {
  /** Route of the lab; absent for a planned lab. */
  href?: string
  number?: string
  tag?: string
  title: ReactNode
  summary?: ReactNode
  /** Small static drawing (decorative). */
  preview?: ReactNode
}) {
  const planned = !href
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <span className="num text-[20px] text-mute">{number ?? ''}</span>
        {planned ? <span className="tag !text-ink">Planned</span> : tag && <span className="tag text-right">{tag}</span>}
      </div>
      {preview && <div aria-hidden className={`mt-3 h-24 ${planned ? 'opacity-50' : ''}`}>{preview}</div>}
      <h3 className="mt-3 text-[19px] font-medium leading-snug tracking-[-0.01em] text-ink">{title}</h3>
      {summary && <p className="mt-1.5 line-clamp-3 text-[14px] leading-relaxed text-mute">{summary}</p>}
      {!planned && (
        <span className="mt-auto pt-4">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-[3px] border border-mute px-3 text-[13px] font-medium text-ink group-hover:border-ink">
            Open lab <ArrowIcon className="transition-transform duration-[120ms] group-hover:translate-x-0.5" />
          </span>
        </span>
      )}
    </>
  )
  const frame = 'flex min-h-[200px] w-full flex-col rounded-[3px] border p-4 sm:p-5'
  if (planned)
    return <div data-ui="lab-tile" aria-disabled="true" className={`${frame} border-dashed border-rule bg-panel`}>{body}</div>
  return (
    <a href={href} data-ui="lab-tile" className={`group ${frame} border-rule bg-panel transition-colors duration-[120ms] hover:border-ink hover:bg-sunk`}>
      {body}
    </a>
  )
}
