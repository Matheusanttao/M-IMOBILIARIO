'use client'

import { useEffect } from 'react'

const STORAGE_KEY = 'chunk-load-recovery:last-reload'
const RELOAD_COOLDOWN_MS = 60_000

function isChunkLoadError(value: unknown) {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === 'string'
        ? value
        : value && typeof value === 'object' && 'message' in value
          ? String((value as { message?: unknown }).message)
          : ''

  return /ChunkLoadError|Loading chunk \d+ failed|CSS_CHUNK_LOAD_FAILED/i.test(message)
}

function reloadOnce() {
  const now = Date.now()
  const lastReload = Number(sessionStorage.getItem(STORAGE_KEY) ?? 0)

  if (now - lastReload < RELOAD_COOLDOWN_MS) return

  sessionStorage.setItem(STORAGE_KEY, String(now))
  window.location.reload()
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.error) || isChunkLoadError(event.message)) {
        reloadOnce()
      }
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isChunkLoadError(event.reason)) {
        reloadOnce()
      }
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [])

  return null
}
