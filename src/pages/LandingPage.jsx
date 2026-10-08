import { useEffect, useState } from 'react'
import { BRAND } from '../brand'
import Countdown from '../components/Countdown'
import Link from '../components/Link'
import SiteFooter from '../components/SiteFooter'
import SiteHeader from '../components/SiteHeader'
import { useWatchlist } from '../hooks/useWatchlist'
import { SOURCES } from '../sources'
import { setBaseTitle } from '../utils/title'

const SECTIONS = [
  {
    source: SOURCES.anime,
    blurb: 'Every simulcast airing this week, from new seasons to long runners. Data from AniList.',
  },
  {
    source: SOURCES.kdrama,
    blurb: 'Broadcast and streaming K-dramas: KBS, SBS, tvN, Netflix, TVING and more. Data from TVmaze.',
  },
]

const FEATURES = [
  {
    title: 'Your week at a glance',
    body: 'Mon–Sun tabs open on today, with every episode’s air time in your own time zone.',
    icon: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  },
  {
    title: 'Live countdowns',
    body: 'Ticking to the second, highlighted under an hour, and “Airing now” the moment it starts.',
    icon: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  },
  {
    title: 'A watchlist, no login',
    body: 'Star shows from the calendar or search. They’re saved in your browser, just for you.',
    icon: 'M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z',
  },
  {
    title: 'Focus timer',
    body: 'A 25/5 Pomodoro and focus mode, so checking the schedule doesn’t turn into scrolling.',
    icon: 'M9 3h6M12 8v5M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z',
  },
]

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  )
}

function SectionCard({ source, blurb, pinnedCount }) {
  return (
    <Link
      to={source.path}
      className={`group flex flex-col rounded-2xl border border-slate-800 bg-gradient-to-br to-slate-900/60 p-6 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${source.accent.card}`}
    >
      <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
        <span aria-hidden="true" className={`size-2 rounded-full ${source.accent.dot}`} />
        {pinnedCount > 0
          ? `You follow ${pinnedCount} ${pinnedCount === 1 ? 'show' : 'shows'}`
          : 'Weekly schedule'}
      </span>
      <span className="mt-3 text-2xl font-semibold text-white">{source.name}</span>
      <span className="mt-2 text-slate-300">{blurb}</span>
      <span className={`mt-6 inline-flex items-center gap-1 font-medium ${source.accent.text}`}>
        Open the {source.name.toLowerCase()} schedule
        <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
          →
        </span>
      </span>
    </Link>
  )
}

// Next Saturday at 9:00 PM local time, as unix seconds.
function nextSaturdayEvening() {
  const d = new Date()
  d.setHours(21, 0, 0, 0)
  d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7))
  if (d <= new Date()) d.setDate(d.getDate() + 7)
  return Math.floor(d.getTime() / 1000)
}

function ExampleCard() {
  const [airingAt] = useState(nextSaturdayEvening)
  return (
    <figure className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-2xl shadow-violet-950/40">
      <figcaption className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
        Example countdown
      </figcaption>
      <div className="flex gap-3">
        <div aria-hidden="true" className="aspect-[2/3] w-20 shrink-0 rounded-md bg-gradient-to-br from-violet-500 via-fuchsia-500 to-rose-500 opacity-80" />
        <div className="flex flex-col gap-1">
          <p className="font-medium">Your show</p>
          <p className="text-sm text-slate-400">Episode 5</p>
          <p className="text-sm text-slate-300">Sat 9:00 PM</p>
          <Countdown airingAt={airingAt} />
        </div>
      </div>
    </figure>
  )
}

export default function LandingPage({ onOpenBackup }) {
  useEffect(() => setBaseTitle(`${BRAND} · Anime & K-drama airing schedules`), [])
  const pinned = {
    anime: useWatchlist(SOURCES.anime.watchlistKeys).ids.length,
    kdrama: useWatchlist(SOURCES.kdrama.watchlistKeys).ids.length,
  }

  return (
    <>
      <SiteHeader />

      <main id="main" tabIndex={-1} className="flex-1 focus:outline-none">
        <section className="relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -top-40 left-1/2 size-[30rem] -translate-x-[90%] rounded-full bg-violet-600/25 blur-3xl" />
            <div className="absolute -top-24 left-1/2 size-[26rem] translate-x-[0%] rounded-full bg-rose-600/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pt-14 pb-12 sm:pt-24 sm:pb-16">
            <p className="text-sm font-medium text-violet-300">Anime + K-drama airing schedules</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
              Know exactly when{' '}
              <span className="bg-gradient-to-r from-violet-400 to-rose-400 bg-clip-text text-transparent">
                the next episode
              </span>{' '}
              drops.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-pretty text-slate-300">
              This week’s episodes in your time zone, live countdowns, and a watchlist of the shows you
              follow. No account and no feed to scroll.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {SECTIONS.map(({ source, blurb }) => (
                <SectionCard key={source.id} source={source} blurb={blurb} pinnedCount={pinned[source.id]} />
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-4 py-12">
          <h2 id="features-heading" className="text-2xl font-semibold tracking-tight">
            Everything on one calm page
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
                <span className="inline-flex rounded-lg bg-slate-800 p-2 text-violet-300">
                  <Icon path={feature.icon} />
                </span>
                <h3 className="mt-4 font-medium">{feature.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{feature.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <section
          aria-labelledby="saving-heading"
          className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:pb-20 md:grid-cols-2"
        >
          <div>
            <h2 id="saving-heading" className="text-2xl font-semibold tracking-tight">
              No account. Your lists stay yours.
            </h2>
            <p className="mt-3 text-slate-300">
              Everyone who visits gets their own watchlists, saved right in their browser. Nothing to
              sign up for, and nothing stored on a server.
            </p>
            <p className="mt-3 text-slate-300">
              Switching phones or browsers? Copy your backup code and paste it on the other device to
              bring your lists along.
            </p>
            <button
              type="button"
              onClick={onOpenBackup}
              className="mt-6 rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
            >
              Back up or restore lists
            </button>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <ExampleCard />
          </div>
        </section>
      </main>

      <SiteFooter onOpenBackup={onOpenBackup} />
    </>
  )
}
