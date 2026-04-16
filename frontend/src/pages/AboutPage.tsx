import PageHeaderSection from '../components/about/PageHeaderSection'
import AiCollabSection from '../components/about/AiCollabSection'
import HumanAiSection from '../components/about/HumanAiSection'
import TechDecSection from '../components/about/TechDecSection'
import ScreenshotsSection from '../components/about/ScreenshotsSection'
import TechStackSection from '../components/about/TechStackSection'
import FeaturesSection from '../components/about/FeaturesSection'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white">
      <PageHeaderSection />
      <AiCollabSection />
      <HumanAiSection />
      <TechDecSection />
      <ScreenshotsSection />
      <TechStackSection />
      <FeaturesSection />
    </div>
  )
}
