import { useTranslation } from 'react-i18next'
import { SelectField } from '@/components/select-field'
import { SelectItem } from '@/components/ui/select'
import { useTheme } from '@/hooks/use-theme'

export function ThemeSelect() {
  const { t } = useTranslation('common')
  const { theme, setTheme } = useTheme()
  return (
    <SelectField
      className="stitch-preference-select stitch-theme-select"
      aria-label={t('theme')}
      title={t('theme')}
      value={theme}
      onValueChange={(value) => setTheme(value === 'dark' ? 'dark' : 'light')}
    >
      <SelectItem value="light">{t('themeLight')}</SelectItem>
      <SelectItem value="dark">{t('themeDark')}</SelectItem>
    </SelectField>
  )
}
