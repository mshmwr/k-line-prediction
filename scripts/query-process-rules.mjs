#!/usr/bin/env node
/**
 * K-071 Phase 1 — query-process-rules.mjs
 *
 * Reads content/site-content.json and prints a markdown table of
 * processRules[] sorted by stored-weight descending.
 *
 * Columns: id | title | severity | weight | addedAfter
 *
 * Usage:
 *   node scripts/query-process-rules.mjs     (from repo root)
 *   npm run rules                             (from frontend/)
 */
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const siteContent = JSON.parse(readFileSync(join(__dirname, '..', 'content', 'site-content.json'), 'utf-8'))

const rules = [...(siteContent.processRules || [])].sort((a, b) => b.weight - a.weight)

console.log('| id | title | severity | weight | addedAfter |')
console.log('| --- | --- | --- | --- | --- |')
for (const r of rules) {
  console.log(`| ${r.id} | ${r.title} | ${r.severity} | ${r.weight} | ${r.addedAfter} |`)
}
console.log(`\n${rules.length} rules total`)
