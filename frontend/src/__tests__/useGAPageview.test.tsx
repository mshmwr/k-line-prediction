import { renderHook } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import type { ReactNode } from 'react'
import { useGAPageview } from '../hooks/useGAPageview'
import * as analytics from '../utils/analytics'

// AC-081-GA-PAGEVIEW — useGAPageview must fire with correct title for /backtest

describe('AC-081-GA-PAGEVIEW — useGAPageview /backtest entry', () => {
  beforeEach(() => {
    vi.spyOn(analytics, 'trackPageview').mockImplementation(() => {})
  })

  it('fires trackPageview with "K-Line Prediction — Backtest" when on /backtest', () => {
    renderHook(() => useGAPageview(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={['/backtest']}>
          <Routes>
            <Route path="*" element={<>{children}</>} />
          </Routes>
        </MemoryRouter>
      ),
    })
    expect(analytics.trackPageview).toHaveBeenCalledWith(
      '/backtest',
      'K-Line Prediction — Backtest'
    )
    expect(analytics.trackPageview).toHaveBeenCalledTimes(1)
  })
})
