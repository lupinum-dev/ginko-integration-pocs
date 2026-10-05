import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { expect, it } from 'vitest'
import { parseMdcDocument, projectMdcDocument, serializeMdcDocument, validatePublicMarkdownAst } from '@lupinum/ginko-content/cms-contract'
import { parsePortableMdc, portableMdcSemanticallyEqual, parsePortableDocument, serializePortableDocument } from '@lupinum/ginko-content/portability'
import { policy } from '../cms-roundtrip/policy'
import { editBody } from './edit'

const root = fileURLToPath(new URL('../cms-roundtrip/content/pages/', import.meta.url))
const files = (await readdir(root)).filter(file => file.endsWith('.md')).sort()

it.each(files)('%s: parse/serialize preserves body, fields and comments; AST edits reparse losslessly', async file => {
  const source = await readFile(root + file, 'utf8')
  const original = await parseMdcDocument(source, { autoClose: false })
  const serialized = await serializeMdcDocument(original)
  const reparsed = await parseMdcDocument(serialized, { autoClose: false })
  expect(reparsed.frontmatter).toEqual(original.frontmatter)
  expect(projectMdcDocument(reparsed).body).toEqual(projectMdcDocument(original).body)
  expect(portableMdcSemanticallyEqual(await parsePortableMdc(source, policy), await parsePortableMdc(serialized, policy))).toBe(true)
  if (file === 'welcome.md') expect(serialized).toContain('<!-- Keep this authored comment. -->')
  const edited = await editBody(source)
  const saved = await parseMdcDocument(edited.source, { autoClose: false })
  expect(projectMdcDocument(saved).body).toEqual(projectMdcDocument(edited.document).body)
  expect(saved.frontmatter).toEqual(original.frontmatter)
  expect(edited.source).toContain('Edited field guide')
  expect(edited.source).toContain('Record water quality')
  expect(edited.source).toContain('Inserted component')
  expect(edited.source).toContain('urgent')
  expect(validatePublicMarkdownAst(projectMdcDocument(saved).body, policy).ok).toBe(true)
})


it.each(['oak', 'willow'])('%s data document: codec roundtrip remains body-free', async name => {
  const { readPortableDirectory } = await import('@lupinum/ginko-content/portability/node')
  const bundle = await readPortableDirectory(fileURLToPath(new URL('../evidence/editor-input', import.meta.url)))
  const row = bundle.documents.find(row => row.document.canonicalKey === `/species/${name}`)
  expect(row).toBeDefined()
  if (!row) throw new Error(`Missing fixture ${name}`)
  expect(row.document.body).toBeNull()
  expect(await parsePortableDocument(await serializePortableDocument(row.document, bundle.contract), bundle.contract, row.file)).toEqual(row.document)
})
