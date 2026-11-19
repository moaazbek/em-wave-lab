import { Section, parseSection } from './markdown'

/** The guide's Markdown files (`src/guide/content/*.md`), in file-name order. Edit the text there, not here. */
const FILES = import.meta.glob('./content/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

export const SECTIONS: Section[] = Object.keys(FILES).sort().map((k) => parseSection(FILES[k]))
