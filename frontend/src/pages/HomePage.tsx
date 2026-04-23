import { useDiary } from '../hooks/useDiary'
import HeroSection from '../components/home/HeroSection'
import ProjectLogicSection from '../components/home/ProjectLogicSection'
import DevDiarySection from '../components/home/DevDiarySection'
import BuiltByAIBanner from '../components/home/BuiltByAIBanner'
import Footer from '../components/shared/Footer'
import UnifiedNavBar from '../components/UnifiedNavBar'

export default function HomePage() {
  const { entries, loading, error } = useDiary(3)

  return (
    <div className="min-h-screen pt-8 pb-8 px-6 sm:pt-[72px] sm:pr-[96px] sm:pb-[96px] sm:pl-[96px]" data-testid="homepage-root">
      <UnifiedNavBar />
      <BuiltByAIBanner />
      <div className="flex flex-col gap-6 sm:gap-[72px]" data-testid="homepage-sections">
        <HeroSection />
        <ProjectLogicSection />
        <DevDiarySection
          entries={entries}
          loading={loading}
          error={error}
        />
      </div>
      <Footer />
    </div>
  )
}
