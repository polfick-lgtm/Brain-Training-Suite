import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const indexPath = 'dist/luma/index.html'
const manifestPath = 'dist/luma/manifest.webmanifest'
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

for (const icon of manifest.icons) {
  const asset = icon.src.split('?')[0]
  const content = await readFile(`dist/luma/${asset}`)
  const version = createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 16)
  icon.src = `${asset}?v=${version}`
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

const assets = [
  'app.mjs',
  'config.js',
  'style.css',
  'manifest.webmanifest',
  'apple-touch-icon.png',
  'mascot.svg',
]
let html = await readFile(indexPath, 'utf8')

for (const asset of assets) {
  const content = await readFile(`dist/luma/${asset}`)
  const version = createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 16)
  const escapedAsset = asset.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const reference = new RegExp(
    `((?:src|href)=")${escapedAsset}(?:\\?v=[a-f0-9]+)?(")`,
    'g',
  )
  if (!reference.test(html))
    throw new Error(`Riferimento a ${asset} non trovato in ${indexPath}.`)
  html = html.replace(reference, `$1${asset}?v=${version}$2`)
}

await writeFile(indexPath, html)
