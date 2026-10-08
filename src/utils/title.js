// document.title = optional prefix (the running Pomodoro) + the page's title.

let base = typeof document !== 'undefined' ? document.title : ''
let prefix = null

function render() {
  document.title = prefix ? `${prefix} · ${base}` : base
}

/** Set the current page's title, e.g. "Anime schedule · Anikalendar". */
export function setBaseTitle(title) {
  base = title
  render()
}

/** Set or clear (null) a prefix shown before the page title. */
export function setTitlePrefix(next) {
  prefix = next
  render()
}
