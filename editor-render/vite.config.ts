import { writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue(), {
    name: 'bundle-evidence',
    generateBundle(_, bundle) {
      const chunks = Object.values(bundle).filter(output => output.type === 'chunk')
      const modules = chunks.flatMap(chunk => Object.entries(chunk.modules)
        .filter(([, info]) => info.renderedLength > 0)
        .map(([id, info]) => ({ id: id.replace(fileURLToPath(new URL('../', import.meta.url)), ''), bytes: info.renderedLength })))
        .sort((a, b) => b.bytes - a.bytes)
      const forbidden = modules.filter(module => /(?:\/zod\/|\/js-yaml\/|\/yaml\/|\/comark\/(?:.*\/)?(?:parse|parser)|\/parsers\/|parse-comark|\/cms-contract\/mdc)/i.test(module.id))
      const report = { gzipBytes: chunks.reduce((sum, chunk) => sum + gzipSync(chunk.code).length, 0), chunks: chunks.map(chunk => ({ file: chunk.fileName, gzipBytes: gzipSync(chunk.code).length })), forbidden, modules }
      writeFileSync(new URL('../evidence/bundle.json', import.meta.url), JSON.stringify(report, null, 2))
      console.log(`Client JS gzip: ${report.gzipBytes} bytes; forbidden modules: ${forbidden.length}`)
    },
  }],
})
