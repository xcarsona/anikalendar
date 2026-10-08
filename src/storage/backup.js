import { SOURCE_LIST } from '../sources'
import { notifyWatchlistChange, readWatchlist, writeWatchlist } from './watchlists'

// A backup code is every section's watchlist as base64url JSON with a version
// prefix: "AK1." + base64url({ v: 1, lists: { anime: { ids, meta }, ... } }).
// It's only as private as wherever you paste it; it holds show ids and titles.

const PREFIX = 'AK1.'
const HASH_PARAM = '#backup='

function toBase64Url(text) {
  let binary = ''
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code) {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64 + '==='.slice((base64.length + 3) % 4))
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)))
}

const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value)

export function exportBackup() {
  const lists = {}
  for (const source of SOURCE_LIST) lists[source.id] = readWatchlist(source.watchlistKeys)
  return PREFIX + toBase64Url(JSON.stringify({ v: 1, lists }))
}

export function backupLink(code) {
  return `${window.location.origin}/${HASH_PARAM}${code}`
}

/** A backup code from the current URL's hash, if the page was opened from a backup link. */
export function readBackupFromHash() {
  const { hash } = window.location
  return hash.startsWith(HASH_PARAM) ? hash.slice(HASH_PARAM.length) : null
}

export function clearBackupHash() {
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

/**
 * Parse a pasted code or link into { [sourceId]: { ids, meta } }, keeping only
 * well-formed entries. Throws an Error with a readable message if it isn't a
 * backup code.
 */
export function parseBackup(input) {
  let code = input.trim()
  const hashAt = code.indexOf(HASH_PARAM)
  if (hashAt !== -1) code = code.slice(hashAt + HASH_PARAM.length)
  if (!code.startsWith(PREFIX)) throw new Error("That doesn't look like a backup code.")

  let data
  try {
    data = JSON.parse(fromBase64Url(code.slice(PREFIX.length)))
  } catch {
    throw new Error('That backup code is incomplete or damaged. Try copying it again.')
  }
  if (data?.v !== 1 || typeof data.lists !== 'object' || data.lists === null) {
    throw new Error('That backup code is from an unsupported version.')
  }

  const result = {}
  for (const source of SOURCE_LIST) {
    const list = data.lists[source.id] ?? {}
    const ids = [...new Set(Array.isArray(list.ids) ? list.ids.filter(Number.isInteger) : [])]
    const meta = {}
    for (const id of ids) {
      const entry = list.meta?.[id]
      if (!entry || typeof entry !== 'object') continue
      meta[id] = {
        title: typeof entry.title === 'string' ? entry.title.slice(0, 300) : undefined,
        coverImage: isHttpUrl(entry.coverImage) ? entry.coverImage : null,
        // Never trust a pasted link target; only plain web URLs are kept.
        siteUrl: isHttpUrl(entry.siteUrl) ? entry.siteUrl : source.showUrl(id),
      }
    }
    result[source.id] = { ids, meta }
  }
  return result
}

/** Count of shows per section, e.g. { anime: 3, kdrama: 1 }. */
export function countShows(lists) {
  return Object.fromEntries(SOURCE_LIST.map((s) => [s.id, lists[s.id]?.ids.length ?? 0]))
}

/**
 * Apply parsed lists. "merge" adds shows that aren't already pinned; "replace"
 * swaps each section's list for the backup's. Returns how many shows were added.
 */
export function applyBackup(lists, mode) {
  let added = 0
  for (const source of SOURCE_LIST) {
    const incoming = lists[source.id]
    const current = readWatchlist(source.watchlistKeys)
    let next
    if (mode === 'replace') {
      next = incoming
      added += incoming.ids.filter((id) => !current.ids.includes(id)).length
    } else {
      const newIds = incoming.ids.filter((id) => !current.ids.includes(id))
      const newMeta = Object.fromEntries(newIds.filter((id) => incoming.meta[id]).map((id) => [id, incoming.meta[id]]))
      next = { ids: [...current.ids, ...newIds], meta: { ...current.meta, ...newMeta } }
      added += newIds.length
    }
    writeWatchlist(source.watchlistKeys, next)
  }
  notifyWatchlistChange()
  return added
}
