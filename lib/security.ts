// Input validation utilities
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.length <= 254
  }
  
  export const validatePassword = (password: string): boolean => {
    return password.length >= 8 && password.length <= 128
  }
  
  export const sanitizeInput = (input: string): string => {
    return input.trim().replace(/[<>]/g, "")
  }
  
  // Rate limiting store (in-memory for demo, use Redis in production)
  const rateLimitStore = new Map<string, { count: number; resetTime: number }>()
  
  export const checkRateLimit = (identifier: string, maxAttempts = 5, windowMs = 15 * 60 * 1000): boolean => {
    const now = Date.now()
    const record = rateLimitStore.get(identifier)
  
    if (!record || now > record.resetTime) {
      rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
      return true
    }
  
    if (record.count >= maxAttempts) {
      return false
    }
  
    record.count++
    return true
  }
  
  export const clearRateLimit = (identifier: string): void => {
    rateLimitStore.delete(identifier)
  }
  