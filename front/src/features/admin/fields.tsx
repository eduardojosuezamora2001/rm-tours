import { useId } from 'react'
import type { Localized, LocalizedList } from '../../../../shared/contracts'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
export function BilingualField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string
  value: Localized
  onChange: (value: Localized) => void
  multiline?: boolean
}) {
  const id = useId()
  return (
    <FieldGroup className="bilingual-grid">
      {(['es', 'en'] as const).map((lang) => (
        <Field key={lang}>
          <FieldLabel htmlFor={`${id}-${lang}`}>
            {label} · {lang.toUpperCase()}
          </FieldLabel>
          {multiline ? (
            <Textarea
              id={`${id}-${lang}`}
              lang={lang}
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
              rows={4}
              maxLength={10000}
            />
          ) : (
            <Input
              id={`${id}-${lang}`}
              lang={lang}
              value={value[lang]}
              onChange={(e) => onChange({ ...value, [lang]: e.target.value })}
              maxLength={500}
            />
          )}
        </Field>
      ))}
    </FieldGroup>
  )
}
export function ListField({
  label,
  value,
  onChange,
}: {
  label: string
  value: LocalizedList
  onChange: (value: LocalizedList) => void
}) {
  return (
    <BilingualField
      multiline
      label={label}
      value={{ es: value.es.join('\n'), en: value.en.join('\n') }}
      onChange={(text) => onChange({ es: text.es.split('\n'), en: text.en.split('\n') })}
    />
  )
}
