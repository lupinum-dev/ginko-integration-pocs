import { expect, it } from 'vitest'
import { defineCollection, fields } from '@lupinum/ginko-content/config'
import { buildResolvedContentContract } from '@lupinum/ginko-content/cms-contract'
import { runRoundtrip } from './roundtrip'

it('exports, edits, writes filesystem content, and reimports without changing untouched bytes', async () => {
  const result = await runRoundtrip()
  expect(result).toMatchObject({ documents: 12, assets: 1, untouchedByteIdentical: 10 })
}, 30_000)

it.skip('F03: library drops schema title from data collections (known failure; remove skip when fixed)', () => {
  const contract = buildResolvedContentContract({ collections: {
    data: defineCollection({ type: 'data', source: 'data/*.json', schema: fields.object({ title: fields.text().required() }) }),
  } }, { defaultLocale: 'en', locales: ['en'] })
  expect(contract.collections.data.fields.map(field => field.key)).toContain('title')
})

it.skip('F04: filesystem export rejects the default unlocalized locale configuration (known failure; remove skip when fixed)', async () => {
  // The probe script creates this exact project using content.i18n: false.
  const { assessFilesystemPortability } = await import('@lupinum/ginko-content/portability/node')
  const { evidenceRoot } = await import('./roundtrip')
  const assessment = await assessFilesystemPortability({ rootDir: `${evidenceRoot}/default-locale-probe` })
  expect(assessment.ok).toBe(true)
})
