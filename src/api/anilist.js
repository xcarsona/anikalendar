const ANILIST_URL = 'https://graphql.anilist.co'
const MAX_ATTEMPTS = 3
// Safety valve so a misbehaving `hasNextPage` can't loop forever.
const MAX_PAGES = 20

const SCHEDULE_QUERY = `
  query ($page: Int, $start: Int, $end: Int) {
    Page(page: $page, perPage: 50) {
      pageInfo { hasNextPage }
      airingSchedules(airingAt_greater: $start, airingAt_lesser: $end, sort: TIME) {
        id
        airingAt
        episode
        media {
          id
          title { romaji english }
          coverImage { large }
          siteUrl
          format
          isAdult
        }
      }
    }
  }
`

export class AniListError extends Error {
  constructor(message, { status = null, retryAfterMs = null, cause } = {}) {
    super(message, { cause })
    this.name = 'AniListError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }

  get isRateLimit() {
    return this.status === 429
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Shared by every caller: after a 429, nothing is sent until the limit resets.
let blockedUntil = 0

// AniList's CORS config exposes X-RateLimit-Reset but not Retry-After, so in
// the browser the reset timestamp is usually the only hint we get.
function rateLimitWaitMs(res, attempt) {
  const retryAfter = Number(res.headers.get('Retry-After'))
  if (retryAfter > 0) return retryAfter * 1000
  const reset = Number(res.headers.get('X-RateLimit-Reset'))
  if (reset > 0) return Math.max(1000, reset * 1000 - Date.now() + 1000)
  return 60_000 * attempt
}

/**
 * POST a GraphQL query. Retries rate limits (waiting until the limit resets),
 * network failures, and 5xx responses, up to `maxAttempts` tries in total.
 * `onRetry` is called with { reason, waitMs, attempt } before each wait.
 * Pass `maxAttempts: 1` to fail fast, and `signal` to cancel the request.
 */
export async function anilistRequest(
  query,
  variables,
  { onRetry, signal, maxAttempts = MAX_ATTEMPTS } = {},
) {
  if (Date.now() < blockedUntil) {
    throw new AniListError('Rate limited by AniList', {
      status: 429,
      retryAfterMs: blockedUntil - Date.now(),
    })
  }

  for (let attempt = 1; ; attempt++) {
    const isLastAttempt = attempt >= maxAttempts
    let res
    try {
      res = await fetch(ANILIST_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables }),
        signal,
      })
    } catch (cause) {
      if (signal?.aborted) throw cause
      // Also lands here when a 429 comes back without CORS headers.
      if (isLastAttempt) throw new AniListError('Network error', { cause })
      const waitMs = 5000 * 3 ** (attempt - 1)
      onRetry?.({ reason: 'network', waitMs, attempt })
      await sleep(waitMs)
      continue
    }

    if (res.status === 429) {
      const waitMs = rateLimitWaitMs(res, attempt)
      blockedUntil = Math.max(blockedUntil, Date.now() + waitMs)
      if (isLastAttempt) {
        throw new AniListError('Rate limited by AniList', { status: 429, retryAfterMs: waitMs })
      }
      onRetry?.({ reason: 'rate-limit', waitMs, attempt })
      await sleep(waitMs)
      continue
    }

    if (res.status >= 500 && !isLastAttempt) {
      const waitMs = 5000 * 3 ** (attempt - 1)
      onRetry?.({ reason: 'server', waitMs, attempt })
      await sleep(waitMs)
      continue
    }

    let json = null
    try {
      json = await res.json()
    } catch {
      // Non-JSON body; handled below.
    }
    if (!res.ok || !json || json.errors) {
      const message = json?.errors?.[0]?.message ?? `HTTP ${res.status}`
      throw new AniListError(message, { status: res.status })
    }
    return json.data
  }
}

/** Convert an AniList airingSchedule node into the app's episode shape. */
export function normalizeSchedule(node) {
  const { media } = node
  return {
    scheduleId: node.id,
    mediaId: media.id,
    episode: node.episode,
    airingAt: node.airingAt,
    title: media.title.english ?? media.title.romaji,
    coverImage: media.coverImage?.large ?? null,
    siteUrl: media.siteUrl,
    format: media.format,
    isAdult: media.isAdult,
  }
}

/**
 * Fetch every airing episode with start <= airingAt < end (unix seconds),
 * following pagination, with adult titles removed.
 */
export async function fetchSchedule({ start, end, onRetry }) {
  const episodes = []
  const seen = new Set()

  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await anilistRequest(
      SCHEDULE_QUERY,
      // airingAt_greater is exclusive; subtract 1 so an episode at exactly
      // midnight is included.
      { page, start: start - 1, end },
      { onRetry },
    )
    const { pageInfo, airingSchedules } = data.Page

    for (const node of airingSchedules) {
      // Entries can shift between pages if the schedule changes mid-fetch.
      if (!node.media || node.media.isAdult || seen.has(node.id)) continue
      seen.add(node.id)
      episodes.push(normalizeSchedule(node))
    }

    if (!pageInfo.hasNextPage) break
  }

  return episodes
}

const SEARCH_QUERY = `
  query ($search: String) {
    Page(perPage: 10) {
      media(
        search: $search
        type: ANIME
        status_in: [RELEASING, NOT_YET_RELEASED]
        isAdult: false
        sort: SEARCH_MATCH
      ) {
        id
        title { romaji english }
        coverImage { large }
        siteUrl
        format
        status
        nextAiringEpisode { airingAt episode }
      }
    }
  }
`

/**
 * Search airing and upcoming anime by title. Fails fast on rate limits rather
 * than retrying, since the user is waiting on it. Results look like
 * { mediaId, title, coverImage, siteUrl, format, status, nextEpisode }, where
 * nextEpisode is { airingAt, episode } or null.
 */
export async function searchAnime(term, { signal } = {}) {
  const data = await anilistRequest(SEARCH_QUERY, { search: term }, { signal, maxAttempts: 1 })
  return data.Page.media.map((media) => ({
    mediaId: media.id,
    title: media.title.english ?? media.title.romaji,
    coverImage: media.coverImage?.large ?? null,
    siteUrl: media.siteUrl,
    format: media.format,
    status: media.status,
    nextEpisode: media.nextAiringEpisode,
  }))
}
