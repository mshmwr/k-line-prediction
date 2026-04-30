#!/usr/bin/env node
// K-068 design-spec validator.
// Walks every frontend/design/specs/*.frame-*.json and errors when an object
// with layout: "horizontal" and >=2 visual children is missing responsive or
// tailwindHint. Heuristic for "visual child": any nested object that itself
// has an `id` plus one of `type`/`layout`, OR any array of such objects.
//
// Exit codes:
//   0 = all specs pass
//   1 = at least one spec missing required fields
//   2 = parse error / IO error

import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SPECS_DIR = dirname(fileURLToPath(import.meta.url))

function isVisualChild(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  if (typeof value.id !== 'string') return false
  return typeof value.type === 'string' || typeof value.layout === 'string'
}

function countVisualChildren(node) {
  let count = 0
  for (const value of Object.values(node)) {
    if (isVisualChild(value)) {
      count += 1
    } else if (Array.isArray(value)) {
      for (const item of value) {
        if (isVisualChild(item)) count += 1
      }
    }
  }
  return count
}

function* walk(node, path = '$') {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i += 1) {
      yield* walk(node[i], `${path}[${i}]`)
    }
    return
  }
  yield { node, path }
  for (const [key, value] of Object.entries(node)) {
    yield* walk(value, `${path}.${key}`)
  }
}

function validateFile(filePath) {
  const errors = []
  let parsed
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'))
  } catch (err) {
    return { errors: [`PARSE: ${err.message}`], parseError: true }
  }
  for (const { node, path } of walk(parsed)) {
    if (node.layout !== 'horizontal') continue
    if (countVisualChildren(node) < 2) continue
    const id = node.id ? ` (id=${node.id})` : ''
    if (!node.responsive) {
      errors.push(`${path}${id}: missing responsive { mobile, desktop }`)
    } else {
      if (typeof node.responsive.mobile !== 'string') {
        errors.push(`${path}${id}: responsive.mobile must be string`)
      }
      if (typeof node.responsive.desktop !== 'string') {
        errors.push(`${path}${id}: responsive.desktop must be string`)
      }
    }
    if (typeof node.tailwindHint !== 'string') {
      errors.push(`${path}${id}: missing tailwindHint (string)`)
    }
  }
  return { errors }
}

function main() {
  const files = readdirSync(SPECS_DIR)
    .filter((f) => /\.frame-[A-Za-z0-9]+\.json$/.test(f))
    .sort()

  let totalErrors = 0
  let totalFailingFiles = 0
  let parseErrors = 0

  for (const file of files) {
    const fullPath = join(SPECS_DIR, file)
    const { errors, parseError } = validateFile(fullPath)
    if (parseError) parseErrors += 1
    if (errors.length === 0) {
      console.log(`OK  ${file}`)
      continue
    }
    totalFailingFiles += 1
    totalErrors += errors.length
    console.log(`FAIL ${file}`)
    for (const err of errors) console.log(`     - ${err}`)
  }

  console.log()
  console.log(`Checked ${files.length} files; ${totalFailingFiles} failing; ${totalErrors} errors.`)
  if (parseErrors > 0) {
    console.error(`Parse errors: ${parseErrors}`)
    process.exit(2)
  }
  process.exit(totalErrors > 0 ? 1 : 0)
}

main()
