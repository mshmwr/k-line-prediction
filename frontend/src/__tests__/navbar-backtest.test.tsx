import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import UnifiedNavBar from '../components/UnifiedNavBar'

// AC-081-NAVBAR-ENTRY — Backtest link present between Diary and About
// All assertions scoped to navbar-desktop to avoid duplicate-link errors
// (desktop + mobile both render the links; getByRole without scope throws multiple-elements error)

describe('AC-081-NAVBAR-ENTRY — UnifiedNavBar Backtest entry', () => {
  it('renders Backtest link that navigates to /backtest (desktop nav)', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <UnifiedNavBar />
      </MemoryRouter>
    )
    const navDesktop = screen.getByTestId('navbar-desktop')
    const backtestLink = within(navDesktop).getByRole('link', { name: 'Backtest' })
    expect(backtestLink).toBeTruthy()
    expect(backtestLink.getAttribute('href')).toBe('/backtest')
  })

  it('positions Backtest between Diary and About in the visible links', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <UnifiedNavBar />
      </MemoryRouter>
    )
    const navDesktop = screen.getByTestId('navbar-desktop')
    const links = Array.from(navDesktop.querySelectorAll('a'))
    const labels = links.map(l => l.textContent?.trim())
    const diaryIdx = labels.indexOf('Diary')
    const backtestIdx = labels.indexOf('Backtest')
    const aboutIdx = labels.indexOf('About')
    expect(diaryIdx).toBeLessThan(backtestIdx)
    expect(backtestIdx).toBeLessThan(aboutIdx)
  })

  it('applies aria-current="page" when pathname is /backtest (desktop nav)', () => {
    render(
      <MemoryRouter initialEntries={['/backtest']}>
        <UnifiedNavBar />
      </MemoryRouter>
    )
    const navDesktop = screen.getByTestId('navbar-desktop')
    const backtestLink = within(navDesktop).getByRole('link', { name: 'Backtest' })
    expect(backtestLink.getAttribute('aria-current')).toBe('page')
    expect(backtestLink.className).toContain('text-brick-dark')
  })
})
