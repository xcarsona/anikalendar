import { useEffect, useMemo, useState } from 'react'
import DayTabs, { DAY_PANEL_ID } from './components/DayTabs'
import EpisodeCard, { EpisodeCardSkeleton } from './components/EpisodeCard'
import PomodoroTimer from './components/PomodoroTimer'
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

const FOCUS_MODE_KEY = 'focusMode'

function readFocusMode() {
  try {
    return localStorage.getItem(FOCUS_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function App() {
  const [focusMode, setFocusMode] = useState(readFocusMode)
  useEffect(() => {
    try {
      localStorage.setItem(FOCUS_MODE_KEY, String(focusMode))
    } catch {
      // Not remembered across reloads; still works for this session.
    }
  }, [focusMode])

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
          {!focusMode && (
            <div className="order-last flex basis-full justify-center sm:order-none sm:flex-1 sm:basis-auto">
              <SearchBar isPinned={watchlist.isPinned} onTogglePin={watchlist.toggle} />
            </div>
          )}
          <div className="ml-auto flex items-center gap-2">
            <PomodoroTimer />
            <button
              type="button"
              onClick={() => setFocusMode((on) => !on)}
              aria-pressed={focusMode}
              aria-label="Focus mode: show only the watchlist and timer"
              title="Focus mode"
              className={`flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-violet-400 ${
                focusMode
                  ? 'border-violet-500 bg-violet-600 text-white'
                  : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
              <span className="hidden sm:inline">Focus</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        {!focusMode && <ScheduleStatus schedule={schedule} weekCount={byDay.flat().length} />}

        <WatchlistBar
          ids={watchlist.ids}
          meta={watchlist.meta}
          episodes={schedule.episodes}
          scheduleStatus={schedule.status}
          onUnpin={watchlist.unpin}
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
          </>
        )}
      </main>
    </div>
  )
}

export default App
