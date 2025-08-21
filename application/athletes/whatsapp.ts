export function formatApproveMessage(athleteName: string, packageName: string, price: number): string {
  const formattedPrice = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price)
  return `Olá ${athleteName}, você adquiriu o pacote ${packageName} no valor ${formattedPrice}, abaixo temos nossos métodos de pagamentos:`
}

export function formatRejectMessage(athleteName: string, customMessage?: string, origin?: string): string {
  const base = `Olá ${athleteName}!\n\nSeu cadastro de atleta foi rejeitado e precisa ser ajustado.`
  const custom = customMessage ? `\n\nMotivo da rejeição:\n${customMessage}` : ''
  const link = `\n\nPor favor, acesse o link abaixo para corrigir as informações e reenviar sua documentação:\n${origin ?? ''}/dashboard/profile\n\nQualquer dúvida, entre em contato conosco!`
  return base + custom + link
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const clean = phoneNumber.replace(/\D/g, '')
  const formatted = clean.startsWith('55') ? clean : `55${clean}`
  return `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`
}
