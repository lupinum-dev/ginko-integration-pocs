import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildResolvedContentContract, canonicalJsonBytes, type JsonValue } from '@lupinum/ginko-content/cms-contract'
import { readResolvedContentContract } from '@lupinum/ginko-content/cms-contract/node'
import config from './content.config'
import { policy } from './policy'

export const contract = buildResolvedContentContract(config, {
  defaultLocale: 'en', locales: ['en'], componentPolicy: policy,
})

export async function seedContract(root: string) {
  await mkdir(join(root, '.ginko'), { recursive: true })
  // The public Node entry point exports the reader, but no artifact writer.
  await writeFile(join(root, '.ginko/content-contract.json'), canonicalJsonBytes(contract as unknown as JsonValue))
  return readResolvedContentContract({ root })
}
