import assert from 'node:assert/strict'
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashCanonicalJson, parseMdcDocument, serializeMdcDocument, type JsonValue } from '@lupinum/ginko-content/cms-contract'
import { normalizePortableMdcSource, normalizePortableModel, portableModelsSemanticallyEqual, validatePortableDocument, validatePortableReferences } from '@lupinum/ginko-content/portability'
import { assessFilesystemPortability, exportFilesystemToPortableDirectory, readPortableDirectory, writePortableDirectory } from '@lupinum/ginko-content/portability/node'
import { seedContract, contract } from './contract'
import { sourcePath, writeFilesystemDocument } from './filesystem'

export const fixtureRoot = fileURLToPath(new URL('.', import.meta.url))
export const evidenceRoot = resolve(fixtureRoot, '../evidence')

export async function exportFixtures(destination: string) {
  await mkdir(dirname(destination), { recursive: true })
  await seedContract(fixtureRoot)
  const assessment = await assessFilesystemPortability({ rootDir: fixtureRoot })
  assert.equal(assessment.ok, true, JSON.stringify(assessment.diagnostics))
  assert.ok(assessment.evidence)
  await exportFilesystemToPortableDirectory({ rootDir: fixtureRoot, destination, expectedInputHash: assessment.evidence.inputHash })
  return readPortableDirectory(destination)
}

export async function runRoundtrip() {
  const run = join(evidenceRoot, 'cms-roundtrip')
  await rm(run, { recursive: true, force: true })
  await mkdir(run, { recursive: true })
  const original = await exportFixtures(join(run, 'export'))
  assert.equal(original.documents.length, 12)
  assert.equal(original.assets.length, 1)
  for (const { document } of original.documents) validatePortableDocument(document, contract)
  validatePortableReferences(original.documents.map(row => row.document), contract)
  const expected = structuredClone(original.documents.map(row => row.document))
  const edited = expected.find(doc => doc.canonicalKey === '/pages/welcome')
  assert.ok(edited?.body)
  edited.shared.title = 'Welcome to the survey'
  edited.shared.species = { collection: 'species', canonicalKey: '/species/willow' }
  const ast = await parseMdcDocument(edited.body.source, { autoClose: false })
  const note = ast.nodes.find(node => typeof node !== 'string' && node[0] === 'field-note')
  assert.ok(note && typeof note !== 'string')
  note[1].tone = 'urgent'
  edited.body.source = normalizePortableMdcSource('\n' + (await serializeMdcDocument(ast)).trim())
  const added = structuredClone(edited)
  added.canonicalKey = '/pages/new-survey'
  added.slug = 'new-survey'
  added.shared.title = 'New survey'
  expected.push(added)
  const removedIndex = expected.findIndex(doc => doc.canonicalKey === '/pages/archive')
  assert.ok(removedIndex >= 0)
  expected.splice(removedIndex, 1)
  for (const document of expected) validatePortableDocument(document, contract)
  validatePortableReferences(expected, contract)
  const editedDirectory = join(run, 'edited')
  await writePortableDirectory(editedDirectory, { contract, documents: expected, assets: original.assets })
  const saved = await readPortableDirectory(editedDirectory)
  const model = { documents: expected, assets: original.manifest.assets }
  assert.equal(portableModelsSemanticallyEqual(model, { documents: saved.documents.map(row => row.document), assets: saved.manifest.assets }), true)
  const tree = join(run, 'filesystem')
  await cp(fixtureRoot, tree, { recursive: true, filter: path => !path.split('/').includes('node_modules') && !path.split('/').includes('.ginko') })
  await seedContract(tree)
  await rm(join(tree, 'content/pages/archive.md'))
  await writeFilesystemDocument(tree, edited)
  await writeFilesystemDocument(tree, added)
  const assessment = await assessFilesystemPortability({ rootDir: tree })
  assert.equal(assessment.ok, true, JSON.stringify(assessment.diagnostics))
  assert.ok(assessment.evidence)
  await exportFilesystemToPortableDirectory({ rootDir: tree, destination: join(run, 'reimport'), expectedInputHash: assessment.evidence.inputHash })
  const reimport = await readPortableDirectory(join(run, 'reimport'))
  assert.equal(portableModelsSemanticallyEqual(model, { documents: reimport.documents.map(row => row.document), assets: reimport.manifest.assets }), true)
  let untouched = 0
  for (const { document } of original.documents) {
    if (['/pages/welcome', '/pages/archive'].includes(document.canonicalKey)) continue
    assert.deepEqual(await readFile(join(tree, sourcePath(document))), await readFile(join(fixtureRoot, sourcePath(document))))
    const savedRow = saved.documents.find(row => row.document.canonicalKey === document.canonicalKey)
    const originalRow = original.documents.find(row => row.document.canonicalKey === document.canonicalKey)
    assert.ok(savedRow && originalRow)
    assert.deepEqual(savedRow.bytes, originalRow.bytes)
    untouched++
  }
  const hashes = {
    contract: await hashCanonicalJson(contract as unknown as JsonValue),
    before: await hashCanonicalJson(normalizePortableModel({ documents: original.documents.map(row => row.document), assets: original.manifest.assets }) as unknown as JsonValue),
    after: await hashCanonicalJson(normalizePortableModel(model) as unknown as JsonValue),
  }
  assert.notEqual(hashes.before, hashes.after)
  const report = { documents: 12, assets: 1, untouchedByteIdentical: untouched, hashes }
  await writeFile(join(run, 'result.json'), JSON.stringify(report, null, 2))
  return report
}
