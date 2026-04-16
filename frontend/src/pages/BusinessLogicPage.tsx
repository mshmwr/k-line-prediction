import { useState, useEffect, useCallback } from 'react'
import LoadingSpinner from '../components/common/LoadingSpinner'
import PasswordForm from '../components/business-logic/PasswordForm'
import ErrorBanner from '../components/business-logic/ErrorBanner'
import BusinessLogicContent from '../components/business-logic/BusinessLogicContent'

type AuthState = 'SHOW_PASSWORD_FORM' | 'LOADING_CONTENT' | 'SHOW_CONTENT' | 'SHOW_ERROR'

const TOKEN_KEY = 'bl_token'

function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

function isTokenValid(token: string): boolean {
  const exp = getTokenExp(token)
  if (exp === null) return false
  return exp > Math.floor(Date.now() / 1000)
}

export default function BusinessLogicPage() {
  const [authState, setAuthState] = useState<AuthState>('SHOW_PASSWORD_FORM')
  const [content, setContent] = useState<string>('')
  const [errorMsg, setErrorMsg] = useState<string>('')
  const [expiredMessage, setExpiredMessage] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchContent = useCallback(async (token: string) => {
    setAuthState('LOADING_CONTENT')
    try {
      const res = await fetch('/api/business-logic', {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        setErrorMsg('Access denied. Token may be invalid.')
        setAuthState('SHOW_ERROR')
        return
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json() as { content: string }
      setContent(data.content)
      setAuthState('SHOW_CONTENT')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrorMsg(msg)
      setAuthState('SHOW_ERROR')
    }
  }, [])

  // On mount: check existing token
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) return
    if (!isTokenValid(token)) {
      localStorage.removeItem(TOKEN_KEY)
      setExpiredMessage('Your session has expired. Please enter the password again.')
      setAuthState('SHOW_PASSWORD_FORM')
      return
    }
    fetchContent(token)
  }, [fetchContent])

  const handlePasswordSubmit = async (password: string) => {
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.status === 401) {
        setErrorMsg('Incorrect password.')
        setAuthState('SHOW_ERROR')
        return
      }
      if (!res.ok) throw new Error(`Server error: ${res.status}`)
      const data = await res.json() as { token: string }
      localStorage.setItem(TOKEN_KEY, data.token)
      setExpiredMessage('')
      await fetchContent(data.token)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setErrorMsg(msg)
      setAuthState('SHOW_ERROR')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => {
    setErrorMsg('')
    setAuthState('SHOW_PASSWORD_FORM')
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col items-center justify-center px-6 py-16">
      <h1 className="text-3xl font-mono font-bold mb-2">Business Logic</h1>
      <p className="text-gray-400 text-sm mb-10 text-center max-w-sm">
        This section is password-protected. It contains proprietary trading logic.
      </p>

      {authState === 'SHOW_PASSWORD_FORM' && (
        <PasswordForm
          onSubmit={handlePasswordSubmit}
          isLoading={isSubmitting}
          expiredMessage={expiredMessage || undefined}
        />
      )}

      {authState === 'LOADING_CONTENT' && (
        <LoadingSpinner size="lg" />
      )}

      {authState === 'SHOW_ERROR' && (
        <ErrorBanner message={errorMsg} onRetry={handleRetry} />
      )}

      {authState === 'SHOW_CONTENT' && (
        <BusinessLogicContent markdown={content} />
      )}
    </div>
  )
}
