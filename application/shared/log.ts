export function devLog(scope: string, payload?: unknown, error?: unknown) {
  if (process.env.NODE_ENV !== 'development') return
  const ts = new Date().toISOString()
  // eslint-disable-next-line no-console
  console.group(`🔍 [${scope}] ${ts}`)
  if (payload) console.log('data:', payload)
  if (error) console.error('error:', (error as any)?.message ?? error)
  console.groupEnd()
}
