import type { ReactNode } from 'react'

type HeroColor = 'ink' | 'brick' | 'brick-dark'

interface HeroLine {
  text: ReactNode
  color?: HeroColor
}

interface PageHeroProps {
  lines: HeroLine[]
  desktopSize: 52 | 56
}

const SIZE_CLASS: Record<52 | 56, string> = {
  52: 'text-[36px] sm:text-[52px]',
  56: 'text-[36px] sm:text-[56px]',
}

const COLOR_CLASS: Record<HeroColor, string> = {
  ink: 'text-ink',
  brick: 'text-brick',
  'brick-dark': 'text-brick-dark',
}

export default function PageHero({ lines, desktopSize }: PageHeroProps) {
  return (
    <h1 className={`font-bold leading-[1.05] ${SIZE_CLASS[desktopSize]}`}>
      {lines.map((line, i) => (
        <span key={i} className={`block ${COLOR_CLASS[line.color ?? 'ink']}`}>
          {line.text}
        </span>
      ))}
    </h1>
  )
}
