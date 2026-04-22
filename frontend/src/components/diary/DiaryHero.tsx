// K-024 Phase 3 — /diary page hero (design §6.1 / §6.3 / §6.5).
// Title + divider + italic subtitle; all literal values sourced from
// docs/designs/K-024-visual-spec.json `wiDSi` frame hero-* roles.

export default function DiaryHero() {
  return (
    <section className="pt-16 mb-16">
      <h1 className="font-['Bodoni_Moda'] italic font-bold text-[40px] sm:text-[64px] text-[#1A1814] leading-[1.05]">
        Dev Diary
      </h1>
      <hr
        role="separator"
        aria-hidden="true"
        className="h-px w-full bg-[#2A2520] my-4 border-0"
      />
      <p className="font-['Newsreader'] italic text-[15px] sm:text-[17px] text-[#1A1814] leading-[1.55]">
        Each entry records a milestone, a decision, or a lesson that shaped the system. Filed chronologically, latest first.
      </p>
    </section>
  )
}
