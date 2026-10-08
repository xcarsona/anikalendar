import { useCallback, useEffect, useState } from 'react'
import { readWatchlist, WATCHLIST_EVENT, writeWatchlist } from '../storage/watchlists'

/**
 * A section's pinned shows, persisted in localStorage under `keys`
 * ({ ids, meta } storage key names) and kept in sync with other tabs and
 * with backup imports. Call once per page and pass it down.
 *
 * Returns { ids, meta, isPinned(mediaId), pin(show), unpin(mediaId), toggle(show) }
 * where `show` is { mediaId, title, coverImage, siteUrl }.
 */
export function useWatchlist(keys) {
  const [state, setState] = useState(() => readWatchlist(keys))

  // Changed in another tab, or replaced by a backup import in this one.
  useEffect(() => {
    const reload = () => setState(readWatchlist(keys))
    const onStorage = (event) => {
      if (event.key === keys.ids || event.key === keys.meta || event.key === null) reload()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(WATCHLIST_EVENT, reload)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(WATCHLIST_EVENT, reload)
    }
  }, [keys])

  useEffect(() => {
    writeWatchlist(keys, state)
  }, [keys, state])

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
