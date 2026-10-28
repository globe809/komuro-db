import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Lists restore themselves after their asynchronous data and year groups are ready.
export default function BrowseScroll() {
  const { pathname, search } = useLocation()
  useLayoutEffect(() => {
    const previous = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    return () => { window.history.scrollRestoration = previous }
  }, [pathname, search])
  return null
}
