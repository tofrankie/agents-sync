import type { AgentId, ResourceKind } from '@/types/core'

export interface AgentProfile {
  id: AgentId
  supports: Record<ResourceKind, boolean>
  skillsProjectDirs: string[]
  skillsUserDirs: string[]
  rulesProjectDir?: string
  mcpProjectFile?: string
}

export const AGENT_PROFILES: Record<AgentId, AgentProfile> = {
  cursor: {
    id: 'cursor',
    supports: { skill: true, rule: true, mcp: true },
    skillsProjectDirs: ['.agents/skills', '.cursor/skills'],
    skillsUserDirs: ['~/.agents/skills', '~/.cursor/skills'],
    rulesProjectDir: '.cursor/rules',
    mcpProjectFile: '.cursor/mcp.json',
  },
  claude: {
    id: 'claude',
    supports: { skill: true, rule: false, mcp: false },
    skillsProjectDirs: ['.claude/skills', '.agents/skills'],
    skillsUserDirs: ['~/.claude/skills', '~/.agents/skills'],
    rulesProjectDir: '.claude/rules',
    mcpProjectFile: '.mcp.json',
  },
  codex: {
    id: 'codex',
    supports: { skill: true, rule: false, mcp: false },
    skillsProjectDirs: ['.agents/skills', '.codex/skills'],
    skillsUserDirs: ['~/.agents/skills', '~/.codex/skills'],
    rulesProjectDir: '.codex/rules',
    mcpProjectFile: '.codex/config.toml',
  },
  gemini: {
    id: 'gemini',
    supports: { skill: true, rule: false, mcp: false },
    skillsProjectDirs: ['.agents/skills'],
    skillsUserDirs: ['~/.agents/skills'],
  },
}

export function isValidAgent(id: string): id is AgentId {
  return id in AGENT_PROFILES
}

export function isKindSupported(agent: AgentId, kind: ResourceKind): boolean {
  return AGENT_PROFILES[agent].supports[kind]
}
