import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import AppPage from './AppPage'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import DiaryPage from './pages/DiaryPage'
import BusinessLogicPage from './pages/BusinessLogicPage'
import { initGA } from './utils/analytics'
import { useGAPageview } from './hooks/useGAPageview'
import './index.css'

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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app" element={<AppPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/business-logic" element={<BusinessLogicPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
