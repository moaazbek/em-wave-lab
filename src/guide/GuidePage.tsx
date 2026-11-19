import { Fragment, ReactNode, useEffect } from 'react'
import { LABS } from '../shell/labs'
import { useRouteAnchor } from '../shell/router'
import { ThemeToggle } from '../shell/ThemeToggle'
import { ArrowIcon, BUTTON_CLASS, Disclosure } from '../ui/buttons'
import { Prose, Tex } from '../ui/Tex'
import { applyPalette, applyTheme } from '../ui/theme'
import { SECTIONS } from './content'
import { Figure, MarkerDot } from './Figure'
import { Block, Inline, Section } from './markdown'

export const PDF_HREF = './guide/eee-labs-guide.pdf'
/** Printed under the title of the PDF. */
const SITE_URL = 'https://moaazbek.github.io/em-wave-lab/'

/* ---------- Markdown → React ---------- */

function renderInline(nodes: Inline[]): ReactNode {
  return nodes.map((n, i) => {
    switch (n.t) {
      case 'text': return <Fragment key={i}>{n.v}</Fragment>
      case 'strong': return <strong key={i} className="font-semibold">{renderInline(n.c)}</strong>
      case 'em': return <em key={i}>{renderInline(n.c)}</em>
      case 'code': return <code key={i} className="num rounded-[3px] bg-sunk px-1 py-px text-[0.9em]">{n.v}</code>
      case 'math': return <Tex key={i}>{n.v}</Tex>
      case 'ui': return <strong key={i} data-guide-label className="font-semibold text-ink">{n.v}</strong>
      case 'num': return <span key={i} className="num">{n.v}</span>
      case 'link': {
        const scrollAgain = () => {
          // a link to the anchor already in the address bar does not fire "hashchange": scroll anyway
          const target = n.href.split('#')[2]
          if (target && window.location.hash === n.href.replace(/^\.\//, '')) document.getElementById(target)?.scrollIntoView()
        }
        return (
          <a key={i} href={n.href} data-ui="prose-link" onClick={scrollAgain}
            className="text-ink underline decoration-mute decoration-1 underline-offset-2 hover:decoration-ink">{renderInline(n.c)}</a>
        )
      }
    }
  })
}

function renderBlocks(blocks: Block[]): ReactNode {
  return blocks.map((b, i) => {
    const prev = blocks[i - 1]
    // a screenshot and the list that explains its markers stay together (also across printed pages)
    if (b.t === 'figure' && blocks[i + 1]?.t === 'ol')
      return <div key={i} className="guide-group break-inside-avoid">{renderBlock(b, prev)}{renderBlock(blocks[i + 1], b)}</div>
    if (b.t === 'ol' && prev?.t === 'figure') return null
    return <Fragment key={i}>{renderBlock(b, prev)}</Fragment>
  })
}

function renderBlock(b: Block, prev: Block | undefined): ReactNode {
  switch (b.t) {
    case 'h':
      return b.level === 2
        ? <h3 id={b.id} className="mt-10 scroll-mt-6 text-[19px] font-medium tracking-[-0.01em]">{renderInline(b.c)}</h3>
        : <h4 id={b.id} className="mt-7 scroll-mt-6 text-[15px] font-semibold">{renderInline(b.c)}</h4>
    case 'p':
      return <p className="mt-3 text-[15px] leading-relaxed">{renderInline(b.c)}</p>
    case 'note':
      return <p className="mt-4 rounded-[3px] border-l-2 border-ink bg-sunk px-3 py-2 text-[14px] leading-relaxed">{renderInline(b.c)}</p>
    case 'math':
      return <div className="my-3 overflow-x-auto text-[15px]"><Tex display>{b.v}</Tex></div>
    case 'figure':
      return <Figure name={b.name} alt={b.alt} />
    case 'ul':
      return (
        <ul className="mt-3 flex list-disc flex-col gap-1.5 pl-5 text-[15px] leading-relaxed marker:text-mute">
          {b.items.map((it, k) => <li key={k}>{renderInline(it)}</li>)}
        </ul>
      )
    case 'ol':
      // a numbered list right after a screenshot explains its markers: number it with the same circles
      if (prev?.t === 'figure')
        return (
          <ol className="mt-1 flex flex-col gap-2 text-[15px] leading-relaxed">
            {b.items.map((it, k) => <li key={k} className="flex gap-2.5"><MarkerDot n={k + 1} className="mt-[1px]" /><span className="min-w-0">{renderInline(it)}</span></li>)}
          </ol>
        )
      return (
        <ol className="mt-3 flex list-decimal flex-col gap-1.5 pl-6 text-[15px] leading-relaxed marker:text-mute marker:font-mono">
          {b.items.map((it, k) => <li key={k} className="pl-1">{renderInline(it)}</li>)}
        </ol>
      )
  }
}

/* ---------- page ---------- */

const subheads = (s: Section) => s.blocks.filter((b): b is Extract<Block, { t: 'h' }> => b.t === 'h' && b.level === 2)

function Contents({ onPick }: { onPick?: () => void }) {
  return (
    <ol className="flex flex-col gap-3 text-[13.5px]">
      {SECTIONS.map((s) => (
        <li key={s.id}>
          <a href={`#/guide#${s.id}`} data-ui="toc-link" onClick={onPick} className="font-medium text-ink hover:underline"><Prose>{s.title}</Prose></a>
          {subheads(s).length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-1 border-l border-rule pl-3">
              {subheads(s).map((h) => (
                <li key={h.id}><a href={`#/guide#${h.id}`} data-ui="toc-link" onClick={onPick} className="text-mute hover:text-ink hover:underline">{renderInline(h.c)}</a></li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  )
}

/** Print in the light theme, whatever the screen uses. */
function usePrintLight() {
  useEffect(() => {
    const before = () => applyPalette('light')
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', applyTheme)
    return () => { window.removeEventListener('beforeprint', before); window.removeEventListener('afterprint', applyTheme) }
  }, [])
}

export default function GuidePage() {
  const anchor = useRouteAnchor()
  usePrintLight()
  useEffect(() => {
    document.title = 'How to use · Field Lab'
    if (anchor) document.getElementById(anchor)?.scrollIntoView()
    else window.scrollTo(0, 0)
  }, [anchor])
  useEffect(() => () => { document.title = 'EEE 361 Field Lab' }, [])
  return (
    <div className="min-h-full bg-bg print:bg-white">
      <header className="flex h-11 items-center justify-between gap-3 border-b border-rule bg-panel px-3 sm:px-4 print:hidden">
        <a href="#/" data-ui="header-link" className={BUTTON_CLASS.small} aria-label="Back to the list of labs">
          <ArrowIcon dir="left" size={13} />Field Lab
        </a>
        <ThemeToggle />
      </header>
      <div className="mx-auto max-w-[1080px] px-4 sm:px-6 lg:grid lg:grid-cols-[230px_minmax(0,768px)] lg:gap-12 print:block print:px-0">
        <nav aria-label="Contents of the guide" className="scroll-thin sticky top-0 hidden max-h-screen self-start overflow-y-auto py-10 lg:block print:hidden">
          <div className="tag mb-3 !text-ink">Contents</div>
          <Contents />
        </nav>
        <main className="guide min-w-0 max-w-[768px] pb-20 pt-8 lg:pt-10">
          <h1 className="text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] sm:text-[34px]">How to use the labs</h1>
          <p className="mt-2 hidden text-[13px] text-mute print:block">Field Lab, EEE 361 and EEE 321 · {SITE_URL}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3 print:hidden">
            <a href={PDF_HREF} download data-ui="button" className={BUTTON_CLASS.secondary}>Download PDF</a>
            <span className="text-[12.5px] text-mute">The same guide on A4 pages, for printing.</span>
          </div>
          <div className="mt-5 lg:hidden print:hidden">
            <Disclosure title="Contents"><div className="py-2"><Contents /></div></Disclosure>
          </div>
          {SECTIONS.map((s) => <GuideSection key={s.id} section={s} />)}
        </main>
      </div>
    </div>
  )
}

function GuideSection({ section: s }: { section: Section }) {
  const lab = LABS.find((l) => l.slug === s.id)
  return (
    <section id={s.id} aria-labelledby={`${s.id}-title`} className={`guide-section scroll-mt-4 pt-12 ${lab ? 'guide-lab' : ''}`}>
      {lab && (
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="tag">{lab.course} · Lab {lab.number} · {lab.tag}</span>
          <a href={`#/${lab.slug}`} data-ui="button" className={`${BUTTON_CLASS.small} print:hidden`}>Open the lab <ArrowIcon size={13} /></a>
        </div>
      )}
      <h2 id={`${s.id}-title`} className="border-b border-rule pb-2 text-[24px] font-semibold leading-tight tracking-[-0.015em]">
        <Prose>{s.title}</Prose>
      </h2>
      {renderBlocks(s.blocks)}
    </section>
  )
}
