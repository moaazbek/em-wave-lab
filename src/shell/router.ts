import { useEffect, useRef, useSyncExternalStore } from 'react'

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

/**
 * Keep a lab's full state in the URL hash ("#/<slug>?<query>"), so a link reproduces the setup.
 * Writes are debounced by 150 ms and replace the history entry. When the hash changes from outside
 * (a pasted link, back/forward), `onExternal` receives the new query.
 */
export function useUrlSync<S>(slug: string, state: S, encode: (s: S) => string, onExternal: (query: string) => void): void {
  const stateRef = useRef(state)
  stateRef.current = state
  const onExternalRef = useRef(onExternal)
  onExternalRef.current = onExternal
  useEffect(() => {
    const t = setTimeout(() => replaceQuery(slug, encode(state)), 150)
    return () => clearTimeout(t)
  }, [slug, state, encode])
  useEffect(() => {
    const onHash = () => {
      const r = parseHash(window.location.hash)
      if (r.path === slug && r.query && r.query !== encode(stateRef.current)) onExternalRef.current(r.query)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [slug, encode])
}
