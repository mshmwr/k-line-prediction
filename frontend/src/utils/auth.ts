export const TOKEN_KEY = 'bl_token'

function getTokenExp(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp : null
  } catch {
    return null
  }
}

export function isTokenValid(token: string): boolean {
  const exp = getTokenExp(token)
  if (exp === null) return false
  return exp > Math.floor(Date.now() / 1000)
}

export function isLoggedIn(): boolean {
  const token = localStorage.getItem(TOKEN_KEY)
  if (!token) return false
  return isTokenValid(token)
}
