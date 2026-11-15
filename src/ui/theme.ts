import { useEffect, useSyncExternalStore } from 'react'
import { PALETTES, ThemeName } from './palette'

export type ThemeChoice = 'system' | ThemeName
const KEY = 'eee361-theme'
const mq = () => window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

let choice: ThemeChoice = (() => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
})()

const resolve = (): ThemeName => (choice === 'system' ? (mq().matches ? 'dark' : 'light') : choice)

export function applyTheme(): void {
  const name = resolve()
  const p = PALETTES[name]
  const s = document.documentElement.style
  for (const k of ['bg', 'panel', 'sunk', 'ink', 'mute', 'faint', 'rule', 'inc', 'ref', 'trn', 'warn'] as const)
    s.setProperty(`--${k}`, p[k])
  s.setProperty('--map-ink', p.mapInk)
  s.setProperty('--map-halo', p.mapHalo)
  document.documentElement.dataset.theme = name
  document.documentElement.style.colorScheme = name
  listeners.forEach((l) => l())
}

export function setThemeChoice(c: ThemeChoice): void {
  choice = c
  try {
    if (c === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, c)
  } catch { /* storage may be unavailable */ }
  applyTheme()
}

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Current theme name and the student's choice (system / light / dark). */
export function useTheme(): { theme: ThemeName; choice: ThemeChoice } {
  const theme = useSyncExternalStore(subscribe, resolve)
  const ch = useSyncExternalStore(subscribe, () => choice)
  useEffect(() => {
    const m = mq()
    m.addEventListener('change', applyTheme)
    return () => m.removeEventListener('change', applyTheme)
  }, [])
  return { theme, choice: ch }
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (l) => {
      const m = window.matchMedia(query)
      m.addEventListener('change', l)
      return () => m.removeEventListener('change', l)
    },
    () => window.matchMedia(query).matches,
  )
}
