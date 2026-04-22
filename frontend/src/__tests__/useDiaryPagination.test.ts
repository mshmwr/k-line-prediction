import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDiaryPagination, DIARY_INITIAL_PAGE_SIZE, DIARY_LOAD_MORE_STEP } from '../hooks/useDiaryPagination'
import type { DiaryEntry } from '../types/diary'

function mk(n: number): DiaryEntry[] {
  return Array.from({ length: n }, (_, i) => ({
    ticketId: `K-${String(i + 1).padStart(3, '0')}`,
    title: `t${i + 1}`,
    date: '2026-04-20',
    text: `text ${i + 1}`,
  }))
}

async function flushMicrotasks() {
  await new Promise<void>((r) => queueMicrotask(r))
}

describe('useDiaryPagination — AC-024-DIARY-PAGE-CURATION', () => {
  it('initial visible count = DIARY_INITIAL_PAGE_SIZE (5)', () => {
    const { result } = renderHook(() => useDiaryPagination(mk(12)))
    expect(result.current.visible).toHaveLength(DIARY_INITIAL_PAGE_SIZE)
    expect(result.current.visible).toHaveLength(5)
  })

  it('when total <= 5 → all visible, hasMore=false', () => {
    const { result } = renderHook(() => useDiaryPagination(mk(3)))
    expect(result.current.visible).toHaveLength(3)
    expect(result.current.hasMore).toBe(false)
    expect(result.current.canLoadMore).toBe(false)
  })

  it('when total = 5 exactly → 5 visible, no load-more', () => {
    const { result } = renderHook(() => useDiaryPagination(mk(5)))
    expect(result.current.visible).toHaveLength(5)
    expect(result.current.hasMore).toBe(false)
  })

  it('loadMore advances by +5 (step)', async () => {
    const { result } = renderHook(() => useDiaryPagination(mk(15)))
    expect(result.current.visible).toHaveLength(5)
    await act(async () => {
      result.current.loadMore()
      await flushMicrotasks()
    })
    expect(result.current.visible).toHaveLength(5 + DIARY_LOAD_MORE_STEP)
    expect(result.current.visible).toHaveLength(10)
    expect(result.current.hasMore).toBe(true)
  })

  it('loadMore caps at total (total = 11, load once → 10, load twice → 11)', async () => {
    const { result } = renderHook(() => useDiaryPagination(mk(11)))
    await act(async () => {
      result.current.loadMore()
      await flushMicrotasks()
    })
    expect(result.current.visible).toHaveLength(10)
    expect(result.current.hasMore).toBe(true)
    await act(async () => {
      result.current.loadMore()
      await flushMicrotasks()
    })
    expect(result.current.visible).toHaveLength(11)
    expect(result.current.hasMore).toBe(false)
  })

  it('rapid double-click advances by 5 not 10 (concurrency gate)', async () => {
    const { result } = renderHook(() => useDiaryPagination(mk(20)))
    // Two synchronous calls within one tick — second must be gated by inFlight.
    await act(async () => {
      result.current.loadMore()
      result.current.loadMore()
      await flushMicrotasks()
    })
    expect(result.current.visible).toHaveLength(10) // +5 once, not +10
  })

  it('canLoadMore reflects hasMore && !inFlight', () => {
    const { result: r1 } = renderHook(() => useDiaryPagination(mk(5)))
    expect(r1.current.canLoadMore).toBe(false) // hasMore=false

    const { result: r2 } = renderHook(() => useDiaryPagination(mk(10)))
    expect(r2.current.canLoadMore).toBe(true)
  })

  it('empty input → visible=[], hasMore=false, canLoadMore=false', () => {
    const { result } = renderHook(() => useDiaryPagination([]))
    expect(result.current.visible).toEqual([])
    expect(result.current.hasMore).toBe(false)
    expect(result.current.canLoadMore).toBe(false)
  })
})
