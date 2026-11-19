import { useEffect, useId, useMemo, useState } from 'react'
import { Heading } from './controls'
import { Prose, Tex } from './Tex'
import { BeyondBadge } from './Row'
import { Button, ChevronIcon, Disclosure } from './buttons'

/* ---------- Guided experiments ---------- */

export interface ExperimentInfo {
  id: string
  title: string
  /** Section in the course textbook, shown as "§ <section>" unless `tag` is given. */
  section: string
  tag?: string
  /** What to try, in one or two short sentences. */
  task: string
  question: string
  answer: string
  /** Optional button inside the answer that sets the controls to the answer. */
  reveal?: { label: string }
}

/** Experiments whose answer has been shown in this session (survives tab switches on the phone). */
const DONE = new Set<string>()

/**
 * Guided experiments: each one is a full-width `<button aria-expanded>` (number, title, one-line preview of the
 * question, chevron). Open: the task, "Predict first", the primary "Show the answer" and the secondary
 * "Set up this experiment"; after the answer, the experiment's own button that sets the controls.
 */
export function ExperimentList<E extends ExperimentInfo>({ experiments, activeId, onLoad, onReveal }: {
  experiments: readonly E[]
  activeId: string | null
  /** Set the controls to the experiment's starting point. */
  onLoad: (id: string) => void
  /** Set the controls to the answer (the experiment's `reveal` button). */
  onReveal: (e: E) => void
}) {
  const [open, setOpen] = useState<string | null>(activeId)
  const [, bump] = useState(0)
  return (
    <section>
      <Heading>Guided experiments</Heading>
      <ol className="mt-2.5 flex flex-col gap-1.5">
        {experiments.map((e, i) => {
          const key = `${e.id}|${e.title}`
          return (
            <li key={e.id}>
              <ExperimentItem
                index={i} experiment={e} open={open === e.id} active={activeId === e.id} done={DONE.has(key)}
                onToggle={() => setOpen(open === e.id ? null : e.id)}
                onLoad={() => onLoad(e.id)}
                onAnswer={() => { DONE.add(key); bump((n) => n + 1) }}
                onReveal={() => onReveal(e)}
              />
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** One guided experiment (`data-ui="experiment"`). */
export function ExperimentItem({ index, experiment: e, open, active, done, onToggle, onLoad, onAnswer, onReveal }: {
  index: number; experiment: ExperimentInfo; open: boolean; active: boolean; done: boolean
  onToggle: () => void; onLoad: () => void; onAnswer: () => void; onReveal: () => void
}) {
  const [shown, setShown] = useState(false)
  useEffect(() => { if (!open) setShown(false) }, [open])
  const id = useId()
  return (
    <div className={`rounded-[3px] border bg-panel transition-colors duration-[120ms] ${open ? 'border-ink border-l-2 border-l-inc' : 'border-rule has-[>button:hover]:border-ink'}`}>
      <button data-ui="experiment" type="button" aria-expanded={open} aria-controls={id} onClick={onToggle}
        className="flex min-h-[52px] w-full cursor-pointer items-center gap-3 rounded-[2px] px-3 py-2.5 text-left hover:bg-sunk">
        <span className="num w-5 shrink-0 text-[13px] text-mute">{index + 1}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-medium leading-snug text-ink">{e.title}</span>
          <span className="mt-0.5 block truncate text-[12px] leading-snug text-mute"><Prose>{e.question}</Prose></span>
        </span>
        {done && <span className="tag shrink-0 !text-ink">✓ done</span>}
        <ChevronIcon open={open} className="text-ink" />
      </button>
      {open && (
        <div id={id} className="flex flex-col gap-2.5 px-3 pb-3 pt-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="tag">{e.tag ?? `§ ${e.section}`}</span>
            {active && <span className="tag !text-ink">controls set</span>}
          </div>
          <p className="text-[13px] leading-relaxed text-mute"><Prose>{e.task}</Prose></p>
          <p className="text-[15px] font-medium leading-snug"><Prose>{`Predict first: ${e.question}`}</Prose></p>
          {shown && (
            <div className="border-l-2 border-ink pl-3">
              <p className="text-[13.5px] leading-relaxed"><Prose>{e.answer}</Prose></p>
              {e.reveal && <Button variant="secondary" className="mt-2" onClick={onReveal}>{e.reveal.label}</Button>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {!shown && <Button variant="primary" onClick={() => { setShown(true); onAnswer() }}>Show the answer</Button>}
            <Button variant="secondary" onClick={onLoad}>{active ? 'Set up again' : 'Set up this experiment'}</Button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------- Explanation ---------- */

/** "What is happening": an optional sentence reacting to the last change (amber rule), then the situation. */
export function WhatIsHappening({ reaction, lines }: { reaction: string | null; lines: string[] }) {
  return (
    <>
      <Heading>What is happening</Heading>
      <div className="mt-2.5 flex flex-col gap-2 text-[14px] leading-relaxed" aria-live="polite">
        {reaction && <p className="border-l-2 border-inc pl-3"><Prose>{reaction}</Prose></p>}
        {lines.map((l, i) => <p key={i} className={reaction ? 'text-mute' : ''}><Prose>{l}</Prose></p>)}
      </div>
    </>
  )
}

/* ---------- Show the work ---------- */

export interface WorkStep {
  title: string
  /** Textbook section, shown as "§ <section>" unless it starts with "beyond" or `tag` is given. */
  section: string
  /** Shown instead of the section, verbatim (for example an equation number "Eq. (7-6)"). */
  tag?: string
  /** Display maths, one line each. */
  lines: string[]
  note?: string
  /** Show the `--warn` "beyond the textbook" badge next to the title. */
  beyond?: boolean
}

/**
 * Collapsible list of worked steps, as a `Disclosure`. `compute` is called only while it is open;
 * it is recomputed when `dep` changes.
 */
export function ShowWork({ compute, dep }: { compute: () => WorkStep[]; dep: unknown }) {
  const [open, setOpen] = useState(false)
  const steps = useMemo(() => (open ? compute() : []), [open, dep])
  return (
    <Disclosure title="Show the work: equation, numbers, result" onToggle={setOpen}>
      <ol>
        {steps.map((st, i) => (
          <li key={st.title} className={`py-3 ${i ? 'border-t border-rule' : ''}`}>
            <div className="flex items-baseline justify-between gap-3">
              <h4 className="text-[13px] font-medium"><span className="num mr-2 text-[11px] font-normal text-faint">{i + 1}</span>{st.title}{st.beyond && <span className="ml-2 align-[1px]"><BeyondBadge /></span>}</h4>
              <span className="tag shrink-0">{st.tag ?? (st.section.startsWith('beyond') ? st.section : `§ ${st.section}`)}</span>
            </div>
            <div className="scroll-thin mt-1 overflow-x-auto pb-1 text-[13px]">
              {st.lines.map((l, k) => <Tex key={k} display>{l}</Tex>)}
            </div>
            {st.note && <p className="text-[11.5px] leading-snug text-mute">{st.note.includes('$') ? <Prose>{st.note}</Prose> : st.note}</p>}
          </li>
        ))}
      </ol>
    </Disclosure>
  )
}
