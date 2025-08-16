'use client'

import RegisterPage from '@/components/register-page-client'

/**
 * Server wrapper component for the registration page.
 *
 * This file is intentionally kept as a server component (it does not use
 * `use client`) so that the metadata defined above can be exported.  The
 * interactive logic and state management for the registration form lives in
 * `page.client.tsx`, which is a client component.  Keeping the page as a
 * server component allows Next.js to inject metadata into the HTML during
 * server rendering while still using client‑side hooks inside the form.
 */
export default function RegisterClientPage() {
  return <RegisterPage />
}
