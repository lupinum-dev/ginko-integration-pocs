import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { parseMdcBody } from '@lupinum/ginko-content/cms-contract'
import { createContentDataSourceCacheHint, type ContentDataSourceResult } from '@lupinum/ginko-content/data-source'
import { editBody } from './edit'
import { exportFixtures } from '../cms-roundtrip/roundtrip'

const root = fileURLToPath(new URL('.', import.meta.url))
await rm(root + '../evidence/editor-input', { recursive: true, force: true })
await exportFixtures(root + '../evidence/editor-input')
const raw = await readFile(new URL('../cms-roundtrip/content/pages/welcome.md', import.meta.url), 'utf8')
const edited = await editBody(raw)
const data = await parseMdcBody(edited.source, { autoClose: false })
const stored: ContentDataSourceResult<typeof data> = {
  data, cache: createContentDataSourceCacheHint({ tags: ['collection:pages'], maxAge: 60 }),
}
await mkdir(root + 'src', { recursive: true })
await writeFile(root + 'src/stored.json', JSON.stringify(stored))
await cp(new URL('../cms-roundtrip/public', import.meta.url), root + 'public', { recursive: true })
console.log('Stored edited body and copied managed image; parsing runs only in Node.')
