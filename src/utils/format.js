const FORMAT_LABELS = { TV_SHORT: 'TV Short', MOVIE: 'Movie', SPECIAL: 'Special', MUSIC: 'Music' }

/** Readable AniList format ("TV Short"); other values (e.g. "Netflix") pass through. */
export function formatLabel(format) {
  return FORMAT_LABELS[format] ?? format
}

/**
 * "Episode 5", "Episodes 1–12", "S2 · Episode 3", or "Special" when there's
 * no number. `short` gives "Ep 5" / "Eps 1–12".
 */
export function episodeLabel({ episode, episodeEnd, season }, { short = false } = {}) {
  if (episode == null) return 'Special'
  const range = episodeEnd ? `${episode}–${episodeEnd}` : `${episode}`
  const noun = short ? (episodeEnd ? 'Eps' : 'Ep') : episodeEnd ? 'Episodes' : 'Episode'
  return `${season > 1 ? `S${season} · ` : ''}${noun} ${range}`
}
