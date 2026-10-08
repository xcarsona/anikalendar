import { useEffect, useState } from 'react'
import WatchlistBackup from './components/WatchlistBackup'
import LandingPage from './pages/LandingPage'
import SchedulePage from './pages/SchedulePage'
import { usePath } from './router'
import { SOURCE_LIST } from './sources'
import { clearBackupHash, readBackupFromHash } from './storage/backup'

const FOCUS_MODE_KEY = 'focusMode'

function readFocusMode() {
  try {
    return localStorage.getItem(FOCUS_MODE_KEY) === 'true'
  } catch {
    return false
  }
}

function App() {
  const path = usePath()
  const source = SOURCE_LIST.find((s) => s.path === path) ?? null

  const [focusMode, setFocusMode] = useState(readFocusMode)
  useEffect(() => {
    try {
      localStorage.setItem(FOCUS_MODE_KEY, String(focusMode))
    } catch {
      // Not remembered across reloads; still works for this session.
    }
  }, [focusMode])

  // Opening a backup link (/#backup=AK1...) starts with the restore dialog open.
  const [backup, setBackup] = useState(() => {
    const code = readBackupFromHash()
    return { open: code !== null, initialCode: code ?? '' }
  })
  useEffect(() => {
    if (readBackupFromHash() !== null) clearBackupHash()
  }, [])
  const openBackup = () => setBackup((b) => ({ ...b, open: true }))

  // Unknown paths show the landing page; tidy the URL to match.
  useEffect(() => {
    if (!source && path !== '/') window.history.replaceState(null, '', '/')
  }, [source, path])

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only rounded-md bg-violet-600 px-3 py-2 text-sm font-medium text-white focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-30"
      >
        Skip to content
      </a>

      {source ? (
        <SchedulePage
          key={source.id}
          source={source}
          focusMode={focusMode}
          onToggleFocus={() => setFocusMode((on) => !on)}
          onOpenBackup={openBackup}
        />
      ) : (
        <LandingPage onOpenBackup={openBackup} />
      )}

      <WatchlistBackup
        open={backup.open}
        initialCode={backup.initialCode}
        onClose={() => setBackup({ open: false, initialCode: '' })}
      />
    </div>
  )
}

export default App
