const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone

const linkClass = 'text-slate-300 underline hover:text-violet-300'

export default function SiteFooter({ onOpenBackup }) {
  return (
    <footer className="space-y-2 border-t border-slate-800 px-4 py-6 text-center text-xs text-slate-400">
      <p>
        Anime data from{' '}
        <a href="https://anilist.co" target="_blank" rel="noreferrer" className={linkClass}>
          AniList
        </a>
        . K-drama data from{' '}
        <a href="https://www.tvmaze.com" target="_blank" rel="noreferrer" className={linkClass}>
          TVmaze
        </a>{' '}
        (
        <a
          href="https://creativecommons.org/licenses/by-sa/4.0/"
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          CC BY-SA
        </a>
        ). Not affiliated with either.
      </p>
      <p>
        Times are in your time zone ({TIME_ZONE}). Watchlists are saved in this browser.{' '}
        <button type="button" onClick={onOpenBackup} className={`${linkClass} rounded focus-visible:outline-2 focus-visible:outline-violet-400`}>
          Back up or move them
        </button>
        .
      </p>
    </footer>
  )
}
