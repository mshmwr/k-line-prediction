import type { ReactNode } from 'react'
import CardShell from '../primitives/CardShell'

interface TestingLayer {
  layer: 'Unit' | 'Integration' | 'E2E'
  detail: string
}

interface ArchPillarBlockProps {
  title: 'Monorepo, contract-first' | 'Docs-driven tickets' | 'Three-layer testing pyramid'
  body: ReactNode
  testingPyramid?: TestingLayer[]
}

export default function ArchPillarBlock({ title, body, testingPyramid }: ArchPillarBlockProps) {
  return (
    <CardShell padding="md">
      <h3 className="font-mono font-bold text-ink text-sm mb-3">{title}</h3>
      <div data-testid="arch-pillar-body" className="text-muted text-xs leading-relaxed mb-3">{body}</div>
      {testingPyramid && (
        <ul className="space-y-1 mt-2">
          {testingPyramid.map(({ layer, detail }) => (
            <li key={layer} className="text-xs text-muted">
              <span data-testid="arch-pillar-layer" className="text-ink font-mono">{layer}</span>
              {' — '}
              {detail}
            </li>
          ))}
        </ul>
      )}
    </CardShell>
  )
}
