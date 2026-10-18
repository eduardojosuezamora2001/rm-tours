import type common from './locales/es/common.json'
import type catalog from './locales/es/catalog.json'
import type tour from './locales/es/tour.json'
import type quote from './locales/es/quote.json'
import type legal from './locales/es/legal.json'
import type auth from './locales/es/auth.json'
import type admin from './locales/es/admin.json'
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof common
      catalog: typeof catalog
      tour: typeof tour
      quote: typeof quote
      legal: typeof legal
      auth: typeof auth
      admin: typeof admin
    }
  }
}
