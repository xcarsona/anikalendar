import { formatAirTime } from '../utils/time'
import Countdown from './Countdown'
import PinButton from './PinButton'

const FORMAT_LABELS = { TV_SHORT: 'TV Short', MOVIE: 'Movie', SPECIAL: 'Special', MUSIC: 'Music' }

export default function EpisodeCard({ episode, pinned, onTogglePin }) {
  const { title, episode: number, airingAt, coverImage, siteUrl, format } = episode

  return (
    <article
      className={`relative flex gap-3 rounded-lg border bg-slate-900 p-3 ${
        pinned ? 'border-amber-500/40' : 'border-slate-800'
      }`}
    >
      <div className="aspect-[2/3] w-20 shrink-0 overflow-hidden rounded-md bg-slate-800">
        {coverImage && (
          <img src={coverImage} alt="" loading="lazy" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 pr-7 font-medium leading-snug">
          <a
            href={siteUrl}
            target="_blank"
            rel="noreferrer"
            className="hover:text-violet-300 hover:underline focus-visible:outline-2 focus-visible:outline-violet-400"
          >
            {title}
            <span className="sr-only"> (opens AniList in a new tab)</span>
          </a>
        </h3>
        <p className="text-sm text-slate-400">
          Episode {number}
          {format && format !== 'TV' && (
            <span className="ml-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">
              {FORMAT_LABELS[format] ?? format}
            </span>
          )}
        </p>
        <p className="text-sm text-slate-300">
          <time dateTime={new Date(airingAt * 1000).toISOString()}>{formatAirTime(airingAt)}</time>
        </p>
        <Countdown airingAt={airingAt} />
      </div>

      {/* After the content so keyboard focus reaches the title link first. */}
      <PinButton
        pinned={pinned}
        title={title}
        onToggle={onTogglePin}
        className="absolute top-2 right-2"
      />
    </article>
  )
}

export function EpisodeCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex motion-safe:animate-pulse gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
      <div className="aspect-[2/3] w-20 shrink-0 rounded-md bg-slate-800" />
      <div className="flex flex-1 flex-col gap-2 pt-1">
        <div className="h-4 w-4/5 rounded bg-slate-800" />
        <div className="h-3 w-1/3 rounded bg-slate-800" />
        <div className="h-3 w-1/2 rounded bg-slate-800" />
      </div>
    </div>
  )
}
