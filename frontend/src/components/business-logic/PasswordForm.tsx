import { useState, FormEvent } from 'react'

interface PasswordFormProps {
  onSubmit: (password: string) => Promise<void>
  isLoading: boolean
  expiredMessage?: string
}

export default function PasswordForm({ onSubmit, isLoading, expiredMessage }: PasswordFormProps) {
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    await onSubmit(password)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm w-full">
      {expiredMessage && (
        <p className="text-yellow-400 text-sm border border-yellow-400/30 px-3 py-2 rounded-sm">
          {expiredMessage}
        </p>
      )}
      <label className="text-muted text-[18px] font-mono font-bold">Password</label>
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        className="bg-paper border border-ink/20 text-ink px-4 py-2 font-mono text-sm focus:outline-none focus:border-purple-500"
        placeholder="Enter access password"
        disabled={isLoading}
        required
      />
      <button
        type="submit"
        disabled={isLoading || !password}
        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-mono text-sm px-6 py-2 transition-colors"
      >
        {isLoading ? 'Verifying…' : 'Submit'}
      </button>
    </form>
  )
}
