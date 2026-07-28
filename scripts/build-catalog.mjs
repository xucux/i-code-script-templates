/**
 * Scan all meta.json files under templates/ and generate catalog.json
 *
 * Usage: node scripts/build-catalog.mjs
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TEMPLATES_DIR = join(ROOT, 'templates')
const CATALOG_PATH = join(ROOT, 'catalog.json')

function findMetaFiles(dir) {
  const results = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        results.push(...findMetaFiles(full))
      } else if (entry.name === 'meta.json') {
        results.push(full)
      }
    }
  } catch {
    // ignore
  }
  return results
}

function main() {
  const metaFiles = findMetaFiles(TEMPLATES_DIR)
  const items = metaFiles.map((metaFile) => {
    const meta = JSON.parse(readFileSync(metaFile, 'utf-8'))
    const relPath = join(
      'templates',
      meta.kind,
      meta.slug
    ).replace(/\\/g, '/')
    const scriptPath = join(relPath, meta.scriptFile || 'script.rhai').replace(/\\/g, '/')
    const fullScript = join(ROOT, scriptPath)
    if (!existsSync(fullScript)) {
      console.warn('[warn] Script file not found: ' + fullScript)
    }
    return {
      id: meta.kind + '/' + meta.slug,
      slug: meta.slug,
      name: meta.name,
      kind: meta.kind,
      engine: meta.engine,
      author: meta.author,
      description: meta.description || undefined,
      tags: meta.tags || undefined,
      version: meta.version || undefined,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      path: relPath,
      metaPath: relPath + '/meta.json',
      scriptPath,
      defaultTimeoutMs: meta.defaultTimeoutMs || undefined,
      allowedHosts: meta.allowedHosts || undefined,
      minAppVersion: meta.minAppVersion || undefined,
    }
  })

  // Sort by updatedAt desc, then name asc
  items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.name.localeCompare(b.name))

  const catalog = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    repo: 'https://github.com/xucux/i-code-script-templates',
    ref: 'main',
    items,
  }

  writeFileSync(CATALOG_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf-8')
  console.log('OK: catalog.json generated with ' + items.length + ' templates')
}

main()