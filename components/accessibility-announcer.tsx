'use client'

import { useEffect, useRef } from 'react'

interface AccessibilityAnnouncerProps {
  message: string
  priority?: 'polite' | 'assertive'
  clearAfter?: number
}

export function AccessibilityAnnouncer({
  message,
  priority = 'polite',
  clearAfter = 3000
}: AccessibilityAnnouncerProps) {
  const announcerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (message && announcerRef.current) {
      announcerRef.current.textContent = message

      if (clearAfter > 0) {
        const timer = setTimeout(() => {
          if (announcerRef.current) {
            announcerRef.current.textContent = ''
          }
        }, clearAfter)

        return () => clearTimeout(timer)
      }
    }
  }, [message, clearAfter])

  return <div ref={announcerRef} aria-live={priority} aria-atomic='true' className='sr-only' role='status' />
}

export function useAnnouncer() {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.getElementById('announcements')
    if (announcer) {
      announcer.setAttribute('aria-live', priority)
      announcer.textContent = message

      setTimeout(() => {
        announcer.textContent = ''
      }, 3000)
    }
  }

  return { announce }
}
