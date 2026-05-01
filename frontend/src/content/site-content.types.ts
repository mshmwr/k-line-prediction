// Types for site-content.json fields used in components.
// Discriminant fields (type, category, layerLabel) accept string to be compatible with
// resolveJsonModule which widens JSON literal values to string; satisfies verifies structural shape.

export type ArchField =
  | { type: string; label: string; value: string; valueFont?: string }
  | { type: string; rows: Array<{ no: string; layerLabel: string; detail: string }> }

export type ArchLayer = {
  no: number
  category: string
  title: string
  fields: ArchField[]
}

export type Step = {
  no: string
  verb: string
  title: string
  description: string
}

export type WhereIRow = {
  aiDid: string
  iDecided: string
  outcome: string
}
