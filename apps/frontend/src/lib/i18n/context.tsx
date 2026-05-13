'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { messages, type Locale, type Messages } from './messages'

interface LocaleContextValue {
  locale: Locale
  t: Messages
  setLocale: (l: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'es',
  t: messages.es,
  setLocale: () => {},
})

function readStoredLocale(): Locale {
  if (typeof document === 'undefined') return 'es'
  const match = document.cookie.match(/(?:^|; )crew_locale=([^;]*)/)
  const val = match ? decodeURIComponent(match[1]) : null
  return val === 'en' || val === 'es' ? val : 'es'
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es')

  useEffect(() => {
    setLocaleState(readStoredLocale())
  }, [])

  const setLocale = useCallback((l: Locale) => {
    document.cookie = `crew_locale=${l}; path=/; max-age=31536000; SameSite=Lax`
    setLocaleState(l)
    document.documentElement.lang = l
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, t: messages[locale], setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}
