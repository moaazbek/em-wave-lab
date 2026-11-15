import { useSyncExternalStore } from 'react'

/** Hash routing ("#/slug?query") so the static build works from any sub-path. */
export interface Route {
  path: string
  query: string
}

export function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, '')
  const i = h.indexOf('?')
  return i < 0 ? { path: h, query: '' } : { path: h.slice(0, i), query: h.slice(i + 1) }
}

const subscribe = (l: () => void) => {
  window.addEventListener('hashchange', l)
  return () => window.removeEventListener('hashchange', l)
}

export function useRoutePath(): string {
  return useSyncExternalStore(subscribe, () => parseHash(window.location.hash).path)
}

/** Replace the query part of the hash without adding a history entry. */
export function replaceQuery(path: string, query: string): void {
  const url = `${window.location.pathname}${window.location.search}#/${path}${query ? '?' + query : ''}`
  window.history.replaceState(null, '', url)
}
