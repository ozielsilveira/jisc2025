// Tipos de chaves PIX
export type PixKeyType = 'cpf' | 'cnpj' | 'email' | 'phone' | 'random' | 'unknown'

// Função para validar CPF
export function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '')

  if (cpf.length !== 11) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cpf)) return false

  // Validação do primeiro dígito verificador
  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += Number.parseInt(cpf.charAt(i)) * (10 - i)
  }
  let remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(cpf.charAt(9))) return false

  // Validação do segundo dígito verificador
  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(cpf.charAt(i)) * (11 - i)
  }
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== Number.parseInt(cpf.charAt(10))) return false

  return true
}

// Função para validar CNPJ
export function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '')

  if (cnpj.length !== 14) return false

  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cnpj)) return false

  // Validação do primeiro dígito verificador
  let size = cnpj.length - 2
  let numbers = cnpj.substring(0, size)
  const digits = cnpj.substring(size)
  let sum = 0
  let pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += Number.parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number.parseInt(digits.charAt(0))) return false

  // Validação do segundo dígito verificador
  size = size + 1
  numbers = cnpj.substring(0, size)
  sum = 0
  pos = size - 7

  for (let i = size; i >= 1; i--) {
    sum += Number.parseInt(numbers.charAt(size - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number.parseInt(digits.charAt(1))) return false

  return true
}

// Função para validar e-mail
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Função para validar telefone
export function validatePhone(phone: string): boolean {
  // Remove todos os caracteres não numéricos
  phone = phone.replace(/[^\d]/g, '')

  // Verifica se o telefone tem entre 10 e 11 dígitos (com DDD)
  return phone.length >= 10 && phone.length <= 11
}

// Função para validar chave aleatória
export function validateRandomKey(key: string): boolean {
  // Chave aleatória do PIX deve ter 32 caracteres alfanuméricos
  const randomKeyRegex = /^[a-zA-Z0-9]{32}$/
  return randomKeyRegex.test(key)
}

// Função para detectar o tipo de chave PIX
export function detectPixKeyType(key: string): PixKeyType {
  // Remove espaços e caracteres especiais para análise
  const cleanKey = key.trim()

  // Verifica se é um CPF (11 dígitos)
  if (/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(cleanKey) || /^\d{11}$/.test(cleanKey)) {
    return 'cpf'
  }

  // Verifica se é um CNPJ (14 dígitos)
  if (/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/.test(cleanKey) || /^\d{14}$/.test(cleanKey)) {
    return 'cnpj'
  }

  // Verifica se é um e-mail
  if (cleanKey.includes('@') && validateEmail(cleanKey)) {
    return 'email'
  }

  // Verifica se é um telefone (com ou sem formatação)
  if (/^\+?55?\s?(?:\d{2}[\s-]?)?\d{4,5}[\s-]?\d{4}$/.test(cleanKey) || /^\d{10,11}$/.test(cleanKey)) {
    return 'phone'
  }

  // Verifica se é uma chave aleatória (32 caracteres alfanuméricos)
  if (/^[a-zA-Z0-9]{32}$/.test(cleanKey)) {
    return 'random'
  }

  return 'unknown'
}

// Função para validar uma chave PIX com base no tipo
export function validatePixKey(key: string, type: PixKeyType): boolean {
  switch (type) {
    case 'cpf':
      return validateCPF(key)
    case 'cnpj':
      return validateCNPJ(key)
    case 'email':
      return validateEmail(key)
    case 'phone':
      return validatePhone(key)
    case 'random':
      return validateRandomKey(key)
    default:
      return false
  }
}

// Função para formatar uma chave PIX para exibição
export function formatPixKey(key: string, type: PixKeyType): string {
  switch (type) {
    case 'cpf':
      key = key.replace(/[^\d]/g, '')
      return key.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    case 'cnpj':
      key = key.replace(/[^\d]/g, '')
      return key.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    case 'phone':
      key = key.replace(/[^\d]/g, '')
      if (key.length === 11) {
        return key.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      } else if (key.length === 10) {
        return key.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      }
      return key
    case 'email':
    case 'random':
    default:
      return key
  }
}

// Função para obter o label do tipo de chave PIX
export function getPixKeyTypeLabel(type: PixKeyType): string {
  switch (type) {
    case 'cpf':
      return 'CPF'
    case 'cnpj':
      return 'CNPJ'
    case 'email':
      return 'E-mail'
    case 'phone':
      return 'Telefone'
    case 'random':
      return 'Chave Aleatória'
    default:
      return 'Desconhecido'
  }
}
