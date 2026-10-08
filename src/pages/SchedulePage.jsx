import { useEffect, useMemo, useState } from 'react'
import { BRAND } from '../brand'
import DayTabs, { DAY_PANEL_ID } from '../components/DayTabs'
import EpisodeCard, { EpisodeCardSkeleton } from '../components/EpisodeCard'
import SearchBar from '../components/SearchBar'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import WatchlistBar from '../components/WatchlistBar'
import { useToday } from '../hooks/useNow'
import { useSchedule } from '../hooks/useSchedule'
import { useWatchlist } from '../hooks/useWatchlist'
import { setBaseTitle } from '../utils/title'
import { groupByWeekday, weekDays, weekdayIndex, weekWindow } from '../utils/time'

function ScheduleStatus({ schedule, weekCount, providerName }) {
  const { status, fetchedAt, isRefreshing, error, retry, refresh } = schedule

  let message
  if (retry) {
    const seconds = Math.ceil(retry.waitMs / 1000)
    message =
      retry.reason === 'rate-limit'
        ? `${providerName} is limiting requests — retrying in ${seconds}s…`
        : `Couldn't reach ${providerName} — retrying in ${seconds}s…`
  } else if (status === 'loading') {
    message = 'Loading this week’s schedule…'
  } else if (status === 'ready') {
    const time = new Date(fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    message = `${weekCount} episodes this week · updated ${time}${isRefreshing ? ' · refreshing…' : ''}`
  }

  return (
    <div className="space-y-2" aria-live="polite">
      {message && <p className="text-xs text-slate-400">{message}</p>}
      {error && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-700/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-200"
        >
          <span>
            {error}
            {status === 'ready' && ' Showing the last saved schedule.'}
          </span>
          <button
            type="button"
            onClick={refresh}
            disabled={isRefreshing}
            className="rounded-md bg-amber-800/60 px-3 py-1 text-xs font-medium hover:bg-amber-700/60 disabled:opacity-50"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

/** One section's weekly schedule (see sources.js). Render with key={source.id}. */
export default function SchedulePage({ source, focusMode, onToggleFocus, onOpenBackup }) {
  useEffect(() => setBaseTitle(`${source.pageTitle} · ${BRAND}`), [source.pageTitle])

  const watchlist = useWatchlist(source.watchlistKeys)
  // Only pinned shows trigger the after-airing refetch.
  const schedule = useSchedule(source, { watchedMediaIds: watchlist.ids })
  const [selectedDay, setSelectedDay] = useState(() => weekdayIndex(new Date()))

  const today = new Date(useToday() * 1000)
  const days = weekDays(today)
  const { start, end } = weekWindow(today)
  // Keep only this 7-day window: the data runs one day longer (next week's
  // episodes of today's shows), and a stale cache can start before today.
  // Either would put two dates' shows under one weekday tab.
  const byDay = useMemo(
    () => groupByWeekday(schedule.episodes.filter((e) => e.airingAt >= start && e.airingAt < end)),
    [schedule.episodes, start, end],
  )
  const dayEpisodes = byDay[selectedDay]
  const isLoading = schedule.status === 'loading'

  return (
    <>
      <SiteHeader
        currentSource={source}
        search={<SearchBar source={source} isPinned={watchlist.isPinned} onTogglePin={watchlist.toggle} />}
        focusMode={focusMode}
        onToggleFocus={onToggleFocus}
      />

      <main id="main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 focus:outline-none">
        {!focusMode && (
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight">
              <span className={source.accent.text}>{source.name}</span> this week
            </h1>
            <ScheduleStatus
              schedule={schedule}
              weekCount={byDay.flat().length}
              providerName={source.provider.name}
            />
          </div>
        )}

        <WatchlistBar
          source={source}
          ids={watchlist.ids}
          meta={watchlist.meta}
          episodes={schedule.episodes}
          scheduleStatus={schedule.status}
          onUnpin={watchlist.unpin}
          onOpenBackup={onOpenBackup}
        />

        {focusMode ? (
          <p className="text-center text-sm text-slate-400">
            Focus mode is on. Only your watchlist and the timer are shown.
          </p>
        ) : (
          <>
            <DayTabs
              days={days}
              counts={isLoading ? null : byDay.map((list) => list.length)}
              selected={selectedDay}
              onSelect={setSelectedDay}
              accent={source.accent}
            />

            <section id={DAY_PANEL_ID} role="tabpanel" aria-labelledby={`day-tab-${selectedDay}`}>
              {isLoading || dayEpisodes.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {isLoading
                    ? Array.from({ length: 8 }, (_, i) => <EpisodeCardSkeleton key={i} />)
                    : dayEpisodes.map((episode) => (
                        <EpisodeCard
                          key={episode.scheduleId}
                          episode={episode}
                          pinned={watchlist.isPinned(episode.mediaId)}
                          onTogglePin={() => watchlist.toggle(episode)}
                          providerName={source.provider.name}
                          airingWindow={source.airingWindowSeconds}
                        />
                      ))}
                </div>
              ) : (
                schedule.status === 'ready' && (
                  <p className="rounded-lg border border-dashed border-slate-800 py-12 text-center text-slate-400">
                    Nothing airing this day.
                  </p>
                )
              )}
            </section>
          </>
        )}
      </main>

      {!focusMode && <SiteFooter onOpenBackup={onOpenBackup} />}
    </>
  )
}
