import type { AgentId } from '@/types/core'

import path from 'node:path'

import * as p from '@clack/prompts'
import c from 'ansis'
import { AGENT_PROFILES } from '@/core/agent-profiles'

export interface SharedCommandOptions {
  source?: string
  targetAgent?: AgentId
  config?: string
  dryRun?: boolean
  yes?: boolean
}

export function resolveSkillsTargetDir(cwd: string): string {
  return path.join(cwd, '.agents/skills')
}

export function resolveRulesTargetDir(cwd: string): string {
  return path.join(cwd, AGENT_PROFILES.cursor.rulesProjectDir ?? '.cursor/rules')
}

export function resolveMcpTargetFile(cwd: string): string {
  return path.join(cwd, AGENT_PROFILES.cursor.mcpProjectFile ?? '.cursor/mcp.json')
}

export function printSummary(
  kind: string,
  summary: { added: number; overwritten: number; skipped: number }
): void {
  const kindLabel = kind.charAt(0).toUpperCase() + kind.slice(1)

  p.log.info('Done')
  p.outro(
    `${kindLabel}: added=${c.green(String(summary.added))}, overwritten=${c.green(String(summary.overwritten))}, skipped=${c.green(String(summary.skipped))}`
  )
}

export function printSkip(message: string): void {
  p.log.info('Skip')
  p.outro(message)
}
