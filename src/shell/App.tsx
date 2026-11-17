import { Suspense } from 'react'
import { Disclaimer } from './Disclaimer'
import { ThemeToggle } from './ThemeToggle'
import { COURSES, Course } from './courses'
import { LABS, PLANNED } from './labs'
import { Prose } from '../ui/Tex'
import { parseHash, useRoutePath } from './router'

export { Disclaimer } from './Disclaimer'
export { ThemeToggle } from './ThemeToggle'

export function App() {
  const path = useRoutePath()
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
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col px-5 py-8 sm:px-8 sm:py-14">
      <header className="flex items-center justify-between">
        <span className="tag !text-ink">{COURSES.map((c) => c.code).join(' · ')}</span>
        <ThemeToggle />
      </header>
      <main className="mt-14 sm:mt-20">
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[46px]">Field Lab</h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-mute">
          An online laboratory for two courses. Change a material, an angle or a load, watch the fields and the machine
          respond, and read the same numbers you would get by hand. Each lab follows the notation of its course
          textbook.
        </p>
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
  return (
    <section className="mt-14" aria-labelledby={`course-${course.code}`}>
      <h2 id={`course-${course.code}`} className="tag flex flex-wrap items-baseline justify-between gap-x-4 border-b border-rule pb-2">
        <span className="!text-ink">{course.code} · {course.name}</span>
        <span className="normal-case tracking-normal">
          {course.book.author}, <i>{course.book.title}</i>, {course.book.edition}
        </span>
      </h2>
      <ul>
        {labs.map((l) => (
          <li key={l.slug} className="border-b border-rule">
            <a href={`#/${l.slug}`} className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-3 py-5">
              <span className="num text-[13px] text-faint">{l.number}</span>
              <span>
                <span className="text-[19px] font-medium tracking-[-0.01em] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                  {l.title}
                </span>
                <span className="mt-1.5 block max-w-xl text-[14px] leading-relaxed text-mute">{l.summary}</span>
                <span className="tag mt-2.5 block">{l.tag}</span>
              </span>
              <span aria-hidden className="num text-[15px] text-mute transition-transform group-hover:translate-x-0.5">→</span>
            </a>
          </li>
        ))}
      </ul>
      {planned.length > 0 && (
        <p className="mt-5 text-[13px] text-faint">
          In preparation:{' '}
          {planned.map((p, i) => (
            <span key={p.title}>
              {p.number && <span className="num">{p.number} </span>}
              <Prose>{p.title}</Prose>
              {p.tag && ` (${p.tag})`}
              {i < planned.length - 1 ? '; ' : '.'}
            </span>
          ))}
        </p>
      )}
      {labs.map((l) => (
        <p key={l.slug} className="mt-1.5 text-[12px] leading-relaxed text-faint">
          {labs.length > 1 && <span className="num mr-1.5">{l.number}</span>}<Prose>{l.model}</Prose>
        </p>
      ))}
    </section>
  )
}
