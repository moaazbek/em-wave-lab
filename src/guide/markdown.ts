/**
 * A small Markdown reader for the guide (README Decisions: self-written, about 150 lines, no dependency).
 * It knows only what the guide uses:
 *
 *   ## Heading / ### Heading          (an id is made from the text)
 *   paragraphs, "- " lists, "1. " lists (continuation lines indented by two or more spaces)
 *   > note                            (a quiet box)
 *   $$ display maths $$               (on its own line)
 *   ![alt text](image-name)           (a screenshot from public/guide/img/, with its markers)
 *   **bold**, *italic*, `code`, $inline maths$, [text](href)
 *   **[ui:Label]**                    (a label of the interface; tested against the DOM)
 *   {{key: shown}}                    (a number from the engine; tested against the engine)
 *
 * A file starts with a front matter block: "---", "key: value" lines, "states:" with "  - <route>" items, "---".
 */

export type Inline =
  | { t: 'text'; v: string }
  | { t: 'strong'; c: Inline[] }
  | { t: 'em'; c: Inline[] }
  | { t: 'code'; v: string }
  | { t: 'math'; v: string }
  | { t: 'ui'; v: string }
  | { t: 'num'; key: string; v: string }
  | { t: 'link'; href: string; c: Inline[] }

export type Block =
  | { t: 'h'; level: 2 | 3; id: string; c: Inline[] }
  | { t: 'p'; c: Inline[] }
  | { t: 'ul' | 'ol'; items: Inline[][] }
  | { t: 'math'; v: string }
  | { t: 'figure'; alt: string; name: string }
  | { t: 'note'; c: Inline[] }

export interface Section {
  id: string
  title: string
  /** Routes ("slug?query") the label test renders for this section. */
  states: string[]
  blocks: Block[]
}

export const slugify = (s: string): string =>
  s.toLowerCase().replace(/\$([^$]*)\$/g, '$1').replace(/\*\*\[ui:([^\]]*)\]\*\*/g, '$1').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/* ---------- inline ---------- */

export function parseInline(src: string): Inline[] {
  const out: Inline[] = []
  let text = ''
  const flush = () => { if (text) { out.push({ t: 'text', v: text }); text = '' } }
  let i = 0
  while (i < src.length) {
    const rest = src.slice(i)
    let m: RegExpMatchArray | null
    if (rest.startsWith('\\') && i + 1 < src.length) { text += src[i + 1]; i += 2; continue }
    if ((m = rest.match(/^\*\*\[ui:([^\]]+)\]\*\*/))) { flush(); out.push({ t: 'ui', v: m[1] }); i += m[0].length; continue }
    if ((m = rest.match(/^\{\{([\w.-]+):\s*([^}]+?)\s*\}\}/))) { flush(); out.push({ t: 'num', key: m[1], v: m[2] }); i += m[0].length; continue }
    if ((m = rest.match(/^\$([^$]+)\$/))) { flush(); out.push({ t: 'math', v: m[1] }); i += m[0].length; continue }
    if ((m = rest.match(/^`([^`]+)`/))) { flush(); out.push({ t: 'code', v: m[1] }); i += m[0].length; continue }
    if ((m = rest.match(/^\*\*(.+?)\*\*/))) { flush(); out.push({ t: 'strong', c: parseInline(m[1]) }); i += m[0].length; continue }
    if ((m = rest.match(/^\*([^*\s][^*]*)\*/))) { flush(); out.push({ t: 'em', c: parseInline(m[1]) }); i += m[0].length; continue }
    if ((m = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/))) { flush(); out.push({ t: 'link', href: m[2], c: parseInline(m[1]) }); i += m[0].length; continue }
    text += src[i]
    i++
  }
  flush()
  return out
}

/* ---------- blocks ---------- */

export function parseBlocks(src: string, idPrefix = ''): Block[] {
  const lines = src.replace(/\r/g, '').split('\n')
  const blocks: Block[] = []
  let i = 0
  const isStart = (l: string) => /^(#{2,3} |> |- |\d+\. |\$\$|!\[)/.test(l)
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }
    let m: RegExpMatchArray | null
    if ((m = line.match(/^(#{2,3}) (.*)$/))) {
      blocks.push({ t: 'h', level: m[1].length as 2 | 3, id: idPrefix + slugify(m[2]), c: parseInline(m[2]) })
      i++
    } else if ((m = line.match(/^!\[([^\]]*)\]\(([\w-]+)\)\s*$/))) {
      blocks.push({ t: 'figure', alt: m[1], name: m[2] })
      i++
    } else if (line.startsWith('$$')) {
      const body: string[] = []
      let l = line.slice(2)
      while (!l.includes('$$') && i < lines.length - 1) { body.push(l); l = lines[++i] }
      body.push(l.replace('$$', ''))
      blocks.push({ t: 'math', v: body.join(' ').trim() })
      i++
    } else if (line.startsWith('> ')) {
      const body: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) body.push(lines[i++].replace(/^> ?/, ''))
      blocks.push({ t: 'note', c: parseInline(body.join(' ')) })
    } else if (/^(- |\d+\. )/.test(line)) {
      const ordered = /^\d+\. /.test(line)
      const items: string[] = []
      while (i < lines.length) {
        const l = lines[i]
        if (ordered ? /^\d+\. /.test(l) : l.startsWith('- ')) items.push(l.replace(/^(- |\d+\. )/, ''))
        else if (/^ {2,}\S/.test(l) && items.length) items[items.length - 1] += ' ' + l.trim()
        else break
        i++
      }
      blocks.push({ t: ordered ? 'ol' : 'ul', items: items.map(parseInline) })
    } else {
      const body: string[] = []
      while (i < lines.length && lines[i].trim() && !isStart(lines[i])) body.push(lines[i++].trim())
      blocks.push({ t: 'p', c: parseInline(body.join(' ')) })
    }
  }
  return blocks
}

/** One guide file: front matter, then Markdown. */
export function parseSection(file: string): Section {
  const m = file.match(/^---\n([\s\S]*?)\n---\n/)
  if (!m) throw new Error('Guide file without front matter')
  const meta: Record<string, string> = {}
  const states: string[] = []
  let inStates = false
  for (const l of m[1].split('\n')) {
    const item = l.match(/^\s+- (.+)$/)
    if (inStates && item) { states.push(item[1].trim()); continue }
    const kv = l.match(/^(\w+):\s*(.*)$/)
    if (kv) { inStates = kv[1] === 'states'; if (!inStates) meta[kv[1]] = kv[2].trim() }
  }
  if (!meta.id || !meta.title) throw new Error('Guide file needs "id" and "title"')
  return { id: meta.id, title: meta.title, states, blocks: parseBlocks(file.slice(m[0].length), `${meta.id}-`) }
}

/** Every inline node of a block list, depth first (for the tests). */
export function inlines(blocks: Block[]): Inline[] {
  const out: Inline[] = []
  const walk = (c: Inline[]) => c.forEach((n) => { out.push(n); if (n.t === 'strong' || n.t === 'em' || n.t === 'link') walk(n.c) })
  for (const b of blocks) {
    if (b.t === 'h' || b.t === 'p' || b.t === 'note') walk(b.c)
    else if (b.t === 'ul' || b.t === 'ol') b.items.forEach(walk)
  }
  return out
}
