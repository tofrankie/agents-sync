import type { SharedCommandOptions } from '@/cli/common'
import { printSkip, printSummary, resolveRulesTargetDir } from '@/cli/common'
import { loadUserConfig, resolveOptions } from '@/core/config-loader'
import { copyRuleFiles, discoverRuleFiles } from '@/core/sync-engine'

export async function runRuleCommand(cwd: string, options: SharedCommandOptions): Promise<void> {
  const config = await loadUserConfig(cwd, options.config)
  const runtime = resolveOptions(config, options)

  if (runtime.targetAgent !== 'cursor') {
    printSkip(
      `Rules sync is currently supported only for Cursor. Use --target-agent cursor (current: ${runtime.targetAgent}).`
    )
    return
  }

  const files = await discoverRuleFiles(runtime.source)
  if (files.length === 0) {
    printSkip(`No rule files found in ${runtime.source}.`)
    return
  }

  const summary = await copyRuleFiles(files, resolveRulesTargetDir(cwd), {
    dryRun: runtime.dryRun,
    yes: runtime.yes,
  })
  printSummary('rules', summary)
}
