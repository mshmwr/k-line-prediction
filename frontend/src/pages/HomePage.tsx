import { useDiary } from '../hooks/useDiary'
import HeroSection from '../components/home/HeroSection'
import ProjectLogicSection from '../components/home/ProjectLogicSection'
import DevDiarySection from '../components/home/DevDiarySection'
import BuiltByAIBanner from '../components/home/BuiltByAIBanner'
import Footer from '../components/shared/Footer'
import FooterDisclaimer from '../components/shared/FooterDisclaimer'
import UnifiedNavBar from '../components/UnifiedNavBar'

export default function HomePage() {
  const { entries, loading, error } = useDiary(3)

  return (
    // K-040 Item 3 — HomePage container pattern aligned with /diary + /about:
    // outer <div> = full-bleed (hosts NavBar + Banner + Footer); inner wrapper
    // applies max-w-[1248px] + horizontal padding only to the page body sections.
    // Preserves K-034 Phase 1 Sacred `<footer>` byte-identity (Footer renders
    // at viewport width, not clipped by the content max-w).
    <div className="min-h-screen">
      <UnifiedNavBar />
      <BuiltByAIBanner />
      <div
        className="pt-8 pb-8 px-6 sm:pt-[72px] sm:px-24 sm:pb-[96px] mx-auto max-w-[1248px]"
        data-testid="homepage-root"
      >
        <div className="flex flex-col gap-6 sm:gap-[72px]" data-testid="homepage-sections">
          <HeroSection />
          <ProjectLogicSection />
          <DevDiarySection
            entries={entries}
            loading={loading}
            error={error}
          />
        </div>
      </div>
      <Footer />
      <FooterDisclaimer />
    </div>
  )
}
