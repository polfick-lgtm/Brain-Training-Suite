import { writeFile } from 'node:fs/promises'
import prettier from 'prettier'

const apiBaseUrl = (process.env.LUMA_API_BASE_URL || '').replace(/\/$/, '')
if (apiBaseUrl) {
  const url = new URL(apiBaseUrl)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error(
      'LUMA_API_BASE_URL must be a public HTTPS address without credentials.',
    )
}
const source = `window.LUMA_CONFIG = window.LUMA_CONFIG || ${JSON.stringify({ apiBaseUrl })}\n`
const options = await prettier.resolveConfig('public/luma/config.js')
await writeFile(
  'public/luma/config.js',
  await prettier.format(source, { ...options, parser: 'babel' }),
)
