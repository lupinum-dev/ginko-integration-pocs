import { defineCollection, defineContentConfig, fields } from '@lupinum/ginko-content/config'

export default defineContentConfig({
  collections: {
    pages: defineCollection({
      type: 'page', source: 'pages/**/*.md', route: '/notes', i18n: false,
      schema: fields.object({
        title: fields.text().required(),
        species: fields.relation('species').required(),
      }),
    }),
    species: defineCollection({
      type: 'data', source: 'species/*.json', i18n: false,
      schema: fields.object({ name: fields.text().required(), related: fields.relation('species') }),
    }),
  },
})
