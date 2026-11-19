import { ReactNode, useState } from 'react'
import { ArrowIcon, BUTTON_CLASS, Button, CopyIcon, HelpIcon } from '../ui/buttons'
import { Switch } from '../ui/controls'
import { ThemeToggle } from './ThemeToggle'

/** Lab header: back link, lab number and name, textbook tag; Advanced switch, Guide, Copy link, theme. */
export function LabHeader({ slug, number, title, tag, compact, advanced }: {
  /** The lab's route; the Guide button opens its section of the guide ("#/guide#<slug>"). */
  slug: string
  number: string
  title: ReactNode
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
    <header data-guide="lab-header" className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-rule bg-panel px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <a href="#/" data-ui="header-link" className={`${BUTTON_CLASS.small} self-center`} aria-label="Back to the list of labs">
          <ArrowIcon dir="left" size={13} />{compact ? 'Labs' : 'Field Lab'}
        </a>
        <h1 className="truncate text-[14px] font-semibold tracking-[-0.005em]">
          <span className="num mr-1.5 font-normal text-faint">{number}</span>{title}
        </h1>
        {!compact && <span className="tag hidden xl:inline">{tag}</span>}
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-4">
        {advanced && <Switch checked={advanced.checked} onChange={advanced.onChange}>Advanced</Switch>}
        <a href={`#/guide#${slug}`} data-ui="header-link" className={BUTTON_CLASS.small} title="How to use this lab">
          <HelpIcon /><span>Guide</span>
        </a>
        <Button variant="small" onClick={copy} className="hidden sm:inline-flex" title="The link contains the full setup" icon={<CopyIcon />}>
          {copied ? 'Link copied' : 'Copy link'}
        </Button>
        {!compact && <ThemeToggle />}
      </div>
    </header>
  )
}
