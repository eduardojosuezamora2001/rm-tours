import { useEffect } from 'react'
import { useLang } from '@/features/catalog/queries'
export function Metadata({ title, description }: { title: string; description?: string }) {
  const lang = useLang()
  useEffect(() => {
    document.documentElement.lang = lang
    document.title = `${title} · RM Tours Costa Rica`
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', description ?? title)
  }, [title, description, lang])
  return null
}
