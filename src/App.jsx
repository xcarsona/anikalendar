const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function App() {
  return (
    <div className="min-h-svh flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <h1 className="text-lg font-semibold tracking-tight">
            Anime<span className="text-violet-400">Schedule</span>
          </h1>
          {/* Pomodoro timer goes here (Phase 7) */}
          <div className="rounded-md border border-dashed border-slate-700 px-3 py-1 text-xs text-slate-500">
            Timer
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6">
        {/* Watchlist bar (Phase 5) */}
        <section aria-label="Watchlist">
          <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-slate-400">
            Watchlist
          </h2>
          <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
            Pinned shows will appear here.
          </div>
        </section>

        {/* Day tabs (Phase 3) */}
        <nav aria-label="Days of the week" className="flex gap-2 overflow-x-auto">
          {DAYS.map((day) => (
            <span
              key={day}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm text-slate-300"
            >
              {day}
            </span>
          ))}
        </nav>

        {/* Episode grid (Phase 3) */}
        <section
          aria-label="Episodes"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="h-40 rounded-lg border border-slate-800 bg-slate-900"
            />
          ))}
        </section>
      </main>
    </div>
  )
}

export default App
