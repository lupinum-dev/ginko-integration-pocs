import { cp, mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildResolvedContentContract } from '@lupinum/ginko-content/cms-contract'
import { defineCollection, fields } from '@lupinum/ginko-content/config'
import { assessFilesystemPortability } from '@lupinum/ginko-content/portability/node'
import { seedContract, contract } from '../contract'
import { GinkoBoundaryError, validatePortableDocument } from '@lupinum/ginko-content/portability'
import { evidenceRoot, fixtureRoot } from '../roundtrip'

const titleContract = buildResolvedContentContract({ collections: {
  species: defineCollection({ type: 'data', source: 'species/*.json', schema: fields.object({ title: fields.text().required() }) }),
} }, { defaultLocale: 'en', locales: ['en'] })
const root = join(evidenceRoot, 'default-locale-probe')
await rm(root, { recursive: true, force: true })
await mkdir(root, { recursive: true })
await cp(fixtureRoot, root, { recursive: true, filter: path => !path.split('/').includes('node_modules') && !path.split('/').includes('.ginko') })
await writeFile(join(root, 'nuxt.config.ts'), "import { policy } from './policy'\nexport default { content: { componentPolicy: policy, i18n: false } }\n")
await seedContract(root)
const assessment = await assessFilesystemPortability({ rootDir: root })
const candidate = structuredClone(assessment.documents.find(doc => doc.canonicalKey === '/pages/welcome'))
let invalidTitleError: unknown = null
if (candidate) {
  candidate.shared.title = 42
  try { validatePortableDocument(candidate, contract) } catch (error) {
    invalidTitleError = error instanceof GinkoBoundaryError ? { code: error.code, message: error.message, details: error.details } : String(error)
  }
}
const result = { invalidTitleError, titleSchemaRequired: true, resolvedDataFields: titleContract.collections.species.fields, defaultLocaleAssessment: { ok: assessment.ok, diagnostics: assessment.diagnostics } }
await writeFile(join(evidenceRoot, 'known-failures.json'), JSON.stringify(result, null, 2))
console.log(JSON.stringify(result, null, 2))
