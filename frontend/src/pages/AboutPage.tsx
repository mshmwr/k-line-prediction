import UnifiedNavBar from '../components/UnifiedNavBar'
import PageHeaderSection from '../components/about/PageHeaderSection'
import MetricsStripSection from '../components/about/MetricsStripSection'
import WhereISteppedInSection from '../components/about/WhereISteppedInSection'
import RolePipelineSection from '../components/about/RolePipelineSection'
import RoleCardsSection from '../components/about/RoleCardsSection'
import ReliabilityPillarsSection from '../components/about/ReliabilityPillarsSection'
import TicketAnatomySection from '../components/about/TicketAnatomySection'
import ProjectArchitectureSection from '../components/about/ProjectArchitectureSection'
import SectionLabelRow from '../components/about/SectionLabelRow'
import Footer from '../components/shared/Footer'
import FooterDisclaimer from '../components/shared/FooterDisclaimer'

// K-045 (2026-04-24) — /about desktop layout consistency.
// SectionContainer primitive retired (BQ-045-02 Option α).
// Pattern = Option C (design doc §2.3): each of the 6 <section> elements is a
// DIRECT child of root <div className="min-h-screen">, carrying its own
// container classes inline (max-w-[1248px] mx-auto px-6 sm:px-24). Vertical
// rhythm via margin-top (S1 pt, S2–S6 mt, S6 mb) — NOT a flex-gap wrapper —
// because an inner flex wrapper would break K-031 Sacred
// `#architecture.nextElementSibling === <footer>` (about-v2.spec.ts:387-404).
// Pencil Y80Iv padding [72,96,96,96] + gap:72 mapped verbatim at desktop
// (sm:pt-[72px] / sm:mt-[72px] / sm:mb-[96px] / sm:px-24) per K-040 Decision
// Memo §Item 3. Mobile mirrors Home pattern (pt-8 / mt-6 / mb-8 / px-6).
const baseContainer = 'px-6 sm:px-24 mx-auto max-w-[1248px] w-full'
const bodyGap = 'mt-6 sm:mt-[72px]'

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <UnifiedNavBar />

      {/* S1 — PageHeaderSection (hero; no section label per design — Hero is above-the-fold) */}
      <section id="header" className={`pt-8 sm:pt-[72px] ${baseContainer}`}>
        <PageHeaderSection />
      </section>

      {/* S2 — MetricsStripSection */}
      <section id="metrics" className={`${bodyGap} ${baseContainer}`}>
        <SectionLabelRow label="Nº 01 — DELIVERY METRICS" />
        <MetricsStripSection />
      </section>

      {/* SX — WhereISteppedInSection */}
      <section id="where-i-stepped-in" data-section="where-i-stepped-in" className={`${bodyGap} ${baseContainer}`}>
        <SectionLabelRow label="Nº 02.5 — WHERE I STEPPED IN" />
        <WhereISteppedInSection />
      </section>

      {/* SY — RolePipelineSection */}
      <section id="role-pipeline" data-section="role-pipeline" className={`${bodyGap} ${baseContainer}`}>
        <SectionLabelRow label="Nº 03 — THE ROLES" />
        <RolePipelineSection />
      </section>

      {/* S3 — RoleCardsSection */}
      <section id="roles" className={`${bodyGap} ${baseContainer}`}>
        <SectionLabelRow label="Nº 04 — THE ROLES" />
        <RoleCardsSection />
      </section>

      {/* S4 — ReliabilityPillarsSection */}
      <section id="pillars" className={`${bodyGap} ${baseContainer}`}>
        <SectionLabelRow label="Nº 05 — RELIABILITY" />
        <ReliabilityPillarsSection />
      </section>

      {/* S5 — TicketAnatomySection */}
      <section id="tickets" className={`${bodyGap} ${baseContainer}`}>
        <SectionLabelRow label="Nº 06 — ANATOMY OF A TICKET" />
        <TicketAnatomySection />
      </section>

      {/* S6 — ProjectArchitectureSection (LAST section — nextElementSibling must be <footer>) */}
      <section
        id="architecture"
        className={`${bodyGap} mb-8 sm:mb-[96px] ${baseContainer}`}
      >
        <SectionLabelRow label="Nº 07 — PROJECT ARCHITECTURE" />
        <ProjectArchitectureSection />
      </section>

      {/* Footer — shared sitewide (K-034 Phase 1); full-bleed sibling of root <div> */}
      <Footer />
      {/* K-057 Phase 1d — FooterDisclaimer placed AFTER Footer to preserve K-031
          Sacred (#architecture.nextElementSibling === <footer>). */}
      <FooterDisclaimer />
    </div>
  )
}
