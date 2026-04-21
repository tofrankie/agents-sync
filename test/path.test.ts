import os from 'node:os'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { expandHome } from '../src/core/path'

describe('expandHome', () => {
  it('expands ~ and ~/ paths', () => {
    expect(expandHome('~')).toBe(os.homedir())
    expect(expandHome('~/.agents')).toBe(path.join(os.homedir(), '.agents'))
  })

  it('keeps non-home path as-is', () => {
    expect(expandHome('/tmp/test')).toBe('/tmp/test')
  })
})
