import { useEffect, useRef } from 'react'
import { formatShortDate } from '../utils/time'

export const DAY_PANEL_ID = 'day-panel'

const longDateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
})

/**
 * Mon–Sun tab strip. `days` comes from weekDays(); `counts[i]` is the number
 * of episodes on day i (omitted while loading).
 */
export default function DayTabs({ days, counts, selected, onSelect }) {
  const tabRefs = useRef([])

  // Keep the selected tab visible when the strip scrolls. Only on changes:
  // scrolling on mount would also move the browser's Tab-key starting point
  // past the header, so keyboard users couldn't reach the skip link first.
  const lastSelected = useRef(selected)
  useEffect(() => {
    if (lastSelected.current === selected) return
    lastSelected.current = selected
    tabRefs.current[selected]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [selected])

  function handleKeyDown(event) {
    const last = days.length - 1
    const next = {
      ArrowRight: selected === last ? 0 : selected + 1,
      ArrowLeft: selected === 0 ? last : selected - 1,
      Home: 0,
      End: last,
    }[event.key]
    if (next === undefined) return
    event.preventDefault()
    onSelect(next)
    tabRefs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label="Day of the week"
      onKeyDown={handleKeyDown}
      // Seven equal columns on phones so every day fits; a scrollable row from sm up.
      className="grid grid-cols-7 gap-1 pb-1 sm:flex sm:gap-2 sm:overflow-x-auto"
    >
      {days.map((day) => {
        const isSelected = day.index === selected
        const count = counts?.[day.index]
        const label = [
          longDateFormat.format(day.date) + (day.isToday ? ' (today)' : ''),
          count !== undefined && `${count} ${count === 1 ? 'episode' : 'episodes'}`,
        ]
          .filter(Boolean)
          .join(', ')
        return (
          <button
            key={day.index}
            ref={(el) => {
              tabRefs.current[day.index] = el
            }}
            type="button"
            role="tab"
            id={`day-tab-${day.index}`}
            aria-selected={isSelected}
            aria-controls={DAY_PANEL_ID}
            tabIndex={isSelected ? 0 : -1}
            aria-label={label}
            onClick={() => onSelect(day.index)}
            className={`flex min-w-0 flex-col items-center rounded-lg px-1 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 sm:min-w-16 sm:shrink-0 sm:px-3 sm:py-2 ${
              isSelected
                ? 'bg-violet-600 text-white'
                : `bg-slate-800/70 text-slate-300 hover:bg-slate-800 ${day.isToday ? 'ring-1 ring-violet-500/70 ring-inset' : ''}`
            }`}
          >
            {/* Phones: weekday and count (today gets a ring). From sm: "Today", date and count. */}
            <span className="font-medium sm:hidden">{day.label}</span>
            <span className="hidden font-medium sm:inline">{day.isToday ? 'Today' : day.label}</span>
            <span className={`text-xs ${isSelected ? 'text-violet-100' : 'text-slate-400'}`}>
              <span className="hidden sm:inline">
                {formatShortDate(day.date)}
                {count !== undefined && ' · '}
              </span>
              {count ?? <span className="sm:hidden">{day.date.getDate()}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}
