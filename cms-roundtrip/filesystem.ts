import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { parseMdcDocument, serializeMdcDocument } from '@lupinum/ginko-content/cms-contract'
import type { PortableDocumentV1 } from '@lupinum/ginko-content/portability'
import type { JsonValue } from '@lupinum/ginko-content/cms-contract'

function filesystemValue(value: JsonValue): unknown {
  if (Array.isArray(value)) return value.map(filesystemValue)
  if (value && typeof value === 'object') {
    if (typeof value.collection === 'string' && typeof value.canonicalKey === 'string') return value.canonicalKey
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, filesystemValue(child)]))
  }
  return value
}

// This deliberately supports only these flat fixtures. The API has no inverse filesystem exporter.
export function sourcePath(document: PortableDocumentV1) {
  return `content${document.canonicalKey}.${document.body ? 'md' : 'json'}`
}

export async function writeFilesystemDocument(root: string, document: PortableDocumentV1) {
  const frontmatter = Object.fromEntries(Object.entries({ ...document.shared, ...document.localized })
    .map(([key, value]) => [key, filesystemValue(value)]))
  const path = join(root, sourcePath(document))
  await mkdir(dirname(path), { recursive: true })
  if (document.body) {
    const editing = await parseMdcDocument(document.body.source, { autoClose: false })
    editing.frontmatter = frontmatter
    await writeFile(path, await serializeMdcDocument(editing))
  } else {
    await writeFile(path, JSON.stringify(frontmatter, null, 2) + '\n')
  }
}
