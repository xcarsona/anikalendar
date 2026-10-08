import { useMemo, useState } from 'react'
import DayTabs, { DAY_PANEL_ID } from './components/DayTabs'
import EpisodeCard, { EpisodeCardSkeleton } from './components/EpisodeCard'
import SearchBar from './components/SearchBar'
import WatchlistBar from './components/WatchlistBar'
import { useToday } from './hooks/useNow'
import { useSchedule } from './hooks/useSchedule'
import { useWatchlist } from './hooks/useWatchlist'
import { groupByWeekday, weekDays, weekdayIndex, weekWindow } from './utils/time'

function ScheduleStatus({ schedule, weekCount }) {
  const { status, fetchedAt, isRefreshing, error, retry, refresh } = schedule

  let message
  if (retry) {
    const seconds = Math.ceil(retry.waitMs / 1000)
    message =
      retry.reason === 'rate-limit'
        ? `AniList is limiting requests — retrying in ${seconds}s…`
        : `Couldn't reach AniList — retrying in ${seconds}s…`
  } else if (status === 'loading') {
    message = 'Loading this week’s schedule…'
  } else if (status === 'ready') {
    const time = new Date(fetchedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    message = `${weekCount} episodes this week · updated ${time}${isRefreshing ? ' · refreshing…' : ''}`
  }

  return (
    <div className="space-y-2" aria-live="polite">
      {message && <p className="text-xs text-slate-500">{message}</p>}
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

function App() {
  const watchlist = useWatchlist()
  // Only pinned shows trigger the after-airing refetch.
  const schedule = useSchedule({ watchedMediaIds: watchlist.ids })
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
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
          <h1 className="shrink-0 text-lg font-semibold tracking-tight">
            Anime<span className="text-violet-400">Schedule</span>
          </h1>
          {/* Own row on phones; between title and timer from sm up. */}
          <div className="order-last flex basis-full justify-center sm:order-none sm:flex-1 sm:basis-auto">
            <SearchBar isPinned={watchlist.isPinned} onTogglePin={watchlist.toggle} />
          </div>
          {/* Pomodoro timer goes here (Phase 7) */}
          <div className="ml-auto rounded-md border border-dashed border-slate-700 px-3 py-1 text-xs text-slate-500 sm:ml-0">
            Timer
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        <ScheduleStatus schedule={schedule} weekCount={byDay.flat().length} />

        <WatchlistBar
          ids={watchlist.ids}
          meta={watchlist.meta}
          episodes={schedule.episodes}
          scheduleStatus={schedule.status}
          onUnpin={watchlist.unpin}
        />

        <DayTabs
          days={days}
          counts={isLoading ? null : byDay.map((list) => list.length)}
          selected={selectedDay}
          onSelect={setSelectedDay}
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
                    />
                  ))}
            </div>
          ) : (
            schedule.status === 'ready' && (
              <p className="rounded-lg border border-dashed border-slate-800 py-12 text-center text-slate-500">
                Nothing airing this day.
              </p>
            )
          )}
        </section>
      </main>
    </div>
  )
}

export default App
