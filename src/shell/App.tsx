import { Suspense, lazy } from 'react'
import { Disclaimer } from './Disclaimer'
import { ThemeToggle } from './ThemeToggle'
import { COURSES, Course } from './courses'
import { LABS, PLANNED } from './labs'
import { BUTTON_CLASS, Chip, HelpIcon } from '../ui/buttons'
import { LabTile } from '../ui/LabTile'
import { Prose } from '../ui/Tex'
import { PREVIEWS } from './previews'
import { parseHash, useRoutePath } from './router'

export { Disclaimer } from './Disclaimer'
export { ThemeToggle } from './ThemeToggle'

const GuidePage = lazy(() => import('../guide/GuidePage'))

export function App() {
  const path = useRoutePath()
  if (path === 'guide')
    return (
      <Suspense fallback={<div className="p-6 text-mute">Loading the guide…</div>}>
        <GuidePage />
      </Suspense>
    )
  const lab = LABS.find((l) => l.slug === path)
  if (lab) {
    const Lab = lab.component
    return (
      <Suspense fallback={<div className="p-6 text-mute">Loading the lab…</div>}>
        <Lab query={parseHash(window.location.hash).query} />
      </Suspense>
    )
  }
  return <Home />
}

function Home() {
  const jump = (code: string) => document.getElementById(`course-${code.replace(' ', '')}`)?.scrollIntoView({ block: 'start' })
  return (
    <div className="mx-auto flex min-h-full max-w-[1040px] flex-col px-5 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[42px]">Field Lab</h1>
        <div className="flex items-center gap-3">
          <a href="#/guide" data-ui="header-link" className={BUTTON_CLASS.small}><HelpIcon /><span>How to use</span></a>
          <ThemeToggle />
        </div>
      </header>
      <main className="mt-6">
        <p className="max-w-2xl text-[16px] leading-relaxed text-mute">
          An online laboratory for two courses. Change a material, an angle or a load, watch the fields and the machine
          respond, and read the same numbers you would get by hand. Each lab follows the notation of its course
          textbook.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="tag">Courses</span>
          {COURSES.map((c) => <Chip key={c.code} onClick={() => jump(c.code)}>{c.code}</Chip>)}
        </div>
        {COURSES.map((c) => <CourseGroup key={c.code} course={c} />)}
      </main>
      <footer className="mt-auto flex flex-col gap-1.5 pt-16 text-[12px] leading-relaxed text-faint">
        {COURSES.map((c) => <Disclaimer key={c.code} course={c.code} />)}
      </footer>
    </div>
  )
}

function CourseGroup({ course }: { course: Course }) {
  const labs = LABS.filter((l) => l.course === course.code).sort((a, b) => a.number.localeCompare(b.number))
  const planned = PLANNED.filter((p) => p.course === course.code)
  const id = `course-${course.code.replace(' ', '')}`
  return (
    <section id={id} className="mt-12 scroll-mt-4" aria-labelledby={`${id}-h`}>
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-rule pb-2.5">
        <span className="tag !text-ink">{course.code}</span>
        <h2 id={`${id}-h`} className="text-[19px] font-medium tracking-[-0.01em]">{course.name}</h2>
        <span className="text-[13px] text-mute sm:ml-auto">{course.book.author}, <i>{course.book.title}</i>, {course.book.edition}</span>
      </div>
      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {labs.map((l) => {
          const Preview = PREVIEWS[l.slug]
          return (
            <li key={l.slug} className="flex">
              <LabTile href={`#/${l.slug}`} number={l.number} tag={l.tag} preview={Preview ? <Preview /> : undefined}
                title={l.title.includes('$') ? <Prose>{l.title}</Prose> : l.title} summary={l.summary} />
            </li>
          )
        })}
        {planned.map((p) => (
          <li key={p.title} className="flex">
            <LabTile number={p.number} title={<Prose>{p.title}</Prose>} summary={p.tag ?? "In preparation."} />
          </li>
        ))}
      </ul>
      {labs.map((l) => (
        <p key={l.slug} className="mt-2 text-[12px] leading-relaxed text-faint">
          {labs.length > 1 && <span className="num mr-1.5">{l.number}</span>}<Prose>{l.model}</Prose>
        </p>
      ))}
    </section>
  )
}
