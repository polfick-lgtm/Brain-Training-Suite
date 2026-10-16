import { createHash } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'

const indexPath = 'dist/luma/index.html'
const assets = ['app.mjs', 'config.js', 'style.css']
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
  )
  if (!reference.test(html))
    throw new Error(`Riferimento a ${asset} non trovato in ${indexPath}.`)
  html = html.replace(reference, `$1${asset}?v=${version}$2`)
}

await writeFile(indexPath, html)
