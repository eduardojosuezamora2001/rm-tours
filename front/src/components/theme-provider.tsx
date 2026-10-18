import { useEffect, useState, type ReactNode } from 'react'
import { applyTheme, ThemeContext, themeStorageKey, type Theme } from '@/hooks/use-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setCurrentTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light',
  )

  function setTheme(next: Theme) {
    applyTheme(next)
    setCurrentTheme(next)
    try {
      localStorage.setItem(themeStorageKey, next)
    } catch {
      // The control still works when browser storage is unavailable.
    }
  }

  useEffect(() => {
    function syncTheme(event: StorageEvent) {
      if (event.storageArea !== localStorage || (event.key !== themeStorageKey && event.key !== null))
        return
      const next = event.newValue === 'dark' ? 'dark' : 'light'
      applyTheme(next)
      setCurrentTheme(next)
    }
    window.addEventListener('storage', syncTheme)
    return () => window.removeEventListener('storage', syncTheme)
  }, [])

  return <ThemeContext value={{ theme, setTheme }}>{children}</ThemeContext>
}
