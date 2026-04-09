/** Converts "YYYY-MM-DD HH:MM" (UTC+0) to "YYYY-MM-DD HH:MM" (UTC+8) for display. */
export function toUTC8Display(utcStr: string): string {
  if (!utcStr) return utcStr
  const parts = utcStr.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
  if (!parts) return utcStr
  const [, y, mo, d, h, mi] = parts.map(Number)
  const ms = Date.UTC(y, mo - 1, d, h, mi) + 8 * 3600000
  const dt = new Date(ms)
  const year = dt.getUTCFullYear()
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dt.getUTCDate()).padStart(2, '0')
  const hour = String(dt.getUTCHours()).padStart(2, '0')
  const minute = String(dt.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

/** Converts "YYYY-MM-DD HH:MM" (UTC+8) to "YYYY-MM-DD HH:MM" (UTC+0) for internal storage. */
export function fromUTC8Input(utc8Str: string): string {
  if (!utc8Str) return utc8Str
  const parts = utc8Str.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/)
  if (!parts) return utc8Str
  const [, y, mo, d, h, mi] = parts.map(Number)
  const ms = Date.UTC(y, mo - 1, d, h, mi) - 8 * 3600000
  const dt = new Date(ms)
  const year = dt.getUTCFullYear()
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const day = String(dt.getUTCDate()).padStart(2, '0')
  const hour = String(dt.getUTCHours()).padStart(2, '0')
  const minute = String(dt.getUTCMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}
