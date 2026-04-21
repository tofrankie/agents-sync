export type ResourceKind = 'skill' | 'mcp' | 'rule'

export type AgentId = 'cursor' | 'claude' | 'codex' | 'gemini'

export interface SkillFrontmatter {
  name?: string
  description?: string
  [key: string]: unknown
}

export interface SyncResult {
  added: number
  overwritten: number
  skipped: number
  warnings: string[]
}
