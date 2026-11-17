import { useState } from 'react'
import { Switch } from '../ui/controls'
import { ThemeToggle } from './ThemeToggle'

/** Lab header: back link, lab number and name, textbook tag; Advanced switch, Copy link, theme. */
export function LabHeader({ number, title, tag, compact, advanced }: {
  number: string
  title: string
  /** Textbook reference, e.g. "Cheng § 8-2 to 8-10". Shown from 1280 px. */
  tag: string
  compact: boolean
  advanced?: { checked: boolean; onChange: (v: boolean) => void }
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* clipboard not available: the address bar already holds the link */ }
  }
  return (
    <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-rule bg-panel px-3 sm:px-4">
      <div className="flex min-w-0 items-baseline gap-2.5">
        <a href="#/" className="tag shrink-0 !text-mute hover:!text-ink" aria-label="Back to the list of labs">{compact ? '← Labs' : '← Field Lab'}</a>
        <h1 className="truncate text-[14px] font-semibold tracking-[-0.005em]">
          <span className="num mr-1.5 font-normal text-faint">{number}</span>{title}
        </h1>
        {!compact && <span className="tag hidden xl:inline">{tag}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {advanced && <Switch checked={advanced.checked} onChange={advanced.onChange}>Advanced</Switch>}
        <button type="button" onClick={copy} className="hidden h-7 text-[12px] text-mute hover:text-ink sm:block" title="The link contains the full setup">
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        {!compact && <ThemeToggle />}
      </div>
    </header>
  )
}
