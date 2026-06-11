'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const IDLE_TIMEOUT_MS = 60 * 60 * 1000

export function AdminSessionTimeout() {
  useEffect(() => {
    let timeoutId: number | undefined

    async function logoutByInactivity() {
      window.sessionStorage.removeItem('admin_user_role')
      window.localStorage.removeItem('admin_user_role')
      document.cookie = 'tenant_slug=; path=/; max-age=0; samesite=lax'

      try {
        await createClient().auth.signOut({ scope: 'global' })
      } finally {
        window.location.replace('/admin/logout?reason=idle')
      }
    }

    function resetTimer() {
      if (timeoutId) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        void logoutByInactivity()
      }, IDLE_TIMEOUT_MS)
    }

    const events = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
      'visibilitychange',
    ] as const

    events.forEach((eventName) => {
      window.addEventListener(eventName, resetTimer, { passive: true })
    })
    resetTimer()

    return () => {
      if (timeoutId) window.clearTimeout(timeoutId)
      events.forEach((eventName) => {
        window.removeEventListener(eventName, resetTimer)
      })
    }
  }, [])

  return null
}
