import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { trackPageview } from '../utils/analytics'

const PAGE_TITLES: Record<string, string> = {
  '/': 'K-Line Prediction — Home',
  '/app': 'K-Line Prediction — App',
  '/about': 'K-Line Prediction — About',
  '/diary': 'K-Line Prediction — Dev Diary',
  '/business-logic': 'K-Line Prediction — Business Logic',
}

export function useGAPageview(): void {
  const location = useLocation()
  useEffect(() => {
    const title = PAGE_TITLES[location.pathname] ?? document.title
    trackPageview(location.pathname, title)
  }, [location.pathname])
}
