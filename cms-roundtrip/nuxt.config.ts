import { policy } from './policy'

// The filesystem export API requires this filename; this POC does not run Nuxt.
export default { content: { componentPolicy: policy, i18n: { defaultLocale: 'en', locales: ['en'] } } }
