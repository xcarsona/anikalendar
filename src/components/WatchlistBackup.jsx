import { useEffect, useId, useRef, useState } from 'react'
import { SOURCE_LIST } from '../sources'
import { applyBackup, backupLink, countShows, exportBackup, parseBackup } from '../storage/backup'
import { readWatchlist } from '../storage/watchlists'

function summarize(counts) {
  const parts = SOURCE_LIST.filter((s) => counts[s.id] > 0).map(
    (s) => `${counts[s.id]} ${s.name.toLowerCase()} ${counts[s.id] === 1 ? 'show' : 'shows'}`,
  )
  return parts.length ? parts.join(' and ') : 'no shows'
}

/**
 * Modal for copying a backup code/link and restoring from one. Watchlists
 * only live in this browser, so this is how they move between devices.
 */
export default function WatchlistBackup({ open, initialCode = '', onClose }) {
  const dialogRef = useRef(null)
  const codeRef = useRef(null)
  const id = useId()
  const [input, setInput] = useState(initialCode)
  const [copyStatus, setCopyStatus] = useState('')
  const [importStatus, setImportStatus] = useState('')
  const [confirmReplace, setConfirmReplace] = useState(false)
  // Bumped after an import so the render below re-reads storage.
  const [, setVersion] = useState(0)

  useEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const code = open ? exportBackup() : ''
  const currentCounts = countShows(
    Object.fromEntries(SOURCE_LIST.map((s) => [s.id, readWatchlist(s.watchlistKeys)])),
  )

  let parsed = null
  let parseError = ''
  if (input.trim()) {
    try {
      parsed = parseBackup(input)
    } catch (err) {
      parseError = err.message
    }
  }
  const incomingCounts = parsed ? countShows(parsed) : null
  const currentTotal = Object.values(currentCounts).reduce((a, b) => a + b, 0)

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text)
      setCopyStatus(`${what} copied.`)
    } catch {
      codeRef.current?.select()
      setCopyStatus('Copying was blocked. The code is selected; press Ctrl+C (or ⌘C) to copy it.')
    }
  }

  function restore(mode) {
    if (!parsed) return
    if (mode === 'replace' && !confirmReplace && currentTotal > 0) {
      setConfirmReplace(true)
      return
    }
    const added = applyBackup(parsed, mode)
    setVersion((v) => v + 1)
    setConfirmReplace(false)
    setInput('')
    setImportStatus(
      mode === 'replace'
        ? `Done. Your lists now match the backup (${summarize(incomingCounts)}).`
        : `Done. Added ${added} new ${added === 1 ? 'show' : 'shows'}.`,
    )
  }

  const buttonClass =
    'rounded-lg px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-50'

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={`${id}-title`}
      onClose={() => {
        setCopyStatus('')
        setImportStatus('')
        setConfirmReplace(false)
        onClose()
      }}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-0 text-slate-100 shadow-2xl backdrop:bg-black/70"
    >
      <div className="space-y-6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id={`${id}-title`} className="text-lg font-semibold">
              Back up or move your watchlists
            </h2>
            <p className="mt-1 text-sm text-slate-300">
              Your lists are saved in this browser, so there's no account. To use them on another
              device or browser, copy your code there and paste it under “Restore”.
            </p>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current.close()}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:outline-2 focus-visible:outline-violet-400"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <section className="space-y-2">
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">Your backup code</h3>
          <p className="text-sm text-slate-300">This code holds {summarize(currentCounts)}.</p>
          <label htmlFor={`${id}-code`} className="sr-only">
            Backup code
          </label>
          <textarea
            id={`${id}-code`}
            ref={codeRef}
            readOnly
            value={code}
            rows={3}
            onFocus={(e) => e.target.select()}
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-xs break-all text-slate-300"
          />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => copy(code, 'Code')} className={`${buttonClass} bg-violet-600 text-white hover:bg-violet-500`}>
              Copy code
            </button>
            <button type="button" onClick={() => copy(backupLink(code), 'Link')} className={`${buttonClass} border border-slate-700 text-slate-200 hover:bg-slate-800`}>
              Copy link
            </button>
          </div>
          <p aria-live="polite" className="min-h-5 text-sm text-emerald-300">
            {copyStatus}
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-medium uppercase tracking-wide text-slate-400">Restore</h3>
          <label htmlFor={`${id}-input`} className="block text-sm text-slate-300">
            Paste a backup code or link
          </label>
          <textarea
            id={`${id}-input`}
            value={input}
            rows={3}
            onChange={(e) => {
              setInput(e.target.value)
              setConfirmReplace(false)
              setImportStatus('')
            }}
            placeholder="AK1.…"
            className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 p-2 font-mono text-xs break-all placeholder:text-slate-400 focus:border-violet-500 focus:outline-none"
          />
          <p aria-live="polite" className={`min-h-5 text-sm ${parseError ? 'text-amber-300' : 'text-slate-300'}`}>
            {parseError || (incomingCounts && `This backup has ${summarize(incomingCounts)}.`)}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!parsed}
              onClick={() => restore('merge')}
              className={`${buttonClass} bg-violet-600 text-white hover:bg-violet-500`}
            >
              Add to my lists
            </button>
            <button
              type="button"
              disabled={!parsed}
              onClick={() => restore('replace')}
              className={`${buttonClass} border ${
                confirmReplace
                  ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                  : 'border-slate-700 text-slate-200 hover:bg-slate-800'
              }`}
            >
              {confirmReplace ? `Replace my ${currentTotal} shows?` : 'Replace my lists'}
            </button>
          </div>
          <p aria-live="polite" className="min-h-5 text-sm text-emerald-300">
            {importStatus}
          </p>
        </section>
      </div>
    </dialog>
  )
}
