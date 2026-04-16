import { useState } from 'react'

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  error: string | null
}

interface AsyncActions<T> {
  setLoading: () => void
  setSuccess: (data: T) => void
  setError: (error: string) => void
  reset: () => void
}

const initialState = <T>(): AsyncState<T> => ({
  status: 'idle',
  data: null,
  error: null,
})

export function useAsyncState<T>(): [AsyncState<T>, AsyncActions<T>] {
  const [state, setState] = useState<AsyncState<T>>(initialState<T>)

  const actions: AsyncActions<T> = {
    setLoading: () => setState({ status: 'loading', data: null, error: null }),
    setSuccess: (data: T) => setState({ status: 'success', data, error: null }),
    setError: (error: string) => setState({ status: 'error', data: null, error }),
    reset: () => setState(initialState<T>()),
  }

  return [state, actions]
}
