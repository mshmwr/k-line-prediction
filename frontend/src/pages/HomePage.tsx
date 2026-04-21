import { useDiary } from '../hooks/useDiary'
import HeroSection from '../components/home/HeroSection'
import ProjectLogicSection from '../components/home/ProjectLogicSection'
import DevDiarySection from '../components/home/DevDiarySection'
import BuiltByAIBanner from '../components/home/BuiltByAIBanner'
import HomeFooterBar from '../components/home/HomeFooterBar'
import UnifiedNavBar from '../components/UnifiedNavBar'

export default function HomePage() {
  const { entries, loading, error } = useDiary(3)

  return (
    <div className="min-h-screen pt-8 pb-8 px-6 sm:pt-[72px] sm:pr-[96px] sm:pb-[96px] sm:pl-[96px]" data-testid="homepage-root">
      <UnifiedNavBar />
      <BuiltByAIBanner />
      <HeroSection />
      <ProjectLogicSection />
      <DevDiarySection
        milestones={entries}
        loading={loading}
        error={error}
      />
      <HomeFooterBar />
    </div>
  )
}
