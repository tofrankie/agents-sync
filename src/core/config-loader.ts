import type { AgentsSyncConfig } from '@/types/config'
import type { AgentId } from '@/types/core'
import os from 'node:os'
import path from 'node:path'
import { loadConfig } from 'c12'
import { createJiti } from 'jiti'
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

export async function loadUserConfig(cwd: string, configPath?: string): Promise<AgentsSyncConfig> {
  if (configPath) {
    const resolvedConfig = path.resolve(cwd, configPath)
    const importer = createJiti(resolvedConfig, { interopDefault: true })
    const loaded = await importer.import<AgentsSyncConfig>(resolvedConfig, { default: true })
    return (loaded && typeof loaded === 'object' ? loaded : {}) as AgentsSyncConfig
  }

  const projectDir = path.resolve(cwd)
  const homeDir = path.resolve(os.homedir())
  if (projectDir === homeDir) {
    return loadHomeAgentsSyncConfig(homeDir)
  }
  const projectLayer = await loadAgentsSyncConfigFromDir(projectDir)
  const homeLayer = await loadHomeAgentsSyncConfig(homeDir)
  return { ...homeLayer, ...projectLayer }
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

function pickFirst<T>(value?: T | T[]): T | undefined {
  if (Array.isArray(value)) {
    return value[0]
  }
  return value
}

async function loadAgentsSyncConfigFromDir(dir: string): Promise<AgentsSyncConfig> {
  const result = await loadC12AgentsSync(dir)
  return result.config ?? {}
}

/** Standard `agents-sync.config.*` (+ c12 rc / layers for that name). */
async function loadC12AgentsSync(dir: string) {
  return loadConfig<AgentsSyncConfig>({
    cwd: dir,
    name: 'agents-sync',
    defaults: {},
    jitiOptions: { interopDefault: true },
  })
}

/**
 * User home only: hidden `.agents-sync.config.*` (not `agents-sync.config.*`).
 * Keeps `name: 'agents-sync'` so `~/.agents-syncrc` still merges when present.
 */
async function loadHomeAgentsSyncConfig(homeDir: string): Promise<AgentsSyncConfig> {
  const result = await loadConfig<AgentsSyncConfig>({
    cwd: homeDir,
    name: 'agents-sync',
    configFile: '.agents-sync.config',
    defaults: {},
    jitiOptions: { interopDefault: true },
  })
  return result.config ?? {}
}
