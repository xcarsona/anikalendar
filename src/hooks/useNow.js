import { useSyncExternalStore } from 'react'
import { startOfLocalDay } from '../utils/time'

// One app-wide ticker. Every subscriber shares a single setInterval. It runs
// while the tab is visible and something is subscribed, and keeps running
// while hidden only if a background subscriber (the Pomodoro timer) needs it;
// hidden ticks are delivered to background subscribers only. The value is
// always read from Date.now(), so pausing or a late tick never causes drift.

const currentSecond = () => Math.floor(Date.now() / 1000)

let now = currentSecond()
const listeners = new Set()
const backgroundListeners = new Set()
let alignTimeout = null
let interval = null

const isActive = () => alignTimeout !== null || interval !== null
const isHidden = () => typeof document !== 'undefined' && document.hidden

function notify() {
  backgroundListeners.forEach((listener) => listener())
  if (!isHidden()) listeners.forEach((listener) => listener())
}

function update() {
  const next = currentSecond()
  if (next === now) return
  now = next
  notify()
}

function tick() {
  update()
  // Timers can slide off the second boundary (throttling, a busy main
  // thread). Re-align if so, or displays would occasionally skip a second.
  // Hidden tabs are throttled anyway, so don't fight it there.
  if (!isHidden() && Date.now() % 1000 > 250) start()
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
  const shouldRun = backgroundListeners.size > 0 || (listeners.size > 0 && !isHidden())
  if (shouldRun && !isActive()) start()
  else if (!shouldRun && isActive()) stop()
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    sync()
    // Foreground subscribers missed any ticks while hidden; catch them up
    // even if the second hasn't changed since the last background tick.
    if (!document.hidden) listeners.forEach((listener) => listener())
  })
}

/**
 * Subscribe to second ticks outside React. Returns an unsubscribe function.
 * With `{ background: true }` the ticker keeps running (and calling this
 * listener) while the tab is hidden; use sparingly.
 */
export function subscribeNow(listener, { background = false } = {}) {
  const set = background ? backgroundListeners : listeners
  set.add(listener)
  sync()
  return () => {
    set.delete(listener)
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
