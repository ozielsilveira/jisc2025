import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard/', '/api/', '/_next/', '/admin/', '/private/', '*.json', '*.xml']
    },
    sitemap: 'https://jisc.com.br/sitemap.xml',
    host: 'https://jisc.com.br'
  }
}
