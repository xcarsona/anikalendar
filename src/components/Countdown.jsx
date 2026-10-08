import { useNow } from '../hooks/useNow'
import { AIRING_NOW_SECONDS, formatCountdown, getRemaining } from '../utils/time'

const SOON_SECONDS = 60 * 60

/** `airingWindow`: seconds after the start to keep showing "Airing now". */
export default function Countdown({ airingAt, airingWindow = AIRING_NOW_SECONDS }) {
  const now = useNow()
  const remaining = getRemaining(airingAt, now)

  if (remaining.done) {
    return now - airingAt < airingWindow ? (
      <span role="timer" className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
        <span aria-hidden="true" className="size-2 motion-safe:animate-pulse rounded-full bg-emerald-400" />
        Airing now
      </span>
    ) : (
      <span role="timer" className="text-sm text-slate-400">
        Aired
      </span>
    )
  }

  const isSoon = remaining.total < SOON_SECONDS
  return (
    <span
      role="timer"
      className={`text-sm tabular-nums ${isSoon ? 'font-semibold text-amber-300' : 'text-slate-400'}`}
    >
      {isSoon && <span className="sr-only">Starting soon: </span>}
      {formatCountdown(remaining)}
    </span>
  )
}
