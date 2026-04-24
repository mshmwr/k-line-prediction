import PageHero from '../shared/PageHero'

export default function DiaryHero() {
  return (
    <section className="pt-16 mb-16">
      <PageHero desktopSize={52} lines={[{ text: 'Dev Diary', color: 'ink' }]} />
      <hr
        role="separator"
        aria-hidden="true"
        className="h-px w-full bg-[#2A2520] my-4 border-0"
      />
      <p className="text-[13px] sm:text-[15px] text-[#1A1814] leading-[1.55]">
        Each entry records a milestone, a decision, or a lesson that shaped the system. Filed chronologically, latest first.
      </p>
    </section>
  )
}
