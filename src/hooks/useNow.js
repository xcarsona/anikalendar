import { useSyncExternalStore } from 'react'
import { startOfLocalDay } from '../utils/time'

// One app-wide ticker. Every subscriber shares a single setInterval, which
// only runs while something is subscribed and the tab is visible. The value
// is always read from Date.now(), so pausing or a late tick never causes drift.

const currentSecond = () => Math.floor(Date.now() / 1000)

let now = currentSecond()
const listeners = new Set()
let alignTimeout = null
let interval = null

const isActive = () => alignTimeout !== null || interval !== null

function update() {
  const next = currentSecond()
  if (next === now) return
  now = next
  listeners.forEach((listener) => listener())
}

function tick() {
  update()
  // Timers can slide off the second boundary (throttling, a busy main
  // thread). Re-align if so, or displays would occasionally skip a second.
  if (Date.now() % 1000 > 250) start()
}

function stop() {
  clearTimeout(alignTimeout)
  clearInterval(interval)
  alignTimeout = null
  interval = null
}

function start() {
  stop()
  update()
  // Start the interval just after the next second boundary so every
  // countdown flips at the same moment the wall clock does.
  alignTimeout = setTimeout(() => {
    alignTimeout = null
    update()
    interval = setInterval(tick, 1000)
  }, 1000 - (Date.now() % 1000) + 20)
}

function sync() {
  const shouldRun = listeners.size > 0 && !document.hidden
  if (shouldRun && !isActive()) start()
  else if (!shouldRun && isActive()) stop()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', sync)
}

/** Subscribe to second ticks outside React. Returns an unsubscribe function. */
export function subscribeNow(listener) {
  listeners.add(listener)
  sync()
  return () => {
    listeners.delete(listener)
    sync()
  }
}

/** Current unix seconds; fresh even while the ticker is paused. */
export function getNow() {
  if (!isActive()) now = currentSecond()
  return now
}

/** Current unix seconds, re-rendering once per second. */
export function useNow() {
  return useSyncExternalStore(subscribeNow, getNow)
}

/** Unix seconds of local midnight today; re-renders only when the day changes. */
export function useToday() {
  return useSyncExternalStore(subscribeNow, () => startOfLocalDay(new Date(getNow() * 1000)))
}
