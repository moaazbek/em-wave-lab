import { ReactNode, useEffect, useId, useRef, useState } from 'react'
import { parseEng, si, sig } from './format'

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const round3 = (v: number) => Number(v.toPrecision(3))

export interface ParamSliderProps {
  /** Symbol (usually KaTeX) shown first. */
  symbol: ReactNode
  /** Plain-language name, also used as the accessible label. */
  name: string
  unit: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  scale?: 'lin' | 'log'
  /** Linear step. */
  step?: number
  /** Log sliders only: the first slider position is exactly 0 (used for conductivity). */
  zeroStop?: boolean
  /** Use SI prefixes when showing the value (2.4 GHz). */
  prefix?: boolean
  digits?: number
  disabled?: boolean
  hint?: ReactNode
  /**
   * Called with the typed value when it lies outside [min, max], instead of clamping it.
   * The caller decides what to show (for example a warning and a clamped value).
   */
  onOutOfRange?: (raw: number) => void
  /** Show the value as a whole number (counts such as coils or turns). */
  integer?: boolean
  /** Custom parser for typed input (default: engineering input with SI prefixes). */
  parse?: (text: string) => number | null
}

const STEPS = 1000

/** Slider with a synchronized number field that accepts engineering input ("2.4e9", "2.4 GHz"). */
export function ParamSlider(p: ParamSliderProps) {
  const id = useId()
  const { scale = 'lin', digits = 4 } = p
  const show = (v: number) => (p.integer ? `${Math.round(v)}${p.unit ? ' ' + p.unit : ''}` : p.prefix ? si(v, p.unit, digits) : `${sig(v, digits)}${p.unit ? ' ' + p.unit : ''}`)
  const [text, setText] = useState<string | null>(null)
  const [bad, setBad] = useState(false)

  const toPos = (v: number): number => {
    if (scale === 'lin') return v
    if (p.zeroStop && v <= 0) return 0
    const lo = p.zeroStop ? 1 : 0
    return Math.round(lo + ((STEPS - lo) * Math.log(clamp(v, p.min, p.max) / p.min)) / Math.log(p.max / p.min))
  }
  const fromPos = (pos: number): number => {
    if (scale === 'lin') return pos
    if (p.zeroStop && pos <= 0) return 0
    const lo = p.zeroStop ? 1 : 0
    return round3(p.min * (p.max / p.min) ** ((pos - lo) / (STEPS - lo)))
  }
  const commit = (raw: string) => {
    const v = (p.parse ?? parseEng)(raw)
    if (v === null) {
      setBad(true)
      return
    }
    setBad(false)
    setText(null)
    if (p.zeroStop && v <= 0) p.onChange(0)
    else if (p.onOutOfRange && (v < p.min || v > p.max)) p.onOutOfRange(v)
    else p.onChange(clamp(v, p.min, p.max))
  }

  return (
    <div className={p.disabled ? 'opacity-50' : ''}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="flex min-w-0 items-baseline gap-1.5">
          <span className="shrink-0">{p.symbol}</span>
          <span className="truncate text-[12px] text-mute">{p.name}</span>
        </label>
        <input
          aria-label={`${p.name} (${p.unit || 'no unit'}), type a value`}
          aria-invalid={bad}
          className={`num w-[8.5rem] shrink-0 border-b bg-transparent py-0.5 text-right text-[13px] outline-none focus:border-ink ${bad ? 'border-warn text-warn' : 'border-rule'}`}
          value={text ?? show(p.value)}
          disabled={p.disabled}
          inputMode="text"
          spellCheck={false}
          autoComplete="off"
          onFocus={(e) => { setText(show(p.value)); requestAnimationFrame(() => e.target.select()) }}
          onChange={(e) => { setText(e.target.value); setBad(false) }}
          onBlur={() => { if (text !== null && text !== show(p.value)) commit(text); else { setText(null); setBad(false) } }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { commit(e.currentTarget.value); e.currentTarget.blur() }
            if (e.key === 'Escape') { setText(null); setBad(false); e.currentTarget.blur() }
          }}
        />
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        disabled={p.disabled}
        min={scale === 'lin' ? p.min : 0}
        max={scale === 'lin' ? p.max : STEPS}
        step={scale === 'lin' ? (p.step ?? (p.max - p.min) / STEPS) : 1}
        value={toPos(p.value)}
        aria-valuetext={show(p.value)}
        onChange={(e) => { setText(null); setBad(false); p.onChange(fromPos(Number(e.target.value))) }}
      />
      {p.hint && <div className="-mt-0.5 text-[11.5px] leading-snug text-mute">{p.hint}</div>}
    </div>
  )
}

export interface SegOption<T extends string> {
  value: T
  label: ReactNode
  title?: string
  /** CSS colour for a small identity dot. */
  dot?: string
}

/** Segmented choice (radio group). */
export function Segmented<T extends string>({ options, value, onChange, label }: {
  options: SegOption<T>[]; value: T; onChange: (v: T) => void; label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-[3px] border border-rule">
      {options.map((o, i) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            title={o.title}
            onClick={() => onChange(o.value)}
            className={`flex h-7 items-center gap-1.5 whitespace-nowrap px-2.5 text-[12px] ${i ? 'border-l border-rule' : ''} ${on ? 'bg-ink text-bg' : 'text-mute hover:text-ink'}`}
          >
            {o.dot && <span className="h-1.5 w-1.5 rounded-full" style={{ background: o.dot }} />}
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Switch({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group inline-flex h-7 shrink-0 items-center gap-2 whitespace-nowrap text-[12px] text-mute hover:text-ink"
    >
      <span className={`relative h-[14px] w-[26px] rounded-full border ${checked ? 'border-ink bg-ink' : 'border-faint'}`}>
        <span className={`absolute top-[2px] h-2 w-2 rounded-full transition-[left] ${checked ? 'left-[14px] bg-bg' : 'left-[2px] bg-faint'}`} />
      </span>
      <span className={checked ? 'text-ink' : ''}>{children}</span>
    </button>
  )
}

/** Panel heading: small caps label with the textbook section on the right. */
export function Heading({ children, section }: { children: ReactNode; section?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5">
      <h3 className="tag !text-ink">{children}</h3>
      {section && <span className="tag" title="Section in Cheng, Field and Wave Electromagnetics, 2nd ed.">§ {section}</span>}
    </div>
  )
}

/** Measured width and height of an element (CSS pixels). */
export function useSize<T extends HTMLElement>(): [React.RefObject<T | null>, { w: number; h: number }] {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect()
      setSize((s) => (Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size]
}
