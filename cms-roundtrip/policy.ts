import type { PortableComponentPolicyV1 } from '@lupinum/ginko-content/cms-contract'

export const policy: PortableComponentPolicyV1 = {
  components: {
    'field-note': {
      kind: 'block',
      props: { tone: { type: 'string', required: true } },
      slots: ['default', 'caption'],
      media: null,
    },
  },
}
