# Anime Schedule

A personal anime airing schedule: this week's episodes by day with live
countdowns, a pinned watchlist, search, and a Pomodoro timer, so you can check
episode times without doomscrolling.

Frontend only. No backend, no account, no API key. Data comes from the public
[AniList GraphQL API](https://docs.anilist.co/), and your watchlist, timer, and
a 30-minute schedule cache live in your browser's localStorage.

## Features

- **Weekly calendar.** Mon–Sun tabs (opening on today) in your local time zone.
- **Live countdowns.** One shared ticker for the whole page, paused while the
  tab is hidden.
- **Watchlist.** Star any show. The bar at the top shows each one's next
  episode, soonest first.
- **Search.** Find airing or upcoming shows and pin them from the results.
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

It's a static Vite site, so no configuration file is needed.

1. Push this repo to GitHub.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Vercel detects **Vite**. Keep the defaults: build command `npm run build`,
   output directory `dist`. No environment variables are needed.
4. Click **Deploy**. Every later push to the main branch redeploys
   automatically, and pull requests get preview URLs.

Any static host works the same way: run `npm run build` and serve `dist/`.

## Project structure

```
src/
  api/anilist.js         GraphQL queries, fetch with retry/backoff, shared rate-limit cooldown
  hooks/useNow.js        the single app-wide 1-second ticker
  hooks/useSchedule.js   schedule fetch, localStorage cache, refetch logic
  hooks/useWatchlist.js  localStorage-backed watchlist
  hooks/usePomodoro.js   timer state from a stored end timestamp
  components/            DayTabs, EpisodeCard, Countdown, WatchlistBar, SearchBar,
                         PomodoroTimer, PinButton
  utils/time.js          countdown math, day bucketing, formatting
  utils/chime.js         Web Audio chime
  App.jsx
```

## Notes

- AniList limits requests per minute (30/min at the time of writing). The app
  caches the schedule for 30 minutes, debounces search, and backs off when
  rate limited.
- "Airing now" is shown for 30 minutes after an episode's start time, because
  AniList's schedule has no end time.
- localStorage keys: `animeSchedule:v2` (cache), `myWatchlist` and
  `myWatchlistMeta` (watchlist), `pomodoro`, and `focusMode`.

Schedule data from [AniList](https://anilist.co). Not affiliated with AniList.
