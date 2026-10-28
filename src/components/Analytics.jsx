import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// SPA（HashRouter）換頁時送出 GA4 page_view
export default function Analytics() {
  const location = useLocation()

  useEffect(() => {
    if (typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      page_title: document.title,
    })
  }, [location])

  return null
}
