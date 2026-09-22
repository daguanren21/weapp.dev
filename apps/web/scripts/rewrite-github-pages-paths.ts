import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import process from 'node:process'
import { rewriteRootUrls } from '../src/lib/github-pages-paths'

const root = resolve(process.argv[2] || join(import.meta.dirname, '..', 'dist'))

async function collect(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      return collect(path)
    }
    return /\.(?:html|css)$/.test(entry.name) ? [path] : []
  }))
  return nested.flat()
}

const leftover: string[] = []
const files = await collect(root)
for (const file of files) {
  const fromDir = dirname(relative(root, file))
  const original = await readFile(file, 'utf8')
  const next = rewriteRootUrls(original, fromDir)
  if (next !== original) {
    await writeFile(file, next)
  }
  if (/(?:href|src)=["']\/_astro\//.test(next) || /url\(\s*["']?\/_astro\//.test(next)) {
    leftover.push(relative(root, file))
  }
}

if (leftover.length) {
  throw new Error(`GitHub Pages rewrite left root /_astro/ URLs in ${leftover.join(', ')}`)
}
