import { navigate } from '../router'

/** <a> that navigates in-app on a plain left click and behaves normally otherwise. */
export default function Link({ to, onClick, ...props }) {
  return (
    <a
      href={to}
      {...props}
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        event.preventDefault()
        navigate(to)
      }}
    />
  )
}
