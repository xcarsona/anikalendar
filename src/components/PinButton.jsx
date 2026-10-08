/** Star toggle for pinning a show to the watchlist. */
export default function PinButton({ pinned, title, onToggle, className = '' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={pinned}
      aria-label={pinned ? `Unpin ${title}` : `Pin ${title} to watchlist`}
      title={pinned ? 'Unpin' : 'Pin to watchlist'}
      className={`rounded-md p-1 transition-colors focus-visible:outline-2 focus-visible:outline-violet-400 ${
        pinned ? 'text-amber-400 hover:text-amber-300' : 'text-slate-500 hover:text-slate-200'
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="size-5"
        fill={pinned ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      >
        <path d="M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" />
      </svg>
    </button>
  )
}
