import { useNow } from '../hooks/useNow'
import { formatClock, MODE_LABELS, usePomodoro } from '../hooks/usePomodoro'
import { playChime, primeChime } from '../utils/chime'

const MESSAGES = {
  work: { title: 'Focus session done', body: 'Time for a 5-minute break.' },
  break: { title: 'Break over', body: 'Ready for another 25 minutes?' },
}

function notify(finishedMode) {
  playChime()
  // The chime is enough when the page is in view.
  if (!document.hidden || !('Notification' in window) || Notification.permission !== 'granted') return
  try {
    new Notification(MESSAGES[finishedMode].title, {
      body: MESSAGES[finishedMode].body,
      tag: 'pomodoro',
    })
  } catch {
    // Some mobile browsers only allow notifications from a service worker.
  }
}

const iconProps = {
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  className: 'size-4',
  fill: 'currentColor',
}

export default function PomodoroTimer() {
  useNow() // re-render once per second
  const timer = usePomodoro({ onComplete: notify })
  const { mode, isRunning } = timer
  const isWork = mode === 'work'

  function handleStart() {
    primeChime()
    // Ask only when the user starts a timer, and only once.
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
    timer.start()
  }

  const buttonClass =
    'rounded-md p-1.5 text-slate-300 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400'

  return (
    <div
      role="group"
      aria-label="Pomodoro timer"
      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-950 py-0.5 pr-0.5 pl-1"
    >
      <button
        type="button"
        onClick={() => timer.switchMode(isWork ? 'break' : 'work')}
        aria-label={`${MODE_LABELS[mode]} mode. Switch to ${isWork ? 'break' : 'focus'} and reset`}
        title={`Switch to ${isWork ? 'break' : 'focus'}`}
        className={`rounded px-1.5 py-0.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-violet-400 ${
          isWork ? 'bg-violet-500/20 text-violet-300' : 'bg-emerald-500/20 text-emerald-300'
        }`}
      >
        {MODE_LABELS[mode]}
      </button>
      <span
        role="timer"
        className={`w-12 text-center text-sm font-semibold tabular-nums ${isRunning ? 'text-white' : 'text-slate-400'}`}
      >
        {formatClock(timer.getRemainingMs())}
      </span>
      {isRunning ? (
        <button type="button" onClick={timer.pause} aria-label="Pause timer" className={buttonClass}>
          <svg {...iconProps}>
            <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStart}
          aria-label={`Start ${MODE_LABELS[mode].toLowerCase()} timer`}
          className={buttonClass}
        >
          <svg {...iconProps}>
            <path d="M8 5.5v13l10.5-6.5z" />
          </svg>
        </button>
      )}
      <button type="button" onClick={timer.reset} aria-label="Reset timer" className={buttonClass}>
        <svg {...iconProps} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4" />
        </svg>
      </button>
    </div>
  )
}
