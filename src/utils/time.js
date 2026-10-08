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
