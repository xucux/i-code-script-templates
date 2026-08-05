/**
 * Validate all templates in the repository.
 *
 * Checks:
 * 1. Each meta.json conforms to template-meta.schema.json
 * 2. slug matches the directory name
 * 3. kind matches the path segment
 * 4. script.rhai (or scriptFile) exists
 * 5. Generated catalog.json matches catalog.schema.json
 *
 * Usage: node scripts/validate.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const TEMPLATES_DIR = join(ROOT, 'templates')
const SCHEMAS_DIR = join(ROOT, 'schemas')

let errors = []
let warnings = []

function error(msg) {
  errors.push(msg)
  console.error('[FAIL] ' + msg)
}

function warn(msg) {
  warnings.push(msg)
  console.warn('[WARN] ' + msg)
}

// ── Simple JSON Schema Validator ──────────────────────────────────
// Supports $ref to "#/definitions/..." anywhere in the tree by carrying
// the root schema's `definitions` through the recursion.

function resolveRef(schema, rootDefinitions) {
  if (!schema.$ref) return schema
  const ref = schema.$ref
  if (ref.startsWith('#/definitions/')) {
    const defKey = ref.replace('#/definitions/', '')
    const defSchema = rootDefinitions && rootDefinitions[defKey]
    if (defSchema) {
      // Resolve recursively in case a definition itself references another
      return resolveRef(defSchema, rootDefinitions)
    }
  }
  return schema
}

function validateAgainstSchema(value, schema, path = '$', rootDefinitions = null) {
  const issues = []

  // Use the schema's own definitions as the root when not yet provided
  if (rootDefinitions === null && schema.definitions) {
    rootDefinitions = schema.definitions
  }

  // Resolve $ref against the root definitions
  schema = resolveRef(schema, rootDefinitions)

  if (schema.type === 'array') {
    if (!Array.isArray(value)) {
      issues.push(`${path}: expected array, got ${typeof value}`)
      return issues
    }
    if (schema.items) {
      const itemSchema = resolveRef(schema.items, rootDefinitions)
      value.forEach((item, i) => {
        issues.push(...validateAgainstSchema(item, itemSchema, `${path}[${i}]`, rootDefinitions))
      })
    }
    return issues
  }

  if (schema.type === 'object' || schema.properties) {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      issues.push(`${path}: expected object, got ${value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value}`)
      return issues
    }

    // required fields
    if (schema.required) {
      for (const req of schema.required) {
        if (value[req] === undefined) {
          issues.push(`${path}: missing required field "${req}"`)
        }
      }
    }

    // validate each property
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (value[key] !== undefined) {
          issues.push(...validateAgainstSchema(value[key], propSchema, `${path}.${key}`, rootDefinitions))
        }
      }
    }
    return issues
  }

  // Primitive types
  if (schema.type === 'string' && typeof value !== 'string') {
    issues.push(`${path}: expected string, got ${typeof value}`)
  } else if (schema.type === 'integer' && !Number.isInteger(value)) {
    issues.push(`${path}: expected integer, got ${typeof value} (${value})`)
  } else if (schema.type === 'number' && typeof value !== 'number') {
    issues.push(`${path}: expected number, got ${typeof value}`)
  } else if (schema.type === 'boolean' && typeof value !== 'boolean') {
    issues.push(`${path}: expected boolean, got ${typeof value}`)
  }

  // pattern validation
  if (schema.pattern && typeof value === 'string') {
    const re = new RegExp(schema.pattern)
    if (!re.test(value)) {
      issues.push(`${path}: "${value}" does not match pattern ${schema.pattern}`)
    }
  }

  // enum validation
  if (schema.enum && !schema.enum.includes(value)) {
    issues.push(`${path}: "${value}" is not one of [${schema.enum.join(', ')}]`)
  }

  // format validation
  if (schema.format === 'date-time' && typeof value === 'string') {
    if (isNaN(Date.parse(value))) {
      issues.push(`${path}: "${value}" is not a valid date-time`)
    }
  }
  if (schema.format === 'uri' && typeof value === 'string') {
    try {
      new URL(value)
    } catch {
      issues.push(`${path}: "${value}" is not a valid URI`)
    }
  }

  // minimum
  if (schema.minimum !== undefined && typeof value === 'number' && value < schema.minimum) {
    issues.push(`${path}: ${value} is less than minimum ${schema.minimum}`)
  }

  return issues
}

// ── Load schemas ──────────────────────────────────────────────────

function loadSchema(filename) {
  const schemaPath = join(SCHEMAS_DIR, filename)
  if (!existsSync(schemaPath)) {
    error(`Schema file not found: ${schemaPath}`)
    return null
  }
  return JSON.parse(readFileSync(schemaPath, 'utf-8'))
}

const templateMetaSchema = loadSchema('template-meta.schema.json')
const catalogSchema = loadSchema('catalog.schema.json')

// ── Check 1: Validate each meta.json ──────────────────────────────

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

const metaFiles = findMetaFiles(TEMPLATES_DIR)

if (metaFiles.length === 0) {
  error('No meta.json files found under templates/')
}

for (const metaFile of metaFiles) {
  const relPath = metaFile.replace(ROOT + '\\', '').replace(ROOT + '/', '')
  let meta
  try {
    meta = JSON.parse(readFileSync(metaFile, 'utf-8'))
  } catch (e) {
    error(`${relPath}: invalid JSON — ${e.message}`)
    continue
  }

  // Validate against schema
  if (templateMetaSchema) {
    const issues = validateAgainstSchema(meta, templateMetaSchema)
    for (const issue of issues) {
      error(`${relPath}: ${issue}`)
    }
  }

  // ── Check 2: slug matches directory name ──
  const dirName = basename(dirname(metaFile))
  if (meta.slug && meta.slug !== dirName) {
    error(`${relPath}: slug "${meta.slug}" does not match directory name "${dirName}"`)
  }

  // ── Check 3: kind matches path ──
  const parentDir = basename(dirname(dirname(metaFile)))
  if (meta.kind && meta.kind !== parentDir) {
    error(`${relPath}: kind "${meta.kind}" does not match parent directory "${parentDir}"`)
  }

  // ── Check 4: script.rhai exists ──
  const scriptFile = meta.scriptFile || 'script.rhai'
  const scriptPath = join(dirname(metaFile), scriptFile)
  if (!existsSync(scriptPath)) {
    error(`${relPath}: script file "${scriptFile}" not found at ${scriptPath.replace(ROOT, '')}`)
  }
}

// ── Check 5: Validate catalog.json ────────────────────────────────

const catalogPath = join(ROOT, 'catalog.json')
if (existsSync(catalogPath)) {
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8'))
    if (catalogSchema) {
      const issues = validateAgainstSchema(catalog, catalogSchema)
      for (const issue of issues) {
        error(`catalog.json: ${issue}`)
      }
    }
  } catch (e) {
    error(`catalog.json: invalid JSON — ${e.message}`)
  }
} else {
  warn('catalog.json not found; run node scripts/build-catalog.mjs first')
}

// ── Summary ────────────────────────────────────────────────────────

console.log('')
console.log('═'.repeat(50))
console.log(`Checked: ${metaFiles.length} meta.json files`)
console.log(`Errors:  ${errors.length}`)
console.log(`Warnings: ${warnings.length}`)
console.log('═'.repeat(50))

if (errors.length > 0) {
  process.exit(1)
}