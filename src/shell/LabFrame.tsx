import { ReactNode, useState } from 'react'
import { CourseCode } from './courses'
import { Disclaimer } from './Disclaimer'

export interface LabTab {
  id: string
  label: string
  content: ReactNode
}

/**
 * Page frame shared by the labs (see DESIGN.md § 9).
 * Desktop (>= 1100 px): controls 292 px | centre | results 324 px, each column scrolling on its own.
 * Phone: the pinned block (toolbar + main view) and the tab bar stay at the top; one tab panel below.
 */
export function LabFrame({ desktop, header, course, left, centre, right, pinned, tabs }: {
  desktop: boolean
  header: ReactNode
  course: CourseCode
  left: ReactNode
  centre: ReactNode
  right: ReactNode
  /** Phone: content pinned above the tab bar. */
  pinned: ReactNode
  tabs: LabTab[]
}) {
  const [tab, setTab] = useState(tabs[0].id)
  if (desktop) {
    return (
      <div className="flex h-full flex-col">
        {header}
        <div className="grid min-h-0 flex-1 grid-cols-[292px_minmax(0,1fr)_324px]">
          <aside data-guide="controls" className="scroll-thin flex flex-col gap-6 overflow-y-auto border-r border-rule bg-panel px-4 py-4" aria-label="Controls">
            {left}
          </aside>
          <main data-guide="centre" className="scroll-thin overflow-y-auto px-5 py-4">
            {centre}
            <footer className="mt-8 border-t border-rule pb-2 pt-3"><Disclaimer course={course} /></footer>
          </main>
          <aside data-guide="results" className="scroll-thin overflow-y-auto border-l border-rule bg-panel px-4 py-4" aria-label="Results">
            {right}
          </aside>
        </div>
      </div>
    )
  }
  const current = tabs.find((t) => t.id === tab) ?? tabs[0]
  return (
    <div className="flex min-h-full flex-col">
      {header}
      <div className="sticky top-0 z-20 border-b border-rule bg-bg">
        <div data-guide="pinned">{pinned}</div>
        <div role="tablist" aria-label="Panels" data-guide="tabs" className="flex">
          {tabs.map(({ id, label }) => (
            <button
              key={id} role="tab" data-ui="tab" aria-selected={tab === id} onClick={() => setTab(id)}
              className={`h-11 flex-1 border-b-2 text-[13px] ${tab === id ? 'border-ink font-medium text-ink' : 'border-transparent text-mute'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div role="tabpanel" data-guide="tab-panel" className="flex-1 bg-panel px-4 pb-10 pt-4">
        {current.content}
        <footer className="mt-8 border-t border-rule pt-3"><Disclaimer course={course} /></footer>
      </div>
    </div>
  )
}
