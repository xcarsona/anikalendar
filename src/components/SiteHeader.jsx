import { BRAND } from '../brand'
import { SOURCE_LIST } from '../sources'
import Link from './Link'
import PomodoroTimer from './PomodoroTimer'

function Logo() {
  return (
    <span className="flex items-center gap-2 text-base font-semibold tracking-tight sm:text-lg">
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-6 shrink-0">
        <rect x="3" y="5" width="26" height="24" rx="5" fill="#7c3aed" />
        <rect x="3" y="5" width="26" height="7" rx="3" fill="#5b21b6" />
        <rect x="9" y="2" width="3" height="6" rx="1.5" fill="#ddd6fe" />
        <rect x="20" y="2" width="3" height="6" rx="1.5" fill="#ddd6fe" />
        <path d="M13 15.5v9l7.5-4.5z" fill="#fff" />
      </svg>
      {BRAND}
    </span>
  )
}

/**
 * Logo, section switcher, optional search, Pomodoro timer and (on schedule
 * pages) the focus mode toggle. Focus mode hides the switcher and search.
 */
export default function SiteHeader({ currentSource = null, search = null, focusMode = false, onToggleFocus }) {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80">
      {/* `relative` anchors the search results panel on phones. */}
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-3 px-4 py-3">
        <Link
          to="/"
          aria-label={`${BRAND} home`}
          className="order-1 rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          <Logo />
        </Link>

        {!focusMode && (
          <nav aria-label="Schedules" className="order-3 flex shrink-0 rounded-lg bg-slate-800/60 p-0.5 text-sm sm:order-2">
            {SOURCE_LIST.map((source) => {
              const isCurrent = currentSource?.id === source.id
              return (
                <Link
                  key={source.id}
                  to={source.path}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`rounded-md px-3 py-1 font-medium focus-visible:outline-2 focus-visible:outline-violet-400 ${
                    isCurrent ? `bg-slate-950 shadow ${source.accent.text}` : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {source.name}
                </Link>
              )
            })}
          </nav>
        )}

        {search && !focusMode && <div className="order-4 flex min-w-0 flex-1 sm:order-3 sm:justify-center">{search}</div>}

        <div className="order-2 ml-auto flex items-center gap-2 sm:order-4">
          <PomodoroTimer />
          {onToggleFocus && (
            <button
              type="button"
              onClick={onToggleFocus}
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
          )}
        </div>
      </div>
    </header>
  )
}
