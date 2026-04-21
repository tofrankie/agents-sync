import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import {
  copyRuleFiles,
  copySkillDir,
  discoverRuleFiles,
  discoverSkills,
  normalizeMcpConfig,
  renderMcpConfigByAgent,
  resolveMcpSourceFile,
} from '../src/core/sync-engine'

const tempDirs: string[] = []

async function makeTempDir(prefix: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  await Promise.all(tempDirs.map(dir => fs.rm(dir, { recursive: true, force: true })))
  tempDirs.length = 0
})

describe('sync-engine', () => {
  it('discovers skills from skills directory', async () => {
    const source = await makeTempDir('agents-sync-skills-')
    const skillDir = path.join(source, 'skills', 'demo-skill')
    await fs.mkdir(skillDir, { recursive: true })
    await fs.writeFile(path.join(skillDir, 'SKILL.md'), '# demo', 'utf8')

    const found = await discoverSkills(source)
    expect(found).toHaveLength(1)
    expect(found[0]).toContain('demo-skill')
  })

  it('copies skill directory with file-level conflict handling', async () => {
    const sourceSkill = await makeTempDir('agents-sync-src-skill-')
    const targetSkill = await makeTempDir('agents-sync-tgt-skill-')
    await fs.writeFile(path.join(sourceSkill, 'SKILL.md'), '# v1', 'utf8')
    await fs.writeFile(path.join(sourceSkill, 'notes.md'), 'notes', 'utf8')
    await fs.writeFile(path.join(targetSkill, 'SKILL.md'), '# old', 'utf8')

    const result = await copySkillDir(sourceSkill, targetSkill, { dryRun: false, yes: false })
    expect(result.added).toBe(1)
    expect(result.skipped).toBe(1)
    expect(result.overwritten).toBe(0)
  })

  it('discovers and copies rules to .mdc', async () => {
    const source = await makeTempDir('agents-sync-rules-src-')
    const rulesDir = path.join(source, 'rules')
    const targetDir = await makeTempDir('agents-sync-rules-target-')
    await fs.mkdir(rulesDir, { recursive: true })
    const sourceRule = path.join(rulesDir, 'team.md')
    await fs.writeFile(sourceRule, '# rule', 'utf8')

    const found = await discoverRuleFiles(source)
    expect(found).toEqual([sourceRule])

    const copied = await copyRuleFiles(found, targetDir, { dryRun: false, yes: true })
    expect(copied.added).toBe(1)
    const targetRule = path.join(targetDir, 'team.mdc')
    await expect(fs.access(targetRule)).resolves.toBeUndefined()
  })

  it('resolves and normalizes mcp source', async () => {
    const source = await makeTempDir('agents-sync-mcp-src-')
    const mcpFile = path.join(source, 'mcp.json')
    await fs.writeFile(
      mcpFile,
      JSON.stringify({ mcpServers: { demo: { command: 'node' } } }),
      'utf8'
    )

    const resolved = await resolveMcpSourceFile(source)
    expect(resolved).toBe(mcpFile)

    const normalized = await normalizeMcpConfig(mcpFile)
    expect(normalized).toHaveProperty('mcpServers')
  })

  it('renders mcp config for cursor and rejects others', () => {
    const rendered = renderMcpConfigByAgent({ mcpServers: {} }, 'cursor')
    expect(rendered).toContain('"mcpServers"')
    expect(() => renderMcpConfigByAgent({}, 'codex')).toThrow()
  })
})
