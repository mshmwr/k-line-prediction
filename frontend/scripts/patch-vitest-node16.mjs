import fs from 'node:fs'
import path from 'node:path'

const major = Number(process.versions.node.split('.')[0] ?? 0)

if (major >= 18) {
  process.exit(0)
}

const packageJsonPath = path.resolve('node_modules/p-limit/package.json')

if (!fs.existsSync(packageJsonPath)) {
  process.exit(0)
}

const raw = fs.readFileSync(packageJsonPath, 'utf8')
const pkg = JSON.parse(raw)
const importsTarget = pkg?.imports?.['#async_hooks']
if (!importsTarget) {
  process.exit(0)
}

if (
  importsTarget.node === './async-hooks-stub.js' &&
  importsTarget.default === './async-hooks-stub.js'
) {
  process.exit(0)
}

pkg.imports['#async_hooks'].node = './async-hooks-stub.js'
pkg.imports['#async_hooks'].default = './async-hooks-stub.js'
fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, '\t')}\n`)
console.log('Patched p-limit imports for Node <18 test runtime compatibility.')
