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
    <div className="min-h-screen bg-[#F4EFE5] text-[#1A1814]">
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
