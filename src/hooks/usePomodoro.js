import { useCallback, useEffect, useEffectEvent, useState } from 'react'
import { subscribeNow } from './useNow'

export const DURATIONS = { work: 25 * 60 * 1000, break: 5 * 60 * 1000 }
export const MODE_LABELS = { work: 'Focus', break: 'Break' }

const STORAGE_KEY = 'pomodoro'
const BASE_TITLE = typeof document !== 'undefined' ? document.title : ''

const otherMode = (mode) => (mode === 'work' ? 'break' : 'work')
const fresh = (mode) => ({ mode, endsAt: null, remainingMs: DURATIONS[mode] })

// State is { mode, endsAt, remainingMs }: while running, `endsAt` is the wall
// clock end time and the remaining time is always derived from it, so
// throttled timers or a backgrounded tab can't make it drift.
function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    if (!saved || !(saved.mode in DURATIONS)) return fresh('work')
    if (typeof saved.endsAt === 'number') {
      // Finished while the page was closed: move on to the next mode.
      return saved.endsAt > Date.now()
        ? { mode: saved.mode, endsAt: saved.endsAt, remainingMs: 0 }
        : fresh(otherMode(saved.mode))
    }
    const remainingMs = Number(saved.remainingMs)
    return remainingMs > 0 && remainingMs <= DURATIONS[saved.mode]
      ? { mode: saved.mode, endsAt: null, remainingMs }
      : fresh(saved.mode)
  } catch {
    return fresh('work')
  }
}

/** "24:59"; rounds up so the display reads 00:00 only once time is up. */
export function formatClock(ms) {
  const total = Math.ceil(Math.max(0, ms) / 1000)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/**
 * 25/5 Pomodoro state persisted in localStorage. While running it shows the
 * time left in the tab title, and `onComplete(mode)` fires when a session
 * ends (even in a background tab), after which the other mode is loaded but
 * not started.
 */
export function usePomodoro({ onComplete } = {}) {
  const [state, setState] = useState(read)
  const { mode, endsAt } = state
  const isRunning = endsAt !== null

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Unavailable storage just means the timer won't survive a reload.
    }
  }, [state])

  const complete = useEffectEvent((finishedMode) => onComplete?.(finishedMode))

  useEffect(() => {
    if (!isRunning) return
    const setTitle = (ms) => {
      document.title = `${formatClock(ms)} ${MODE_LABELS[mode]} · ${BASE_TITLE}`
    }
    setTitle(endsAt - Date.now())
    // Background subscription: keeps ticking while the tab is hidden, which
    // is exactly when the title countdown is useful.
    const unsubscribe = subscribeNow(
      () => {
        const left = endsAt - Date.now()
        if (left > 0) return setTitle(left)
        setState(fresh(otherMode(mode)))
        complete(mode)
      },
      { background: true },
    )
    return () => {
      unsubscribe()
      document.title = BASE_TITLE
    }
  }, [isRunning, endsAt, mode])

  const start = useCallback(
    () => setState((s) => (s.endsAt !== null ? s : { ...s, endsAt: Date.now() + s.remainingMs })),
    [],
  )
  const pause = useCallback(
    () =>
      setState((s) =>
        s.endsAt === null ? s : { ...s, endsAt: null, remainingMs: Math.max(0, s.endsAt - Date.now()) },
      ),
    [],
  )
  const reset = useCallback(() => setState((s) => fresh(s.mode)), [])
  const switchMode = useCallback((next) => setState(fresh(next)), [])

  return {
    mode,
    isRunning,
    // Call during render; the component re-renders each second via useNow.
    getRemainingMs: () => (isRunning ? Math.max(0, endsAt - Date.now()) : state.remainingMs),
    start,
    pause,
    reset,
    switchMode,
  }
}
