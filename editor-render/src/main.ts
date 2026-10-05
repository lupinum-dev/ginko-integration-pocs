import { createApp, defineComponent, h } from 'vue'
import ContentBodyRenderer from '@lupinum/ginko-content/body-renderer'
import { assertPublicMarkdownAst } from '@lupinum/ginko-content/cms-contract'
import { policy } from '../../cms-roundtrip/policy'
import stored from './stored.json'
import './style.css'

const body: unknown = stored.data.body
assertPublicMarkdownAst(body, policy)
const FieldNote = defineComponent({
  props: { tone: String },
  setup(props, { slots }) {
    return () => h('aside', { class: 'field-note', 'data-tone': props.tone }, [
      h('strong', props.tone), slots.default?.(), h('footer', slots.caption?.()),
    ])
  },
})
createApp({
  render: () => h('main', [
    h('header', [h('small', 'Ginko Content · standalone Vue'), h('p', 'Stored body preview')]),
    h(ContentBodyRenderer, { body, policy, components: { 'field-note': FieldNote } }),
  ]),
}).mount('#app')
