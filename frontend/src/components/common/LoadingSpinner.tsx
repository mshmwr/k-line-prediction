export default function LoadingSpinner() {
  return (
    <div role="status" aria-label="Loading" className="flex flex-col items-center justify-center gap-3 rounded-lg bg-[#0D1117] px-8 py-6">
      <div className="flex items-center gap-3">
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse [animation-delay:120ms]" />
        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse [animation-delay:240ms]" />
      </div>
      <p className="text-zinc-500 font-mono text-[12px]">Running prediction...</p>
    </div>
  )
}
