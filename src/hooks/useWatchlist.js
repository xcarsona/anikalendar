import { useCallback, useEffect, useState } from 'react'

const IDS_KEY = 'myWatchlist'
// Title/cover/link for each pinned show, saved at pin time so the bar can
// render shows that have no episode in this week's schedule.
const META_KEY = 'myWatchlistMeta'

function readIds() {
  try {
    const ids = JSON.parse(localStorage.getItem(IDS_KEY))
    return Array.isArray(ids) ? ids.filter(Number.isInteger) : []
  } catch {
    return []
  }
}

function readMeta() {
  try {
    const meta = JSON.parse(localStorage.getItem(META_KEY))
    return meta && typeof meta === 'object' && !Array.isArray(meta) ? meta : {}
  } catch {
    return {}
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or unavailable; the watchlist still works for this session.
  }
}

/**
 * Pinned shows, persisted in localStorage and synced across tabs. Call once
 * (in App) and pass it down.
 *
 * Returns { ids, meta, isPinned(mediaId), pin(show), unpin(mediaId), toggle(show) }
 * where `show` is { mediaId, title, coverImage, siteUrl }.
 */
export function useWatchlist() {
  const [state, setState] = useState(() => ({ ids: readIds(), meta: readMeta() }))

  // Another tab changed the watchlist.
  useEffect(() => {
    function onStorage(event) {
      if (event.key === IDS_KEY || event.key === META_KEY || event.key === null) {
        setState({ ids: readIds(), meta: readMeta() })
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    write(IDS_KEY, state.ids)
    write(META_KEY, state.meta)
  }, [state])

  const pin = useCallback(
    ({ mediaId, title, coverImage, siteUrl }) =>
      setState((prev) =>
        prev.ids.includes(mediaId)
          ? prev
          : {
              ids: [...prev.ids, mediaId],
              meta: { ...prev.meta, [mediaId]: { title, coverImage, siteUrl } },
            },
      ),
    [],
  )

  const unpin = useCallback(
    (mediaId) =>
      setState((prev) => {
        if (!prev.ids.includes(mediaId)) return prev
        const { [mediaId]: _removed, ...meta } = prev.meta
        return { ids: prev.ids.filter((id) => id !== mediaId), meta }
      }),
    [],
  )

  const isPinned = useCallback((mediaId) => state.ids.includes(mediaId), [state.ids])

  const toggle = useCallback(
    (show) => (state.ids.includes(show.mediaId) ? unpin(show.mediaId) : pin(show)),
    [state.ids, pin, unpin],
  )

  return { ids: state.ids, meta: state.meta, isPinned, pin, unpin, toggle }
}
