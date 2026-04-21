import type { AgentsSyncConfig } from '@/types/config'

import type { AgentId } from '@/types/core'
import path from 'node:path'

import { loadConfig } from 'c12'
import jiti from 'jiti'
import { expandHome } from '@/core/path'

export interface ResolvedRuntimeOptions {
  source: string
  targetAgent: AgentId
  dryRun: boolean
  yes: boolean
}

interface CliLikeOptions {
  source?: string
  targetAgent?: AgentId
  config?: string
  dryRun?: boolean
  yes?: boolean
}

const DEFAULTS: Required<Pick<ResolvedRuntimeOptions, 'source' | 'targetAgent'>> = {
  source: '~/.agents',
  targetAgent: 'cursor',
}

function pickFirst<T>(value?: T | T[]): T | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

export async function loadUserConfig(cwd: string, configPath?: string): Promise<AgentsSyncConfig> {
  if (configPath) {
    const importer = jiti(cwd, { interopDefault: true })
    const loaded = (await importer.import(path.resolve(cwd, configPath))) as unknown
    if (loaded && typeof loaded === 'object' && 'default' in loaded) {
      return ((loaded as { default?: AgentsSyncConfig }).default ?? {}) as AgentsSyncConfig
    }
    return (loaded ?? {}) as AgentsSyncConfig
  }

  const result = await loadConfig<AgentsSyncConfig>({
    cwd,
    name: 'agents-sync',
    defaults: {},
    jitiOptions: { interopDefault: true },
  })
  return result.config ?? {}
}

export function resolveOptions(
  config: AgentsSyncConfig,
  cli: CliLikeOptions
): ResolvedRuntimeOptions {
  const sourceFromConfig = pickFirst(config.sourceDir)
  const targetFromConfig = pickFirst(config.agent)

  const source = cli.source ?? sourceFromConfig ?? DEFAULTS.source
  const targetAgent = cli.targetAgent ?? targetFromConfig ?? DEFAULTS.targetAgent

  return {
    source: path.resolve(expandHome(source)),
    targetAgent,
    dryRun: Boolean(cli.dryRun),
    yes: Boolean(cli.yes),
  }
}
