import { Suspense } from 'react'
import { ThemeChoice, setThemeChoice, useTheme } from '../ui/theme'
import { LABS, PLANNED } from './labs'
import { parseHash, useRoutePath } from './router'

const THEMES: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Auto' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

export function ThemeToggle() {
  const { choice } = useTheme()
  return (
    <div role="radiogroup" aria-label="Colour theme" className="flex items-center text-[11.5px]">
      {THEMES.map((t) => (
        <button
          key={t.value}
          type="button"
          role="radio"
          aria-checked={choice === t.value}
          onClick={() => setThemeChoice(t.value)}
          className={`h-7 px-1.5 ${choice === t.value ? 'text-ink underline decoration-1 underline-offset-4' : 'text-faint hover:text-ink'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

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
        <span className="tag !text-ink">EEE 361 · Electromagnetic Waves</span>
        <ThemeToggle />
      </header>
      <main className="mt-14 sm:mt-20">
        <h1 className="text-[34px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[46px]">Field Lab</h1>
        <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-mute">
          An online laboratory for the course. Change a material or an angle, watch the fields respond, and read the
          same numbers you would get by hand. Notation follows D. K. Cheng, <i>Field and Wave Electromagnetics</i>, 2nd
          edition.
        </p>
        <h2 className="tag mt-14 border-b border-rule pb-2">Labs</h2>
        <ul>
          {LABS.map((l) => (
            <li key={l.slug} className="border-b border-rule">
              <a href={`#/${l.slug}`} className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-x-3 py-5">
                <span className="num text-[13px] text-faint">{l.number}</span>
                <span>
                  <span className="text-[19px] font-medium tracking-[-0.01em] group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4">
                    {l.title}
                  </span>
                  <span className="mt-1.5 block max-w-xl text-[14px] leading-relaxed text-mute">{l.summary}</span>
                  <span className="tag mt-2.5 block">Cheng § {l.sections}</span>
                </span>
                <span aria-hidden className="num text-[15px] text-mute transition-transform group-hover:translate-x-0.5">→</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[13px] text-faint">In preparation: {PLANNED.join('; ')}.</p>
      </main>
      <footer className="mt-auto pt-16 text-[12px] leading-relaxed text-faint">
        Model: uniform plane waves, linear isotropic homogeneous media, steady state. Material values are typical and
        approximate.
      </footer>
    </div>
  )
}
