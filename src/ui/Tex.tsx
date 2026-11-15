import katex from 'katex'
import { memo, useMemo } from 'react'

const cache = new Map<string, string>()
function render(tex: string, display: boolean): string {
  const key = (display ? 'D' : 'I') + tex
  let html = cache.get(key)
  if (html === undefined) {
    html = katex.renderToString(tex, { displayMode: display, throwOnError: false, strict: false })
    if (cache.size > 4000) cache.clear()
    cache.set(key, html)
  }
  return html
}

/** KaTeX maths. All mathematics on screen goes through this component. */
export const Tex = memo(function Tex({ children, display = false, className }: { children: string; display?: boolean; className?: string }) {
  const html = useMemo(() => render(children, display), [children, display])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
})

/** Plain sentence with inline maths written between dollar signs. */
export const Prose = memo(function Prose({ children, className }: { children: string; className?: string }) {
  const parts = children.split('$')
  return (
    <span className={className}>
      {parts.map((p, i) => (i % 2 === 1 ? <Tex key={i}>{p}</Tex> : <span key={i}>{p}</span>))}
    </span>
  )
})
