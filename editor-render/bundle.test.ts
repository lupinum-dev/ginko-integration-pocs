import { readFile } from 'node:fs/promises'
import { expect, it } from 'vitest'

it('F10: stored-body renderer client bundle contains no parser, Zod or YAML (known library failure)', async () => {
  const report = JSON.parse(await readFile(new URL('../evidence/bundle.json', import.meta.url), 'utf8'))
  expect(report.forbidden).toEqual([])
})
