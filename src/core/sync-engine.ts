import fs from 'node:fs/promises'
import path from 'node:path'

import c from 'ansis'

import { isKindSupported } from '@/core/agent-profiles'

export interface ApplyContext {
  dryRun: boolean
  yes: boolean
}

export interface CopySummary {
  added: number
  overwritten: number
  skipped: number
}

async function exists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

async function listFilesRecursively(root: string): Promise<string[]> {
  const out: string[] = []
  const entries = await fs.readdir(root, { withFileTypes: true })
  for (const entry of entries) {
    const abs = path.join(root, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await listFilesRecursively(abs)))
    } else {
      out.push(abs)
    }
  }
  return out
}

export async function discoverSkills(source: string): Promise<string[]> {
  const candidates = [path.join(source, 'skills'), source]
  const found: string[] = []
  for (const candidate of candidates) {
    if (!(await exists(candidate))) continue
    const entries = await fs.readdir(candidate, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const skillDir = path.join(candidate, entry.name)
      if (await exists(path.join(skillDir, 'SKILL.md'))) {
        found.push(skillDir)
      }
    }
    if (found.length > 0) break
  }
  return found
}

export async function discoverRuleFiles(source: string): Promise<string[]> {
  const candidates = [path.join(source, 'rules'), path.join(source, '.cursor/rules'), source]
  for (const candidate of candidates) {
    if (!(await exists(candidate))) continue
    const entries = await fs.readdir(candidate, { withFileTypes: true })
    const rules = entries
      .filter(
        entry => entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.mdc'))
      )
      .map(entry => path.join(candidate, entry.name))
    if (rules.length > 0) return rules
  }
  return []
}

export async function resolveMcpSourceFile(source: string): Promise<string | null> {
  const candidates = [path.join(source, 'mcp.json'), path.join(source, '.cursor/mcp.json')]
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      return candidate
    }
  }
  return null
}

export async function copySkillDir(
  sourceDir: string,
  targetDir: string,
  ctx: ApplyContext
): Promise<CopySummary> {
  const files = await listFilesRecursively(sourceDir)
  let added = 0
  let overwritten = 0
  let skipped = 0

  for (const file of files) {
    const rel = path.relative(sourceDir, file)
    const target = path.join(targetDir, rel)
    const hasTarget = await exists(target)
    if (hasTarget && !ctx.yes) {
      skipped += 1
      continue
    }
    if (!ctx.dryRun) {
      await fs.mkdir(path.dirname(target), { recursive: true })
      await fs.copyFile(file, target)
    }
    if (hasTarget) overwritten += 1
    else added += 1
  }

  return { added, overwritten, skipped }
}

export async function copyRuleFiles(
  sourceFiles: string[],
  targetDir: string,
  ctx: ApplyContext
): Promise<CopySummary> {
  let added = 0
  let overwritten = 0
  let skipped = 0
  if (!ctx.dryRun && sourceFiles.length > 0) {
    await fs.mkdir(targetDir, { recursive: true })
  }
  for (const file of sourceFiles) {
    const name = path.basename(file).replace(/\.md$/, '.mdc')
    const target = path.join(targetDir, name)
    const hasTarget = await exists(target)
    if (hasTarget && !ctx.yes) {
      skipped += 1
      continue
    }
    if (!ctx.dryRun) {
      await fs.copyFile(file, target)
    }
    if (hasTarget) overwritten += 1
    else added += 1
  }
  return { added, overwritten, skipped }
}

export async function normalizeMcpConfig(sourceFile: string): Promise<Record<string, unknown>> {
  const raw = await fs.readFile(sourceFile, 'utf8')
  const parsed = JSON.parse(raw) as Record<string, unknown>
  return parsed
}

export function renderMcpConfigByAgent(
  model: Record<string, unknown>,
  targetAgent: string
): string {
  if (targetAgent !== 'cursor') {
    throw new Error(`unsupported mcp target: ${targetAgent}`)
  }
  return `${JSON.stringify(model, null, 2)}\n`
}

export function ensureSupported(
  kind: 'skill' | 'rule' | 'mcp',
  targetAgent: 'cursor' | 'claude' | 'codex' | 'gemini'
): void {
  if (isKindSupported(targetAgent, kind)) {
    return
  }
  const message = `${kind} sync is currently supported only for ${c.cyan('Cursor')}. Skipped target agent: ${targetAgent}.`
  throw new Error(message)
}
