import { useSyncExternalStore } from 'react'

// A tiny History API router: enough for three routes without a dependency.

const listeners = new Set()

function subscribe(listener) {
  listeners.add(listener)
  window.addEventListener('popstate', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('popstate', listener)
  }
}

const normalize = (path) => (path.length > 1 ? path.replace(/\/+$/, '') : path)

/** Current pathname without a trailing slash, re-rendering on navigation. */
export function usePath() {
  return useSyncExternalStore(subscribe, () => normalize(window.location.pathname))
}

export function navigate(to) {
  if (normalize(to) === normalize(window.location.pathname)) return
  window.history.pushState(null, '', to)
  listeners.forEach((listener) => listener())
  window.scrollTo(0, 0)
  // Move focus to the new page's content so screen readers announce it.
  requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: true }))
}
