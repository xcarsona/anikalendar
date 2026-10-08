import { useCallback, useEffect, useState } from 'react'
import { fetchSchedule } from '../api/anilist'
import { weekWindow } from '../utils/time'
import { getNow, subscribeNow, useToday } from './useNow'

const CACHE_KEY = 'animeSchedule:v2'
const CACHE_TTL_MS = 30 * 60 * 1000
// One day longer than the 7 shown, so a weekly show that aired today (or
// earlier today) always has its next episode in the data.
const FETCH_DAYS = 8
// After a watched episode airs, wait a bit before refetching, and never
// refetch for this reason more often than the minimum gap.
const AIRED_REFETCH_DELAY_MS = 60 * 1000
const AIRED_REFETCH_MIN_GAP_MS = 10 * 60 * 1000

function readCache() {
  try {
    const cache = JSON.parse(localStorage.getItem(CACHE_KEY))
    return Array.isArray(cache?.episodes) ? cache : null
  } catch {
    return null
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Storage full or unavailable; the app still works without a cache.
  }
}

// A cache from before midnight covers the wrong window even if it's recent.
function isFresh(cache, windowStart = weekWindow().start) {
  return (
    cache !== null &&
    cache.windowStart === windowStart &&
    Date.now() - cache.fetchedAt < CACHE_TTL_MS
  )
}

// Module-level so concurrent callers (including React StrictMode's double
// effect run in dev) share one request instead of each hitting the API.
let inflight = null
// After giving up on a rate limit, refuse new requests until it resets.
let blockedUntil = 0
let lastAiredRefetch = 0

function loadWeek(onRetry) {
  if (Date.now() < blockedUntil) {
    const err = new Error('Rate limited by AniList')
    err.retryAfterMs = blockedUntil - Date.now()
    return Promise.reject(err)
  }
  if (!inflight) {
    const { start, end } = weekWindow(new Date(), FETCH_DAYS)
    inflight = fetchSchedule({ start, end, onRetry })
      .then((episodes) => {
        const entry = { fetchedAt: Date.now(), windowStart: start, episodes }
        writeCache(entry)
        console.log(`[schedule] fetched ${episodes.length} episodes from AniList`, episodes)
        return entry
      })
      .catch((err) => {
        if (err.retryAfterMs) blockedUntil = Date.now() + err.retryAfterMs
        throw err
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

function friendlyError(err) {
  if (err.retryAfterMs) {
    const seconds = Math.ceil(err.retryAfterMs / 1000)
    return `AniList is limiting requests right now. Try again in about ${seconds}s.`
  }
  return "Couldn't load the schedule from AniList. Check your connection and try again."
}

/**
 * Airing episodes from local midnight today through the next 8 days, served
 * from a 30-minute localStorage cache when possible. Refetches when the day
 * changes and shortly after a watched episode airs. Call once (in App) and
 * pass the data down.
 *
 * `watchedMediaIds` limits which shows trigger the after-airing refetch;
 * omit it to watch every episode.
 *
 * Returns { episodes, status, isRefreshing, error, retry, fetchedAt, refresh }:
 * - status: 'loading' (no data yet) | 'ready' | 'error' (no data and it failed)
 * - error: friendly message; can be set alongside stale data
 * - retry: { reason, waitMs, until } while waiting to retry, else null
 */
export function useSchedule({ watchedMediaIds } = {}) {
  const today = useToday()
  const [state, setState] = useState(() => {
    const cache = readCache()
    return {
      episodes: cache?.episodes ?? [],
      fetchedAt: cache?.fetchedAt ?? null,
      status: cache ? 'ready' : 'loading',
      // A stale cache is shown while the mount effect fetches a fresh copy.
      isRefreshing: !isFresh(cache),
      error: null,
      retry: null,
    }
  })

  const load = useCallback(async () => {
    try {
      const entry = await loadWeek((info) =>
        setState((s) => ({ ...s, retry: { ...info, until: Date.now() + info.waitMs } })),
      )
      setState((s) => ({
        ...s,
        episodes: entry.episodes,
        fetchedAt: entry.fetchedAt,
        status: 'ready',
        isRefreshing: false,
        error: null,
        retry: null,
      }))
    } catch (err) {
      console.error('[schedule] fetch failed', err)
      setState((s) => ({
        ...s,
        status: s.fetchedAt ? 'ready' : 'error',
        isRefreshing: false,
        error: friendlyError(err),
        retry: null,
      }))
    }
  }, [])

  const refresh = useCallback(() => {
    setState((s) => ({ ...s, isRefreshing: true, error: null }))
    return load()
  }, [load])

  // Runs on mount and again after midnight, when the cached window goes stale.
  useEffect(() => {
    const cache = readCache()
    if (isFresh(cache, today)) {
      const ageMin = Math.round((Date.now() - cache.fetchedAt) / 60000)
      console.log(`[schedule] using cache (${ageMin} min old, ${cache.episodes.length} episodes)`, cache.episodes)
      return
    }
    // load() only sets state after the fetch settles, not synchronously.
    // oxlint-disable-next-line react/set-state-in-effect
    load()
  }, [load, today])

  // When a watched episode's air time passes (including while the tab was
  // hidden, caught on the first tick after it's visible again), refetch in
  // the background so schedule changes and the next episode show up.
  const watchedKey = watchedMediaIds ? [...watchedMediaIds].sort().join(',') : '*'
  useEffect(() => {
    const ids = watchedKey === '*' ? null : new Set(watchedKey.split(',').map(Number))
    const airTimes = state.episodes
      .filter((e) => !ids || ids.has(e.mediaId))
      .map((e) => e.airingAt)
    if (airTimes.length === 0) return

    let prev = getNow()
    let timer = null
    const unsubscribe = subscribeNow(() => {
      const now = getNow()
      const justAired = airTimes.some((t) => t > prev && t <= now)
      prev = now
      if (!justAired || timer) return
      const waitMs = Math.max(
        AIRED_REFETCH_DELAY_MS,
        lastAiredRefetch + AIRED_REFETCH_MIN_GAP_MS - Date.now(),
      )
      console.log(`[schedule] watched episode aired; refetching in ${Math.round(waitMs / 1000)}s`)
      timer = setTimeout(() => {
        timer = null
        lastAiredRefetch = Date.now()
        refresh()
      }, waitMs)
    })
    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [state.episodes, watchedKey, refresh])

  return { ...state, refresh }
}
