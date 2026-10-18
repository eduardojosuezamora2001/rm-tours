import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import es from './locales/es/common.json'
import en from './locales/en/common.json'
const modules = import.meta.glob<{ default: Record<string, unknown> }>([
  './locales/*/*.json',
  '!./locales/*/common.json',
])
void i18n
  .use({
    type: 'backend' as const,
    read(
      language: string,
      namespace: string,
      callback: (error: Error | null, data?: Record<string, unknown>) => void,
    ) {
      const load = modules[`./locales/${language}/${namespace}.json`]
      if (!load) {
        callback(new Error('Translation resource unavailable'))
        return
      }
      void load()
        .then((module) => callback(null, module.default))
        .catch(() => callback(new Error('Translation resource unavailable')))
    },
  })
  .use(initReactI18next)
  .init({
    resources: { es: { common: es }, en: { common: en } },
    partialBundledLanguages: true,
    lng: 'es',
    fallbackLng: 'es',
    supportedLngs: ['es', 'en'],
    defaultNS: 'common',
    ns: ['common'],
    interpolation: { escapeValue: false },
    returnNull: false,
  })
export default i18n
