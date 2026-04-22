import UnifiedNavBar from '../components/UnifiedNavBar'
import SectionContainer from '../components/primitives/SectionContainer'
import DossierHeader from '../components/about/DossierHeader'
import PageHeaderSection from '../components/about/PageHeaderSection'
import MetricsStripSection from '../components/about/MetricsStripSection'
import RoleCardsSection from '../components/about/RoleCardsSection'
import ReliabilityPillarsSection from '../components/about/ReliabilityPillarsSection'
import TicketAnatomySection from '../components/about/TicketAnatomySection'
import ProjectArchitectureSection from '../components/about/ProjectArchitectureSection'
import Footer from '../components/shared/Footer'

/** Inline section label row (A-1): Geist Mono 13px bold + 1px hairline */
function SectionLabelRow({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-4 mb-4">
      <span
        className="font-mono text-[13px] font-bold tracking-[2px] text-ink whitespace-nowrap"
        data-testid="section-label"
      >
        {label}
      </span>
      <div className="flex-1 h-px bg-[#8B7A6B]" data-section-hairline />
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <UnifiedNavBar />

      {/* A-2 — Dossier Header Bar */}
      <DossierHeader />

      {/* S1 — PageHeaderSection (no section label per design — Hero is above-the-fold) */}
      <SectionContainer id="header" width="narrow">
        <PageHeaderSection />
      </SectionContainer>

      {/* S2 — MetricsStripSection */}
      <SectionContainer id="metrics" width="wide" divider>
        <SectionLabelRow label="Nº 01 — DELIVERY METRICS" />
        <MetricsStripSection />
      </SectionContainer>

      {/* S3 — RoleCardsSection */}
      <SectionContainer id="roles" width="wide" divider>
        <SectionLabelRow label="Nº 02 — THE ROLES" />
        <RoleCardsSection />
      </SectionContainer>

      {/* S4 — ReliabilityPillarsSection */}
      <SectionContainer id="pillars" width="wide" divider>
        <SectionLabelRow label="Nº 03 — RELIABILITY" />
        <ReliabilityPillarsSection />
      </SectionContainer>

      {/* S5 — TicketAnatomySection (BQ-022-01: Nº 04 — ANATOMY OF A TICKET) */}
      <SectionContainer id="tickets" width="wide" divider>
        <SectionLabelRow label="Nº 04 — ANATOMY OF A TICKET" />
        <TicketAnatomySection />
      </SectionContainer>

      {/* S6 — ProjectArchitectureSection */}
      <SectionContainer id="architecture" width="wide" divider>
        <SectionLabelRow label="Nº 05 — PROJECT ARCHITECTURE" />
        <ProjectArchitectureSection />
      </SectionContainer>

      {/* S7 — Footer variant="about" (shared sitewide) */}
      <SectionContainer id="footer-cta" width="wide">
        <Footer variant="about" />
      </SectionContainer>
    </div>
  )
}
