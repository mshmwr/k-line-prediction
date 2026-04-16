import { useEffect } from 'react'
import type { DiaryMilestone } from '../types/diary'
import { useAsyncState } from '../hooks/useAsyncState'
import HeroSection from '../components/home/HeroSection'
import ProjectLogicSection from '../components/home/ProjectLogicSection'
import DevDiarySection from '../components/home/DevDiarySection'

export default function HomePage() {
  const [state, actions] = useAsyncState<DiaryMilestone[]>()

  useEffect(() => {
    actions.setLoading()
    fetch('/diary.json')
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load diary: ${res.status}`)
        return res.json() as Promise<DiaryMilestone[]>
      })
      .then(data => actions.setSuccess(data.slice(0, 3)))
      .catch((err: Error) => actions.setError(err.message))
  }, [])

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <HeroSection />
      <ProjectLogicSection />
      <DevDiarySection
        milestones={state.data ?? []}
        loading={state.status === 'loading'}
        error={state.error}
      />
    </div>
  )
}
