import SectionHeader from '../common/SectionHeader'
import ScreenshotPlaceholder from './ScreenshotPlaceholder'

export default function ScreenshotsSection() {
  return (
    <section className="py-16 px-6 max-w-5xl mx-auto border-b border-white/10">
      <SectionHeader
        label="SCREENSHOTS"
        labelColor="white"
        title="Interface Preview"
        description="Screenshots will be captured after Phase 5 deployment."
      />
      <div className="grid md:grid-cols-3 gap-6">
        <ScreenshotPlaceholder label="Upload View" />
        <ScreenshotPlaceholder label="Match Results" />
        <ScreenshotPlaceholder label="Chart Panel" />
      </div>
    </section>
  )
}
