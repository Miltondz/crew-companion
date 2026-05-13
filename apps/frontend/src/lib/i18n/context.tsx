'use client'

import { createContext, useContext, useState, useCallback } from 'react'
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

export function LocaleProvider({
  children,
  initialLocale = 'es',
}: {
  children: React.ReactNode
  initialLocale?: Locale
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

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
