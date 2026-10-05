import { parseMdcDocument, serializeMdcDocument, slugifyHeading, type MdcElementNode, type MdcNode } from '@lupinum/ginko-content/cms-contract'

function elements(nodes: MdcNode[]): MdcElementNode[] {
  const result: MdcElementNode[] = []
  for (const node of nodes) {
    if (typeof node === 'string' || node[0] === null) continue
    result.push(node)
    const [, , ...children] = node
    result.push(...elements(children))
  }
  return result
}

export async function editBody(source: string) {
  const document = await parseMdcDocument(source, { autoClose: false })
  const all = elements(document.nodes)
  const heading = all.find(node => node[0] === 'h1')
  const note = all.find(node => node[0] === 'field-note')
  const list = all.find(node => node[0] === 'ul')
  if (!heading || !note || !list) throw new Error('Fixture must include a heading, field-note and list')
  heading.splice(2, heading.length - 2, 'Edited field guide')
  heading[1].id = slugifyHeading('Edited field guide')
  note[1].tone = 'urgent'
  list.push(['li', {}, 'Record water quality'])
  // Parse the insertion template to obtain the parser-owned component metadata.
  const insertion = await parseMdcDocument('::field-note{tone="new"}\nInserted component\n::', { autoClose: false })
  document.nodes.push(...insertion.nodes)
  return { document, source: await serializeMdcDocument(document) }
}
