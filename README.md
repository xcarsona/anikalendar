# Anikalendar

Weekly airing schedules for **anime** and **K-dramas** with live countdowns, a
personal watchlist, search, and a Pomodoro timer, so you can check episode
times without doomscrolling.

Frontend only. No backend, no account, no API keys. Each visitor's watchlists
are saved in their own browser (localStorage), and a backup code or link moves
them to another device.

## Features

- **Landing page** (`/`) linking to the two schedules, showing how many shows
  you follow in each.
- **Anime** (`/anime`) from [AniList](https://anilist.co) and **K-Drama**
  (`/kdrama`) from [TVmaze](https://www.tvmaze.com): Korean broadcast (KBS,
  SBS, tvN, …) and streaming (Netflix, TVING, YouTube, …).
- **Weekly calendar.** Mon–Sun tabs (opening on today) in your local time zone.
- **Live countdowns.** One shared ticker for the whole page, paused while the
  tab is hidden.
- **Watchlists.** Star shows from the calendar or search. Anime and K-drama
  each have their own list, shown at the top with each show's next episode.
- **Backup and restore.** "Back up or move lists" gives a code and a link
  holding both watchlists; paste either on another browser to add or replace
  its lists.
- **Pomodoro.** 25/5 timer with the time left in the tab title, a soft chime,
  and an optional notification. Focus mode hides everything but the watchlist
  and timer.

## Run it locally

Requires Node.js 20.19+ or 22.12+ (Vite 8).

```bash
npm install
npm run dev       # http://localhost:5173
```

Other scripts:

```bash
npm run build     # production build into dist/
npm run preview   # serve the production build locally
npm run lint      # oxlint
```

## Deploy to Vercel

It's a static Vite site. `vercel.json` only adds a rewrite so `/anime` and
`/kdrama` load the app when opened directly.

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel detects **Vite**. Keep the defaults: build command `npm run build`,
   output directory `dist`. No environment variables are needed.
4. Click **Deploy**. Every later push to the main branch redeploys
   automatically, and pull requests get preview URLs.

Other static hosts work too: serve `dist/` and send unknown paths to
`index.html`.

## Project structure

```
src/
  sources.js             per-section config: API, storage keys, accent colors
  api/anilist.js         AniList GraphQL schedule + search, retry/backoff
  api/tvmaze.js          TVmaze schedule + search, request limiting, batch-drop merging
  hooks/useNow.js        the single app-wide 1-second ticker
  hooks/useSchedule.js   schedule fetch, localStorage cache, refetch logic
  hooks/useWatchlist.js  localStorage-backed watchlist for one section
  hooks/usePomodoro.js   timer state from a stored end timestamp
  storage/watchlists.js  watchlist read/write
  storage/backup.js      backup code encode/decode/validate/apply
  pages/                 LandingPage, SchedulePage
  components/            SiteHeader, SiteFooter, DayTabs, EpisodeCard, Countdown,
                         WatchlistBar, SearchBar, PomodoroTimer, PinButton,
                         WatchlistBackup, Link
  router.js              minimal History API router
  utils/                 time math and formatting, labels, page title, chime
  App.jsx
```

## Notes

- **Rate limits.** AniList allows about 30 requests/min (at the time of
  writing); TVmaze about 20 per 10 seconds. Schedules are cached for 30
  minutes, search is debounced, and both clients back off when limited. A
  K-drama schedule load is 20 TVmaze requests, run at most 3 at a time.
- **K-drama coverage** is whatever TVmaze lists as Korean-language scripted
  shows, which is not every drama. Streaming releases without a published time
  are marked "(approx.)", and episodes released together (e.g. a Netflix
  drop) are shown as one entry.
- **"Airing now"** lasts 30 minutes after start for anime and 70 for K-dramas,
  since neither API gives an end time.
- **localStorage keys:** `animeSchedule:v2`, `kdramaSchedule:v1` (caches);
  `myWatchlist`, `myWatchlistMeta`, `myKdramaWatchlist`,
  `myKdramaWatchlistMeta` (watchlists); `pomodoro`; `focusMode`.

Anime data from [AniList](https://anilist.co). K-drama data from
[TVmaze](https://www.tvmaze.com), licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Not affiliated
with either.
