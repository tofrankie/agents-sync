import type { SharedCommandOptions } from '@/cli/common'
import path from 'node:path'
import * as p from '@clack/prompts'
import c from 'ansis'
import { printSkip, printSummary, resolveSkillsTargetDir } from '@/cli/common'
import { isValidAgent } from '@/core/agent-profiles'
import { loadUserConfig, resolveOptions } from '@/core/config-loader'
import { copySkillDir, discoverSkills } from '@/core/sync-engine'

/** Multiselect sentinel: not a filesystem path. When selected, every skill is synced. */
const MULTISELECT_ALL_SKILLS = '__agents-sync:all-skills__'

export async function runSkillCommand(cwd: string, options: SharedCommandOptions): Promise<void> {
  const config = await loadUserConfig(cwd, options.config)
  const runtime = resolveOptions(config, options)

  const skillDirs = await discoverSkills(runtime.source)
  if (skillDirs.length === 0) {
    printSkip(`No syncable skills found in ${c.dim(runtime.source)}.`)
    return
  }

  let selected = skillDirs
  if (!runtime.yes) {
    const skillOptions = skillDirs.map(dir => ({ label: path.basename(dir), value: dir }))

    const options =
      skillDirs.length > 1
        ? [{ label: 'All skills', value: MULTISELECT_ALL_SKILLS }, ...skillOptions]
        : skillOptions

    const picked = await p.multiselect({
      message: `Select one or more ${c.green('skills')} to sync from ${c.dim(runtime.source)}`,
      options,
      required: false,
    })

    if (p.isCancel(picked)) {
      p.cancel('Operation canceled.')
      return
    }
    const values = picked as string[]
    selected = values.includes(MULTISELECT_ALL_SKILLS) ? skillDirs : values
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
