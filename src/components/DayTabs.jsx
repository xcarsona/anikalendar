import { useEffect, useRef } from 'react'
import { formatShortDate } from '../utils/time'

export const DAY_PANEL_ID = 'day-panel'

/**
 * Mon–Sun tab strip. `days` comes from weekDays(); `counts[i]` is the number
 * of episodes on day i (omitted while loading).
 */
export default function DayTabs({ days, counts, selected, onSelect }) {
  const tabRefs = useRef([])

  // Keep the selected tab visible when the strip scrolls on narrow screens.
  useEffect(() => {
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
      className="flex gap-2 overflow-x-auto pb-1"
    >
      {days.map((day) => {
        const isSelected = day.index === selected
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
            onClick={() => onSelect(day.index)}
            className={`flex min-w-16 shrink-0 flex-col items-center rounded-lg px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 ${
              isSelected
                ? 'bg-violet-600 text-white'
                : 'bg-slate-800/70 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="font-medium">{day.isToday ? 'Today' : day.label}</span>
            <span className={`text-xs ${isSelected ? 'text-violet-100' : 'text-slate-500'}`}>
              {formatShortDate(day.date)}
              {counts && ` · ${counts[day.index]}`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
