'use client'

import { useEffect } from 'react'
import { patchToastErrors } from '@/lib/toast-patch'

export function ClientInit() {
  useEffect(() => {
    patchToastErrors()
  }, [])
  return null
}
