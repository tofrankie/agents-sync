import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveOptions } from '../src/core/config-loader'

describe('resolveOptions', () => {
  it('uses cli options as highest priority', () => {
    const resolved = resolveOptions(
      { agent: 'cursor', sourceDir: '/from-config' },
      { source: '/from-cli', targetAgent: 'codex', dryRun: true, yes: true }
    )

    expect(resolved.source).toBe('/from-cli')
    expect(resolved.targetAgent).toBe('codex')
    expect(resolved.dryRun).toBe(true)
    expect(resolved.yes).toBe(true)
  })

  it('uses defaults when cli and config missing', () => {
    const resolved = resolveOptions({}, {})
    expect(resolved.source).toBe(path.join(os.homedir(), '.agents'))
    expect(resolved.targetAgent).toBe('cursor')
    expect(resolved.dryRun).toBe(false)
    expect(resolved.yes).toBe(false)
  })

  it('supports new config keys and array values', () => {
    const resolved = resolveOptions(
      {
        sourceDir: ['~/from-array', '/unused'],
        agent: ['claude', 'cursor'],
      },
      {}
    )

    expect(resolved.source).toBe(path.join(os.homedir(), 'from-array'))
    expect(resolved.targetAgent).toBe('claude')
  })
})
