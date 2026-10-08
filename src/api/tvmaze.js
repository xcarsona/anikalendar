const TVMAZE_URL = 'https://api.tvmaze.com'
const MAX_ATTEMPTS = 3
// TVmaze allows roughly 20 requests per 10 seconds per IP; keep a few in flight at most.
const CONCURRENCY = 3
const LIVE_STATUSES = { Running: 'Airing', 'In Development': 'Upcoming', 'To Be Determined': 'TBD' }

export class TvmazeError extends Error {
  constructor(message, { status = null, retryAfterMs = null, cause } = {}) {
    super(message, { cause })
    this.name = 'TvmazeError'
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// After a 429, hold every request until the window has had time to reset.
let blockedUntil = 0

/**
 * GET a TVmaze endpoint. Retries 429s (TVmaze sends no Retry-After), network
 * errors and 5xx with backoff. With `maxAttempts: 1` it fails fast instead,
 * including while a previous 429 is cooling down.
 */
export async function tvmazeGet(path, { signal, onRetry, maxAttempts = MAX_ATTEMPTS } = {}) {
  if (Date.now() < blockedUntil) {
    const retryAfterMs = blockedUntil - Date.now()
    if (maxAttempts === 1) throw new TvmazeError('Rate limited by TVmaze', { status: 429, retryAfterMs })
    await sleep(retryAfterMs)
  }

  for (let attempt = 1; ; attempt++) {
    const isLastAttempt = attempt >= maxAttempts
    let res
    try {
      res = await fetch(TVMAZE_URL + path, { signal, headers: { Accept: 'application/json' } })
    } catch (cause) {
      if (signal?.aborted) throw cause
      if (isLastAttempt) throw new TvmazeError('Network error', { cause })
      const waitMs = 3000 * 2 ** (attempt - 1)
      onRetry?.({ reason: 'network', waitMs, attempt })
      await sleep(waitMs)
      continue
    }

    if (res.status === 429) {
      const waitMs = 5000 * 2 ** (attempt - 1)
      blockedUntil = Math.max(blockedUntil, Date.now() + waitMs)
      if (isLastAttempt) throw new TvmazeError('Rate limited by TVmaze', { status: 429, retryAfterMs: waitMs })
      onRetry?.({ reason: 'rate-limit', waitMs, attempt })
      await sleep(waitMs)
      continue
    }

    if (res.status >= 500 && !isLastAttempt) {
      const waitMs = 3000 * 2 ** (attempt - 1)
      onRetry?.({ reason: 'server', waitMs, attempt })
      await sleep(waitMs)
      continue
    }

    if (!res.ok) throw new TvmazeError(`HTTP ${res.status}`, { status: res.status })
    return res.json()
  }
}

/** Run `fn` over `items` with at most `limit` calls in flight; results keep input order. */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

const isKdrama = (show) => show?.language === 'Korean' && show.type === 'Scripted'
const channelName = (show) => show.network?.name ?? show.webChannel?.name ?? null
const toUnixSeconds = (iso) => Math.floor(Date.parse(iso) / 1000)

function localDate(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/**
 * Fetch Korean scripted episodes with start <= airingAt < end (unix seconds)
 * from TVmaze's Korean broadcast schedule and its worldwide streaming
 * schedule (Netflix, TVING, YouTube, ...).
 *
 * Episodes of one show released together (a Netflix-style batch drop) are
 * merged into a single entry with `episodeEnd` set. `approximateTime` is true
 * when TVmaze only knows the date and filled in a placeholder time.
 */
export async function fetchKdramaSchedule({ start, end, onRetry }) {
  // The `date` parameter is a calendar date in the network's time zone
  // (Asia/Seoul for broadcast), which can be a day either side of the
  // viewer's. Fetch one extra date on each side and filter by timestamp.
  const dates = []
  for (let d = new Date((start - 86400) * 1000); d.getTime() / 1000 < end + 86400; d.setDate(d.getDate() + 1)) {
    dates.push(localDate(d))
  }
  const paths = dates.flatMap((date) => [`/schedule?country=KR&date=${date}`, `/schedule/web?date=${date}`])
  const lists = await mapLimit(paths, CONCURRENCY, (path) => tvmazeGet(path, { onRetry }))

  // The same episode can appear in both lists (e.g. TVING); key by episode id.
  const byId = new Map()
  for (const list of lists) {
    for (const ep of list) {
      const show = ep.show ?? ep._embedded?.show
      if (!isKdrama(show) || !ep.airstamp) continue
      const airingAt = toUnixSeconds(ep.airstamp)
      if (airingAt >= start && airingAt < end) byId.set(ep.id, { ep, show, airingAt })
    }
  }

  const drops = new Map()
  for (const item of byId.values()) {
    const key = `${item.show.id}:${item.airingAt}`
    if (!drops.has(key)) drops.set(key, [])
    drops.get(key).push(item)
  }

  return [...drops.values()]
    .map((items) => {
      items.sort((a, b) => (a.ep.number ?? 0) - (b.ep.number ?? 0))
      const { ep, show, airingAt } = items[0]
      const last = items.at(-1).ep
      return {
        scheduleId: ep.id,
        mediaId: show.id,
        episode: ep.number,
        episodeEnd: items.length > 1 && last.number !== ep.number ? last.number : null,
        season: ep.season,
        airingAt,
        approximateTime: !ep.airtime,
        title: show.name,
        coverImage: show.image?.medium ?? null,
        siteUrl: show.url,
        format: channelName(show),
        isAdult: false,
      }
    })
    .sort((a, b) => a.airingAt - b.airingAt || a.title.localeCompare(b.title))
}

/**
 * Search Korean dramas that are airing or upcoming. Fails fast on rate limits.
 * Results match the anime search shape:
 * { mediaId, title, coverImage, siteUrl, details, nextEpisode }.
 */
export async function searchKdramas(term, { signal } = {}) {
  const results = await tvmazeGet(`/search/shows?q=${encodeURIComponent(term)}`, {
    signal,
    maxAttempts: 1,
  })
  const shows = results.map((r) => r.show).filter((show) => isKdrama(show) && show.status in LIVE_STATUSES)

  return mapLimit(shows, CONCURRENCY, async (show) => {
    let nextEpisode = null
    const href = show._links?.nextepisode?.href
    if (href) {
      try {
        const ep = await tvmazeGet(new URL(href).pathname, { signal, maxAttempts: 1 })
        if (ep.airstamp) nextEpisode = { airingAt: toUnixSeconds(ep.airstamp), episode: ep.number }
      } catch (err) {
        if (signal?.aborted) throw err
        // Show the result without a next episode rather than failing the search.
      }
    }
    return {
      mediaId: show.id,
      title: show.name,
      coverImage: show.image?.medium ?? null,
      siteUrl: show.url,
      details: [channelName(show), LIVE_STATUSES[show.status]].filter(Boolean),
      nextEpisode,
    }
  })
}
