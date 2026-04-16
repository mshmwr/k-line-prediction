interface ScreenshotPlaceholderProps {
  label: string
}

export default function ScreenshotPlaceholder({ label }: ScreenshotPlaceholderProps) {
  return (
    <div className="border border-white/10 aspect-video flex items-center justify-center">
      <span className="font-mono text-xs text-gray-600 uppercase tracking-widest">{label}</span>
    </div>
  )
}
