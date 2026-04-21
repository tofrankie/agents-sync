import type { SharedCommandOptions } from '@/cli/common'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { printSkip, resolveMcpTargetFile } from '@/cli/common'
import { loadUserConfig, resolveOptions } from '@/core/config-loader'
import {
  normalizeMcpConfig,
  renderMcpConfigByAgent,
  resolveMcpSourceFile,
} from '@/core/sync-engine'

export async function runMcpCommand(cwd: string, options: SharedCommandOptions): Promise<void> {
  const config = await loadUserConfig(cwd, options.config)
  const runtime = resolveOptions(config, options)

  if (runtime.targetAgent !== 'cursor') {
    printSkip(
      `MCP sync is currently supported only for Cursor. Use --target-agent cursor (current: ${runtime.targetAgent}).`
    )
    return
  }

  const sourceFile = await resolveMcpSourceFile(runtime.source)
  if (!sourceFile) {
    printSkip(`No MCP config file found in ${runtime.source}.`)
    return
  }

  const normalized = await normalizeMcpConfig(sourceFile)
  const rendered = renderMcpConfigByAgent(normalized, runtime.targetAgent)
  const targetFile = resolveMcpTargetFile(cwd)

  if (runtime.dryRun) {
    process.stdout.write(`dry-run: MCP sync target => ${targetFile}\n`)
    return
  }

  await fs.mkdir(path.dirname(targetFile), { recursive: true })
  await fs.writeFile(targetFile, rendered, 'utf8')
  process.stdout.write(`done: MCP synced to ${targetFile}\n`)
}
