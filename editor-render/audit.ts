import { readFile, readdir, writeFile } from 'node:fs/promises'
import { gzipSync } from 'node:zlib'

// The build hook owns this ignored JSON report; the assertion bridges JSON.parse's untyped boundary.
const report = JSON.parse(await readFile('../evidence/bundle.json', 'utf8')) as {
  gzipBytes: number
  chunks: { file: string; gzipBytes: number }[]
  forbidden: { id: string; bytes: number }[]
  modules: { id: string; bytes: number }[]
}
const files = (await readdir('dist/assets')).filter(file => file.endsWith('.js'))
report.chunks = await Promise.all(files.map(async file => ({ file: 'assets/' + file, gzipBytes: gzipSync(await readFile('dist/assets/' + file)).length })))
report.gzipBytes = report.chunks.reduce((sum: number, chunk: { gzipBytes: number }) => sum + chunk.gzipBytes, 0)
await writeFile('../evidence/bundle.json', JSON.stringify(report, null, 2))
console.log(JSON.stringify({ gzipBytes: report.gzipBytes, forbiddenModules: report.forbidden.length, topModules: report.modules.slice(0, 10) }, null, 2))
