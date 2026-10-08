import { useEffect, useId, useState } from 'react'
import { searchAnime } from '../api/anilist'
import { formatAirDateTime } from '../utils/time'
import Countdown from './Countdown'
import PinButton from './PinButton'

const DEBOUNCE_MS = 300
const MIN_LENGTH = 2
const CACHE_LIMIT = 50

// In-memory results by lowercased term, so retyping or backspacing to an
// earlier query doesn't hit the API again.
const resultCache = new Map()

function cacheResults(key, results) {
  resultCache.delete(key)
  resultCache.set(key, results)
  if (resultCache.size > CACHE_LIMIT) resultCache.delete(resultCache.keys().next().value)
}

function friendlyError(err) {
  if (err.retryAfterMs) {
    return `AniList is limiting requests. Try again in about ${Math.ceil(err.retryAfterMs / 1000)}s.`
  }
  return "Search failed. Check your connection and try again."
}

const STATUS_LABELS = { NOT_YET_RELEASED: 'Upcoming', RELEASING: 'Airing' }

export default function SearchBar({ isPinned, onTogglePin }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  // Last settled lookup that wasn't cached: { key, error }.
  const [failure, setFailure] = useState(null)
  // Bumped after a fetch stores results, so render picks them up from the cache.
  const [, setVersion] = useState(0)
  const panelId = useId()

  const term = query.trim()
  const key = term.toLowerCase()
  const isActive = term.length >= MIN_LENGTH
  const results = resultCache.get(key)
  const error = failure?.key === key ? failure.error : null
  const isLoading = isActive && !results && !error

  useEffect(() => {
    if (!isActive || resultCache.has(key)) return
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const found = await searchAnime(term, { signal: controller.signal })
        cacheResults(key, found)
        setVersion((v) => v + 1)
      } catch (err) {
        if (controller.signal.aborted) return
        console.error('[search] failed', err)
        setFailure({ key, error: friendlyError(err) })
      }
    }, DEBOUNCE_MS)
    // A newer keystroke cancels both the pending debounce and any request in flight.
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term, key, isActive])

  const showPanel = open && isActive

  return (
    <div
      role="search"
      className="relative w-full sm:max-w-md"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <label htmlFor={`${panelId}-input`} className="sr-only">
        Search airing anime
      </label>
      <input
        id={`${panelId}-input`}
        type="search"
        value={query}
        placeholder="Search airing anime…"
        autoComplete="off"
        aria-controls={panelId}
        aria-expanded={showPanel}
        onChange={(event) => {
          setQuery(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false)
        }}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
      />

      {showPanel && (
        <div
          id={panelId}
          // Focusable so clicking the panel background doesn't count as leaving the search.
          tabIndex={-1}
          className="absolute inset-x-0 top-full z-20 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-slate-700 bg-slate-900 shadow-xl shadow-black/40 focus:outline-none"
        >
          <p aria-live="polite" className="px-3 pt-2 pb-1 text-xs text-slate-400">
            {isLoading
              ? 'Searching…'
              : error
                ? ''
                : `${results.length} ${results.length === 1 ? 'result' : 'results'}`}
          </p>
          {error && (
            <p role="alert" className="px-3 pb-3 text-sm text-amber-300">
              {error}
            </p>
          )}
          {results?.length === 0 && (
            <p className="px-3 pb-3 text-sm text-slate-400">
              No airing or upcoming shows match “{term}”.
            </p>
          )}
          {results?.length > 0 && (
            <ul className="divide-y divide-slate-800">
              {results.map((show) => (
                <SearchResult
                  key={show.mediaId}
                  show={show}
                  pinned={isPinned(show.mediaId)}
                  onTogglePin={() => onTogglePin(show)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function SearchResult({ show, pinned, onTogglePin }) {
  const { title, coverImage, siteUrl, format, status, nextEpisode } = show
  return (
    <li className="relative flex items-center gap-3 px-3 py-2">
      <div className="aspect-[2/3] w-10 shrink-0 overflow-hidden rounded bg-slate-800">
        {coverImage && (
          <img src={coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <a
          href={siteUrl}
          target="_blank"
          rel="noreferrer"
          className="line-clamp-2 text-sm font-medium hover:text-violet-300 hover:underline focus-visible:outline-2 focus-visible:outline-violet-400"
        >
          {title}
          <span className="sr-only"> (opens AniList in a new tab)</span>
        </a>
        <p className="text-xs text-slate-400">
          {[format?.replace('_', ' '), STATUS_LABELS[status]].filter(Boolean).join(' · ')}
        </p>
        {nextEpisode ? (
          <p className="flex flex-wrap items-baseline gap-x-2 text-xs text-slate-400">
            <span>
              Ep {nextEpisode.episode} · {formatAirDateTime(nextEpisode.airingAt)}
            </span>
            <Countdown airingAt={nextEpisode.airingAt} />
          </p>
        ) : (
          <p className="text-xs text-slate-400">No air date yet</p>
        )}
      </div>
      <PinButton pinned={pinned} title={title} onToggle={onTogglePin} />
    </li>
  )
}
