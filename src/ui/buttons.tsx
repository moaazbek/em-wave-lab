import { ButtonHTMLAttributes, ReactNode, useId, useState } from 'react'

/**
 * Buttons, chips and disclosures (DESIGN.md § 6 "Buttons"). Everything clickable looks clickable before the
 * pointer touches it: a border or a fill, a button shape, and often an icon; hover changes the fill or the border.
 * Every component sets `data-ui`, which the DOM test checks.
 */

/* ---------- icons (12–14 px, stroke = currentColor) ---------- */

export function ChevronIcon({ open = false, size = 12, className = '' }: { open?: boolean; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" aria-hidden className={`shrink-0 transition-transform duration-[120ms] ${open ? 'rotate-90' : ''} ${className}`}>
      <path d="M4.5 2.5L8 6l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function ArrowIcon({ dir = 'right', size = 14, className = '' }: { dir?: 'right' | 'left'; size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className={`shrink-0 ${className}`}>
      <path d={dir === 'right' ? 'M2 7h9.5M8 3.5L11.5 7 8 10.5' : 'M12 7H2.5M6 3.5L2.5 7 6 10.5'} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function RefreshIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <path d="M11.5 6.5A4.5 4.5 0 1 1 9.8 3.2" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M8.6 1.2l2.6 1.9-1.9 2.6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
export function CopyIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <rect x="4.5" y="4.5" width="7.5" height="7.5" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9.5 2.5V2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}

export function HelpIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" aria-hidden className="shrink-0">
      <circle cx="7" cy="7" r="5.9" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M5.3 5.4a1.8 1.8 0 1 1 2.5 1.65c-.5.22-.8.6-.8 1.1v.35" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="7" cy="10.3" r=".85" fill="currentColor" />
    </svg>
  )
}

/* ---------- Button ---------- */

export type ButtonVariant = 'primary' | 'secondary' | 'small'

const BASE = 'inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[3px] transition-colors duration-[120ms] disabled:cursor-not-allowed disabled:opacity-40'
/** Class names of each variant (exported for the contrast test and for `<a>` styled as a button). */
export const BUTTON_CLASS: Record<ButtonVariant, string> = {
  primary: `${BASE} h-8 px-3 text-[13px] font-medium bg-ink text-bg hover:bg-[color-mix(in_srgb,var(--ink)_85%,var(--bg))] disabled:hover:bg-ink`,
  secondary: `${BASE} h-8 px-3 text-[13px] border border-mute text-ink hover:border-ink hover:bg-sunk disabled:hover:bg-transparent disabled:hover:border-mute`,
  small: `${BASE} h-7 px-2.5 text-[12px] border border-mute text-ink hover:border-ink hover:bg-sunk disabled:hover:bg-transparent disabled:hover:border-mute`,
}

export function Button({ variant = 'secondary', icon, children, className = '', type = 'button', ...rest }: {
  variant?: ButtonVariant
  /** Optional leading icon (14 px). */
  icon?: ReactNode
  children: ReactNode
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button data-ui="button" type={type} className={`${BUTTON_CLASS[variant]} ${className}`} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  )
}

/* ---------- Chip ---------- */

export const CHIP_CLASS = 'num inline-flex h-[26px] shrink-0 cursor-pointer items-center gap-1 rounded-[3px] border px-2 text-[12px] transition-colors duration-[120ms]'
/** A value shortcut ("Drawable: 20 · 30 · 40"). `current`: the chip's value is the one in use (ink fill). */
export function Chip({ current = false, children, className = '', ...rest }: {
  current?: boolean
  children: ReactNode
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'>) {
  return (
    <button data-ui="chip" type="button" aria-pressed={current}
      className={`${CHIP_CLASS} ${current ? 'border-ink bg-ink text-bg' : 'border-mute text-ink hover:bg-sunk'} ${className}`} {...rest}>
      {children}
    </button>
  )
}

/* ---------- Disclosure ---------- */

/**
 * A section that opens and closes: a full-width `<button aria-expanded>` (chevron, title, "Show" / "Hide") and,
 * when open, the content inside the same 1 px frame. `onToggle` is told the new state (to compute only when open).
 */
export function Disclosure({ title, children, defaultOpen = false, onToggle, className = '' }: {
  title: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  onToggle?: (open: boolean) => void
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId()
  return (
    <div className={`rounded-[3px] border border-rule bg-panel transition-colors duration-[120ms] has-[>button:hover]:border-ink ${className}`}>
      <button data-ui="disclosure" type="button" aria-expanded={open} aria-controls={id}
        onClick={() => { setOpen(!open); onToggle?.(!open) }}
        className={`flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-[2px] px-3 text-left hover:bg-sunk ${open ? 'border-b border-rule' : ''}`}>
        <ChevronIcon open={open} className="text-ink" />
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink">{title}</span>
        <span className="shrink-0 text-[12px] text-mute">{open ? 'Hide' : 'Show'}</span>
      </button>
      {open && <div id={id} className="px-3 pb-2">{children}</div>}
    </div>
  )
}
