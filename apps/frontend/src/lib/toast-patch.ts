'use client'

import { toast } from 'sonner'

let patched = false

function extractText(message: unknown, opts?: { description?: unknown }): string {
  const parts: string[] = []
  if (typeof message === 'string') parts.push(message)
  else if (message != null) parts.push(String(message))
  if (opts?.description) {
    if (typeof opts.description === 'string') parts.push(opts.description)
    else parts.push(String(opts.description))
  }
  return parts.join(' — ')
}

export function patchToastErrors() {
  if (patched || typeof window === 'undefined') return
  patched = true

  type ToastErrorFn = typeof toast.error
  type ErrorOpts = NonNullable<Parameters<ToastErrorFn>[1]>
  const originalError: ToastErrorFn = toast.error.bind(toast)

  const wrapped: ToastErrorFn = ((message: Parameters<ToastErrorFn>[0], opts?: ErrorOpts) => {
    const textToCopy = extractText(message, opts as { description?: unknown } | undefined)
    const callerAction = opts?.action
    const defaultAction: ErrorOpts['action'] = {
      label: 'Copiar',
      onClick: () => {
        navigator.clipboard.writeText(textToCopy).catch(() => {})
      },
    }
    return originalError(message, {
      ...opts,
      action: callerAction ?? defaultAction,
    })
  }) as ToastErrorFn

  toast.error = wrapped
}
