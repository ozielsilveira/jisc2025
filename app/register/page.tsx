import type { Metadata } from 'next'
import RegisterPageClient from '@/components/register-page-client'

/**
 * Metadata for the registration page.
 *
 * This metadata is used by Next.js to inject SEO‑friendly tags into the <head>
 * of the HTML document. It defines a canonical title and description for the
 * signup page on jisc.com.br.  When the page is shared on social networks or
 * indexed by search engines, these values are used to present a meaningful
 * preview instead of a generic GUID URL.
 *
 * See Next.js documentation for more details on the Metadata API:
 * https://nextjs.org/learn/dashboard-app/adding-metadata
 */
export const metadata: Metadata = {
  title: 'Cadastro | JISC',
  description:
    'Crie sua conta no JISC para participar do maior campeonato universitário do sul do Brasil, comprar pacotes dos jogos e festas e gerenciar sua atlética.',
  metadataBase: new URL('https://jisc.com.br/register')
}

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
export default function RegisterPage() {
  return <RegisterPageClient />
}
