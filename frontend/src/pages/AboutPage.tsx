import UnifiedNavBar from '../components/UnifiedNavBar'
import SectionContainer from '../components/primitives/SectionContainer'
import PageHeaderSection from '../components/about/PageHeaderSection'
import MetricsStripSection from '../components/about/MetricsStripSection'
import RoleCardsSection from '../components/about/RoleCardsSection'
import ReliabilityPillarsSection from '../components/about/ReliabilityPillarsSection'
import TicketAnatomySection from '../components/about/TicketAnatomySection'
import ProjectArchitectureSection from '../components/about/ProjectArchitectureSection'
import BuiltByAIShowcaseSection from '../components/about/BuiltByAIShowcaseSection'
import FooterCtaSection from '../components/about/FooterCtaSection'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <UnifiedNavBar />

      {/* S1 — PageHeaderSection */}
      <SectionContainer id="header" width="narrow">
        <PageHeaderSection />
      </SectionContainer>

      {/* S2 — MetricsStripSection */}
      <SectionContainer id="metrics" width="wide" divider>
        <MetricsStripSection />
      </SectionContainer>

      {/* S3 — RoleCardsSection */}
      <SectionContainer id="roles" width="wide" divider>
        <RoleCardsSection />
      </SectionContainer>

      {/* S4 — ReliabilityPillarsSection */}
      <SectionContainer id="pillars" width="wide" divider>
        <ReliabilityPillarsSection />
      </SectionContainer>

      {/* S5 — TicketAnatomySection */}
      <SectionContainer id="tickets" width="wide" divider>
        <TicketAnatomySection />
      </SectionContainer>

      {/* S6 — ProjectArchitectureSection */}
      <SectionContainer id="architecture" width="wide" divider>
        <ProjectArchitectureSection />
      </SectionContainer>

      {/* S7 — BuiltByAIShowcaseSection */}
      <SectionContainer id="banner-showcase" width="wide" divider>
        <BuiltByAIShowcaseSection />
      </SectionContainer>

      {/* S8 — FooterCtaSection (global footer) */}
      <SectionContainer id="footer-cta" width="wide">
        <FooterCtaSection />
      </SectionContainer>
    </div>
  )
}
