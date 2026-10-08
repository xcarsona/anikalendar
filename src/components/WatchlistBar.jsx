import { useMemo } from 'react'
import { useNow } from '../hooks/useNow'
import { AIRING_NOW_SECONDS, formatAirTime } from '../utils/time'
import Countdown from './Countdown'
import PinButton from './PinButton'

const NO_EPISODE = Number.MAX_SAFE_INTEGER

/**
 * Pinned shows with their next episode, soonest first. An episode stays
 * "next" while it's airing, then the following one takes over.
 */
export default function WatchlistBar({ ids, meta, episodes, scheduleStatus, onUnpin }) {
  const now = useNow()

  const episodesByMedia = useMemo(() => {
    const map = new Map()
    for (const episode of episodes) {
      if (!map.has(episode.mediaId)) map.set(episode.mediaId, [])
      map.get(episode.mediaId).push(episode)
    }
    return map
  }, [episodes])

  const items = ids
    .map((mediaId) => {
      const showEpisodes = episodesByMedia.get(mediaId) ?? []
      let next = null
      for (const e of showEpisodes) {
        if (e.airingAt + AIRING_NOW_SECONDS > now && (!next || e.airingAt < next.airingAt)) next = e
      }
      // Prefer the schedule's copy of the details; fall back to what was saved at pin time.
      const info = showEpisodes[0] ?? meta[mediaId] ?? {}
      return {
        mediaId,
        title: info.title ?? `AniList #${mediaId}`,
        coverImage: info.coverImage ?? null,
        siteUrl: info.siteUrl ?? `https://anilist.co/anime/${mediaId}`,
        next,
      }
    })
    .sort((a, b) => (a.next?.airingAt ?? NO_EPISODE) - (b.next?.airingAt ?? NO_EPISODE))

  const noEpisodeText =
    scheduleStatus === 'loading'
      ? 'Loading…'
      : scheduleStatus === 'error'
        ? 'Schedule unavailable'
        : 'No episode this week'

  return (
    <section aria-labelledby="watchlist-heading">
      <h2
        id="watchlist-heading"
        className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400"
      >
        Watchlist
        {ids.length > 0 && <span className="ml-1.5 text-slate-600">{ids.length}</span>}
      </h2>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
          Star a show to pin it here.
        </p>
      ) : (
        <ul className="flex snap-x gap-3 overflow-x-auto pb-2">
          {items.map(({ mediaId, title, coverImage, siteUrl, next }) => (
            <li
              key={mediaId}
              // `relative` contains the absolutely positioned sr-only text; without
              // it, off-screen items stretch the page past the scroll container.
              className="relative flex w-64 shrink-0 snap-start gap-3 rounded-lg border border-slate-800 bg-slate-900 p-2"
            >
              <div className="aspect-[2/3] w-12 shrink-0 overflow-hidden rounded bg-slate-800">
                {coverImage && (
                  <img src={coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-medium hover:text-violet-300 hover:underline focus-visible:outline-2 focus-visible:outline-violet-400"
                >
                  {title}
                  <span className="sr-only"> (opens AniList in a new tab)</span>
                </a>
                {next ? (
                  <>
                    <p className="text-xs text-slate-400">
                      Ep {next.episode} · {formatAirTime(next.airingAt)}
                    </p>
                    <Countdown airingAt={next.airingAt} />
                  </>
                ) : (
                  <p className="text-xs text-slate-500">{noEpisodeText}</p>
                )}
              </div>
              <PinButton
                pinned
                title={title}
                onToggle={() => onUnpin(mediaId)}
                className="self-start"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
