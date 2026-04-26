import React, { Suspense, lazy } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import RouteSuspense from './components/RouteSuspense'
import { initGA } from './utils/analytics'
import { useGAPageview } from './hooks/useGAPageview'
import { ScrollToTop } from './components/ScrollToTop'
import './index.css'

// K-049 Phase 3: route-level code splitting. Each page lands in its own
// Rollup chunk; useGAPageview (mounted once inside BrowserRouter) continues
// to drive GA page_view via the static PAGE_TITLES map — the map is keyed
// by location.pathname, so titles resolve synchronously and never race the
// chunk-load boundary (architect brief §1.3 Claim E + §9).
const AppPage = lazy(() => import('./AppPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const DiaryPage = lazy(() => import('./pages/DiaryPage'))
const BusinessLogicPage = lazy(() => import('./pages/BusinessLogicPage'))

initGA()

function GATracker() {
  useGAPageview()
  return null
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <GATracker />
        <ScrollToTop />
        <Suspense fallback={<RouteSuspense />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/app" element={<AppPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/diary" element={<DiaryPage />} />
            <Route path="/business-logic" element={<BusinessLogicPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
