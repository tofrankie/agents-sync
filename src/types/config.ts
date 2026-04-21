import type { AgentId } from '@/types/core'

export interface AgentsSyncConfig {
  /** Source directory path(s). Default: `~/.agents`. If an array is provided, only the first item is used. */
  sourceDir?: string | string[]
  /** Target agent(s). Default: `cursor`. If an array is provided, only the first item is used. */
  agent?: AgentId | AgentId[]
  /** Default conflict behavior when target files already exist. */
  conflictPolicy?: 'ask' | 'overwrite' | 'skip'
  /** Per-agent path overrides for skills, rules, and mcp outputs. */
  mapping?: Partial<Record<AgentId, { skillsDir?: string; rulesDir?: string; mcpFile?: string }>>
}

export function defineConfig(config: AgentsSyncConfig): AgentsSyncConfig {
  return config
}
