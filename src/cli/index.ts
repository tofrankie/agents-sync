#!/usr/bin/env node

import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { Command } from 'commander'
import { runMcpCommand } from '@/cli/commands/mcp'
import { runRuleCommand } from '@/cli/commands/rule'
import { runSkillCommand } from '@/cli/commands/skill'
import { name, version } from '../../package.json'

main().catch(error => {
  process.stdout.write('\n')
  process.stderr.write(`${String(error)}\n`)
  process.stdout.write('\n')
  process.exitCode = 1
})

async function main(): Promise<void> {
  const program = new Command()

  program
    .name('agents-sync')
    .description('Sync skills, cursor rules, and cursor mcp config from a source folder.')
    .version(version, '-v, --version', 'output the version number')
    .hook('preAction', () => {
      process.stdout.write('\n')
      p.intro(`${name} ${c.dim(`v${version}`)}`)
    })

  applySharedOptions(program.command('skill').description('sync skills')).action(async options => {
    await runSkillCommand(process.cwd(), options)
  })

  applySharedOptions(program.command('rule').description('sync rules (cursor only)')).action(
    async options => {
      await runRuleCommand(process.cwd(), options)
    }
  )

  applySharedOptions(program.command('mcp').description('sync mcp config (cursor only)')).action(
    async options => {
      await runMcpCommand(process.cwd(), options)
    }
  )

  await program.parseAsync(process.argv)
}

function applySharedOptions(cmd: Command): Command {
  return cmd
    .option('-s, --source <path>', 'source path, default ~/.agents')
    .option('-t, --target-agent <agent>', 'target agent, default cursor')
    .option('-c, --config <path>', 'config file path')
    .option('--dry-run', 'show planned operations without writing files')
    .option('-y, --yes', 'skip prompts and overwrite conflicts')
}
