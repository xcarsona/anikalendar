import { fetchSchedule as fetchAnimeSchedule, searchAnime } from './api/anilist'
import { fetchKdramaSchedule, searchKdramas } from './api/tvmaze'

// Everything that differs between the anime and K-drama sections. Accent
// classes are written out in full so Tailwind generates them.
export const SOURCES = {
  anime: {
    id: 'anime',
    path: '/anime',
    name: 'Anime',
    pageTitle: 'Anime schedule',
    provider: { name: 'AniList', url: 'https://anilist.co' },
    fetchSchedule: fetchAnimeSchedule,
    search: searchAnime,
    searchPlaceholder: 'Search airing anime…',
    cacheKey: 'animeSchedule:v2',
    watchlistKeys: { ids: 'myWatchlist', meta: 'myWatchlistMeta' },
    showUrl: (id) => `https://anilist.co/anime/${id}`,
    // AniList has no end time; most episodes are ~24 minutes.
    airingWindowSeconds: 30 * 60,
    accent: {
      tab: 'bg-violet-600 text-white',
      tabSubtext: 'text-violet-100',
      todayRing: 'ring-violet-500/70',
      text: 'text-violet-400',
      card: 'from-violet-500/15 hover:border-violet-500/60 focus-visible:outline-violet-400',
      dot: 'bg-violet-400',
    },
  },
  kdrama: {
    id: 'kdrama',
    path: '/kdrama',
    name: 'K-Drama',
    pageTitle: 'K-drama schedule',
    provider: { name: 'TVmaze', url: 'https://www.tvmaze.com' },
    fetchSchedule: fetchKdramaSchedule,
    search: searchKdramas,
    searchPlaceholder: 'Search K-dramas…',
    cacheKey: 'kdramaSchedule:v1',
    watchlistKeys: { ids: 'myKdramaWatchlist', meta: 'myKdramaWatchlistMeta' },
    showUrl: (id) => `https://www.tvmaze.com/shows/${id}`,
    // K-drama episodes typically run 60–80 minutes.
    airingWindowSeconds: 70 * 60,
    accent: {
      tab: 'bg-rose-600 text-white',
      tabSubtext: 'text-rose-100',
      todayRing: 'ring-rose-500/70',
      text: 'text-rose-400',
      card: 'from-rose-500/15 hover:border-rose-500/60 focus-visible:outline-rose-400',
      dot: 'bg-rose-400',
    },
  },
}

export const SOURCE_LIST = Object.values(SOURCES)
