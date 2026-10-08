/** Unix seconds for local midnight at the start of `date`'s day. */
export function startOfLocalDay(date = new Date()) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return Math.floor(d.getTime() / 1000)
}

/**
 * The 7-day window starting at local midnight today, as unix seconds.
 * Uses calendar arithmetic rather than `start + 7 * 86400` so a DST change
 * inside the week doesn't shift the end by an hour.
 */
export function weekWindow(date = new Date()) {
  const end = new Date(date)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 7)
  return { start: startOfLocalDay(date), end: Math.floor(end.getTime() / 1000) }
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
