import type { SharedCommandOptions } from '@/cli/common'
import path from 'node:path'
import * as p from '@clack/prompts'
import c from 'ansis'
import { printSkip, printSummary, resolveSkillsTargetDir } from '@/cli/common'
import { isValidAgent } from '@/core/agent-profiles'
import { loadUserConfig, resolveOptions } from '@/core/config-loader'
import { copySkillDir, discoverSkills } from '@/core/sync-engine'

export async function runSkillCommand(cwd: string, options: SharedCommandOptions): Promise<void> {
  const config = await loadUserConfig(cwd, options.config)
  const runtime = resolveOptions(config, options)

  const skillDirs = await discoverSkills(runtime.source)
  if (skillDirs.length === 0) {
    printSkip(`No syncable skills found in ${runtime.source}.`)
    return
  }

  let selected = skillDirs
  if (!runtime.yes) {
    const picked = await p.multiselect({
      message: `Select ${c.green('skills')} to sync ${c.dim(runtime.source)}`,
      options: skillDirs.map(dir => ({ label: path.basename(dir), value: dir })),
      required: false,
    })
    if (p.isCancel(picked)) {
      p.cancel('Operation canceled.')
      return
    }
    selected = picked as string[]
  }

  if (selected.length === 0) {
    printSkip('No skills selected.')
    return
  }

  if (!isValidAgent(runtime.targetAgent)) {
    printSkip(`Unknown target agent: ${runtime.targetAgent}`)
    return
  }

  let total = { added: 0, overwritten: 0, skipped: 0 }
  const targetRoot = resolveSkillsTargetDir(cwd)
  for (const dir of selected) {
    const targetDir = path.join(targetRoot, path.basename(dir))
    const summary = await copySkillDir(dir, targetDir, { dryRun: runtime.dryRun, yes: runtime.yes })
    total = {
      added: total.added + summary.added,
      overwritten: total.overwritten + summary.overwritten,
      skipped: total.skipped + summary.skipped,
    }
  }
  printSummary('skills', total)
}
