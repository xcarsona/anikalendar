// Watchlists live in localStorage, one pair of keys per section:
// `ids` holds the pinned show ids, `meta` holds { title, coverImage, siteUrl }
// per id (saved at pin time so shows with no episode this week still render).

/** Fired on window when a watchlist is changed outside its hook (e.g. a backup import). */
export const WATCHLIST_EVENT = 'watchlist-change'

export function readWatchlist(keys) {
  let ids = []
  let meta = {}
  try {
    const parsed = JSON.parse(localStorage.getItem(keys.ids))
    if (Array.isArray(parsed)) ids = parsed.filter(Number.isInteger)
  } catch {
    // Missing or corrupt; start empty.
  }
  try {
    const parsed = JSON.parse(localStorage.getItem(keys.meta))
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) meta = parsed
  } catch {
    // Missing or corrupt; start empty.
  }
  return { ids, meta }
}

export function writeWatchlist(keys, { ids, meta }) {
  try {
    localStorage.setItem(keys.ids, JSON.stringify(ids))
    localStorage.setItem(keys.meta, JSON.stringify(meta))
  } catch {
    // Storage full or unavailable; the list still works for this session.
  }
}

export function notifyWatchlistChange() {
  window.dispatchEvent(new Event(WATCHLIST_EVENT))
}
