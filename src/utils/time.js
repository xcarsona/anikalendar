/** Unix seconds for local midnight at the start of `date`'s day. */
export function startOfLocalDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / 1000)
}

/**
 * A `days`-long window starting at local midnight today, as unix seconds.
 * Uses calendar arithmetic rather than `start + days * 86400` so a DST change
 * inside the window doesn't shift the end by an hour.
 */
export function weekWindow(date = new Date(), days = 7) {
  const end = new Date(date)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + days)
  return { start: startOfLocalDay(date), end: Math.floor(end.getTime() / 1000) }
}

/**
 * Time left until `airingAt`. Both arguments are unix seconds.
 * Returns { days, hours, minutes, seconds, total, done }.
 */
export function getRemaining(airingAt, now) {
  const total = Math.max(0, airingAt - now)
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    total,
    done: total === 0,
  }
}

const pad2 = (n) => String(n).padStart(2, '0')

/** "2d 05h 07m 09s"; the days part is dropped when it's zero. */
export function formatCountdown({ days, hours, minutes, seconds }) {
  const clock = `${pad2(hours)}h ${pad2(minutes)}m ${pad2(seconds)}s`
  return days > 0 ? `${days}d ${clock}` : clock
}

export const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Local day of week with Monday = 0 … Sunday = 6. */
export function weekdayIndex(date) {
  return (date.getDay() + 6) % 7
}

/**
 * The seven days of the current window in Mon–Sun order. Because the window
 * starts today, each weekday maps to exactly one date (e.g. on a Thursday,
 * "Mon" is next Monday).
 */
export function weekDays(today = new Date()) {
  const todayIndex = weekdayIndex(today)
  return WEEKDAY_LABELS.map((label, index) => {
    const date = new Date(today)
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + ((index - todayIndex + 7) % 7))
    return { index, label, date, isToday: index === todayIndex }
  })
}

/** Bucket episodes into 7 arrays by local weekday (Mon = 0). */
export function groupByWeekday(episodes) {
  const days = Array.from({ length: 7 }, () => [])
  for (const episode of episodes) {
    days[weekdayIndex(new Date(episode.airingAt * 1000))].push(episode)
  }
  return days
}

const airTimeFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  hour: 'numeric',
  minute: '2-digit',
})
const shortDateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })

/** Local air time, e.g. "Sat 9:30 AM". */
export function formatAirTime(airingAt) {
  return airTimeFormat.format(airingAt * 1000)
}

/** Short local date, e.g. "Oct 12". */
export function formatShortDate(date) {
  return shortDateFormat.format(date)
}
