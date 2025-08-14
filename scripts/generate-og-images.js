const fs = require('fs')
const path = require('path')

// Configurações das imagens Open Graph
const ogImages = [
  {
    name: 'og-home.jpg',
    title: 'JISC 2025',
    subtitle: 'Jogos Interuniversitários Sociais e Culturais',
    description: 'Maior campeonato universitário do Brasil',
    color: '#C200F7'
  },
  {
    name: 'og-register.jpg',
    title: 'Cadastro JISC 2025',
    subtitle: 'Inscreva-se agora!',
    description: 'Atletas • Atléticas • Ingressos',
    color: '#07F2F2'
  },
  {
    name: 'og-login.jpg',
    title: 'Login JISC 2025',
    subtitle: 'Acesse sua conta',
    description: 'Painel de controle • Gestão • Competições',
    color: '#0456FC'
  },
  {
    name: 'og-dashboard.jpg',
    title: 'Dashboard JISC 2025',
    subtitle: 'Painel de controle',
    description: 'Gerencie • Acompanhe • Visualize',
    color: '#C200F7'
  }
]

// Template HTML para gerar as imagens
const generateOGImageHTML = (config) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${config.title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
            width: 1200px;
            height: 630px;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        .background-pattern {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: 
                radial-gradient(circle at 20% 80%, ${config.color}20 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, ${config.color}15 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, ${config.color}10 0%, transparent 50%);
        }
        
        .content {
            text-align: center;
            z-index: 10;
            padding: 60px;
            max-width: 1000px;
        }
        
        .logo {
            font-size: 48px;
            font-weight: 900;
            color: ${config.color};
            margin-bottom: 20px;
            text-shadow: 0 0 30px ${config.color}40;
        }
        
        .title {
            font-size: 72px;
            font-weight: 800;
            color: white;
            margin-bottom: 20px;
            line-height: 1.1;
        }
        
        .subtitle {
            font-size: 36px;
            font-weight: 600;
            color: ${config.color};
            margin-bottom: 30px;
            opacity: 0.9;
        }
        
        .description {
            font-size: 24px;
            color: #ffffff80;
            font-weight: 500;
            margin-bottom: 40px;
        }
        
        .badge {
            display: inline-block;
            background: ${config.color};
            color: white;
            padding: 12px 24px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .particles {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: ${config.color};
            border-radius: 50%;
            opacity: 0.6;
            animation: float 6s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .particle:nth-child(1) { top: 10%; left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { top: 20%; left: 80%; animation-delay: 1s; }
        .particle:nth-child(3) { top: 60%; left: 20%; animation-delay: 2s; }
        .particle:nth-child(4) { top: 80%; left: 70%; animation-delay: 3s; }
        .particle:nth-child(5) { top: 30%; left: 60%; animation-delay: 4s; }
    </style>
</head>
<body>
    <div class="background-pattern"></div>
    <div class="particles">
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
        <div class="particle"></div>
    </div>
    <div class="content">
        <div class="logo">🏆</div>
        <h1 class="title">${config.title}</h1>
        <h2 class="subtitle">${config.subtitle}</h2>
        <p class="description">${config.description}</p>
        <div class="badge">jisc.com.br</div>
    </div>
</body>
</html>
`

// Função para criar as imagens
async function generateOGImages() {
  console.log('🎨 Gerando imagens Open Graph...')

  const publicDir = path.join(__dirname, '../public')

  // Criar diretório se não existir
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  for (const config of ogImages) {
    const html = generateOGImageHTML(config)
    const htmlPath = path.join(publicDir, `${config.name.replace('.jpg', '.html')}`)

    // Salvar HTML temporário
    fs.writeFileSync(htmlPath, html)

    console.log(`✅ Gerado: ${config.name}`)
  }

  console.log('\n📝 Para gerar as imagens finais, você pode:')
  console.log('1. Abrir cada arquivo HTML no navegador')
  console.log('2. Fazer screenshot em 1200x630px')
  console.log('3. Salvar como JPG na pasta /public')
  console.log('\n🛠️ Ou usar ferramentas como:')
  console.log('- Puppeteer para automatizar')
  console.log('- Playwright para screenshots')
  console.log('- Serviços online de OG image generation')
}

// Executar se chamado diretamente
if (require.main === module) {
  generateOGImages().catch(console.error)
}

module.exports = { generateOGImages, ogImages }
