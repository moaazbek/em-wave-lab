import { useEffect, useMemo, useState } from 'react'
import { Heading } from './controls'
import { Prose, Tex } from './Tex'
import { BeyondBadge } from './Row'

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

export function ExperimentList({ experiments, activeId, onLoad }: {
  experiments: readonly ExperimentInfo[]; activeId: string | null; onLoad: (id: string) => void
}) {
  return (
    <section>
      <Heading>Guided experiments</Heading>
      <ol className="mt-1">
        {experiments.map((e, i) => (
          <li key={e.id}>
            <button
              type="button" onClick={() => onLoad(e.id)} aria-pressed={activeId === e.id}
              className={`flex w-full items-baseline gap-2 border-b border-rule py-[7px] text-left text-[12.5px] leading-snug hover:text-ink ${activeId === e.id ? 'font-medium text-ink' : 'text-mute'}`}
            >
              <span className="num w-4 shrink-0 text-[11px] text-faint">{i + 1}</span>
              <span className="min-w-0 flex-1">{e.title}</span>
              <span className="tag shrink-0">{e.tag ?? `§ ${e.section}`}</span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

/** The active experiment: task, "Predict first" question, "Show the answer", then an optional button that sets the controls. */
export function ExperimentPanel({ experiment, index, onClose, onReveal }: {
  experiment: ExperimentInfo; index: number; onClose: () => void; onReveal: () => void
}) {
  const [shown, setShown] = useState(false)
  useEffect(() => setShown(false), [experiment.id])
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5">
        <h3 className="tag !text-ink">Experiment {index + 1} · {experiment.title}</h3>
        <button type="button" onClick={onClose} className="tag hover:!text-ink">Close</button>
      </div>
      <p className="mt-2.5 text-[13px] leading-relaxed text-mute"><Prose>{experiment.task}</Prose></p>
      <p className="mt-1.5 text-[15px] font-medium leading-snug"><Prose>{`Predict first: ${experiment.question}`}</Prose></p>
      {!shown ? (
        <button type="button" onClick={() => setShown(true)} className="mt-2.5 h-8 rounded-[3px] border border-ink px-3 text-[12.5px] hover:bg-ink hover:text-bg">
          Show the answer
        </button>
      ) : (
        <div className="mt-2.5 border-l-2 border-ink pl-3">
          <p className="text-[13.5px] leading-relaxed"><Prose>{experiment.answer}</Prose></p>
          {experiment.reveal && (
            <button
              type="button"
              onClick={onReveal}
              className="mt-2 h-8 rounded-[3px] border border-rule px-3 text-[12.5px] text-mute hover:border-ink hover:text-ink"
            >
              {experiment.reveal.label}
            </button>
          )}
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
 * Collapsible list of worked steps. `compute` is called only while the panel is open;
 * it is recomputed when `dep` changes.
 */
export function ShowWork({ compute, dep }: { compute: () => WorkStep[]; dep: unknown }) {
  const [open, setOpen] = useState(false)
  const steps = useMemo(() => (open ? compute() : []), [open, dep])
  return (
    <details open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
      <summary className="flex items-baseline justify-between gap-3 border-b border-rule pb-1.5">
        <span className="tag !text-ink">Show the work</span>
        <span className="tag">{open ? 'Hide' : 'Equation, numbers, result'}</span>
      </summary>
      <ol className="mt-1">
        {steps.map((st, i) => (
          <li key={st.title} className="border-b border-rule py-3">
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
    </details>
  )
}
