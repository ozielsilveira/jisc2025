'use client'

import { AnimatedSection } from '@/components/animated-section'
import { CountdownTimer } from '@/components/countdown-timer'
import { FeatureCard } from '@/components/feature-card'
import { ScrollToSection } from '@/components/scroll-to-section'
import { TestimonialCarousel } from '@/components/testimonial-carousel'
import { Button } from '@/components/ui/button'
import { Calendar, ChevronRight, Medal, Star, Ticket, Trophy, Users } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

// Define a type for the particle objects
interface Particle {
  id: number
  width: string
  height: string
  top: string
  left: string
  animationDuration: string
  animationDelay: string
}

export default function Home() {
  // Definindo a data alvo como um objeto Date
  const targetDate = new Date('2025-10-03T20:00:00')

  const videoRef = useRef<HTMLVideoElement>(null)

  // State for particle animations
  const [particles, setParticles] = useState<Particle[]>([])

  // Generate particles only on client-side to avoid hydration errors
  useEffect(() => {
    setParticles(
      Array.from({ length: 20 }).map((_, i) => ({
        id: i,
        width: `${Math.random() * 6 + 2}px`,
        height: `${Math.random() * 6 + 2}px`,
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        animationDuration: `${Math.random() * 10 + 10}s`,
        animationDelay: `${Math.random() * 5}s`
      }))
    )
  }, [])

  // Dados para os cards de funcionalidades
  // Dados para os cards de benefícios. Em vez de listar funcionalidades técnicas,
  // destacamos benefícios claros para o usuário, seguindo a orientação de priorizar
  // benefícios sobre características【819055788477698†L258-L272】.
  const benefits = [
    {
      title: 'Integração',
      description: 'Conheça estudantes de toda região, forme novas amizades e conexões.',
      icon: Users,
      animation: 'network'
    },
    {
      title: 'Diversão Garantida',
      description: 'Participe de competições esportivas e de boteco que unem desafio e entretenimento.',
      icon: Medal,
      animation: 'fun'
    },
    {
      title: 'Crescimento Pessoal',
      description: 'Desenvolva espírito de equipe, liderança e superação ao competir em alto nível.',
      icon: Trophy,
      animation: 'growth'
    },
    {
      title: 'Festa Inesquecível',
      description: 'Celebre com shows e atrações nacionais na festa de encerramento do JISC.',
      icon: Ticket,
      animation: 'party'
    }
  ]

  // Dados para a seção "Como funciona?". Cada passo ajuda o visitante a entender
  // como participar em três etapas simples. Explicar o processo reduz a incerteza
  // e aumenta as conversões【192654050897376†L163-L169】.
  const steps = [
    {
      title: 'Chame sua atlética',
      description: 'Inscreva-se como atleta e preencha seu cadastro em poucos minutos.',
      icon: Users
    },
    {
      title: 'Compita e comemore',
      description: 'Participe dos jogos, acumule pontos e comemore na grande festa de encerramento.',
      icon: Trophy
    },
    {
      title: 'Não perca a festa!',
      description: 'Participe da melhor festa universitária do Sul de Santa Catarina!',
      icon: Calendar
    }
  ]

  // Dados de preços para diferentes tipos de inscrição. Os planos são claros e
  // orientam o usuário na escolha, com CTAs em cada plano. Transparência de
  // preços é fundamental para ajudar o usuário a decidir【192654050897376†L163-L169】.
  const pricingOptions = [
    {
      name: 'Atleta',
      price: 'R$65',
      features: ['Participação em todas as modalidades', 'Acesso aos jogos de boteco', 'Camiseta oficial'],
      highlight: false
    },
    {
      name: 'Atleta + Festa',
      price: 'R$80',
      features: [
        'Participação em todas as modalidades',
        'Acesso aos jogos de boteco',
        'Acesso à festa de encerramento'
      ],
      highlight: true
    },
    {
      name: 'Atleta + Aloja',
      price: 'R$90',
      features: ['Participação em todas as modalidades', 'Acesso aos jogos de boteco', 'Alojamento durante os eventos'],
      highlight: false
    },
    {
      name: 'Atleta + Aloja + Festa',
      price: 'R$110',
      features: [
        'Participação em todas as modalidades',
        'Acesso aos jogos de boteco',
        'Acesso à festa de encerramento',
        'Alojamento durante os eventos'
      ],
      highlight: false
    }
  ]

  // Perguntas frequentes. Utilizamos elementos <details> para acessibilidade sem
  // dependência de JavaScript.
  const faqs = [
    {
      question: 'Como faço minha inscrição?',
      answer:
        'Chame sua atlética e em seguida, preencha seus dados pessoais e finalize o pagamento.'
    },
    {
      question: 'Qual é o valor da inscrição e o que está incluído?',
      answer:
        'O plano de atleta custa R$65 e inclui participação em todas as modalidades.'
    },
    {
      question: 'Quando e onde será o evento?',
      answer:
        'O JISC 2025 acontecerá de 3 a 7 de outubro de 2025 em Criciúma, Santa Catarina.'
    },
    {
      question: 'Sobre a festa de encerramento?',
      answer:
        'O Ingresso é garantido chamando as atléticas e ela ocorre no dia 11 de outubro de 2025 no Garden Gastropub em Criciúma, Santa Catarina.'
    }
  ]

  return (
    <div className='flex flex-col min-h-screen bg-black'>
      {/* Componente para gerenciar a navegação por âncoras */}
      <ScrollToSection />

      {/* Header com navegação moderna */}
      <header className='fixed w-full top-0 z-50 bg-black backdrop-blur-md supports-[backdrop-filter]:bg-black'>
        <div className='container mx-auto px-4 py-3 flex justify-between items-center'>
          <div className='flex items-center'>
            <Image src='/logo.svg' alt='JISC Logo' width={40} height={40} className='mr-2' />
          </div>
          <nav className='hidden md:flex items-center space-x-8'>
            <a
              href='#beneficios'
              className='text-white hover:text-[#C200F7] transition-colors text-sm font-medium cursor-pointer'
              aria-label='Ver benefícios do evento'
            >
              Benefícios
            </a>
            <a
              href='#como-funciona'
              className='text-white hover:text-[#C200F7] transition-colors text-sm font-medium cursor-pointer'
              aria-label='Entenda como funciona o evento'
            >
              Como funciona
            </a>
            <a
              href='#pricing'
              className='text-white hover:text-[#C200F7] transition-colors text-sm font-medium cursor-pointer'
              aria-label='Ver planos e valores de inscrição'
            >
              Planos
            </a>
            <a
              href='#testimonials'
              className='text-white hover:text-[#C200F7] transition-colors text-sm font-medium cursor-pointer'
              aria-label='Ver depoimentos'
            >
              Depoimentos
            </a>
            <a
              href='#faq'
              className='text-white hover:text-[#C200F7] transition-colors text-sm font-medium cursor-pointer'
              aria-label='Perguntas frequentes'
            >
              FAQ
            </a>
            <a
              href='#contact'
              className='text-white hover:text-[#C200F7] transition-colors text-sm font-medium cursor-pointer'
              aria-label='Entrar em contato'
            >
              Contato
            </a>
          </nav>
          <div>
            <Link href='/login'>
              <Button
                variant='outline'
                className='bg-[#C200F7] text-white hover:bg-[#C200F7]/80 font-medium border-0'
                aria-label='Fazer login na plataforma'
              >
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className='flex-grow pt-16'>
        {/* Hero Section com design impactante e vídeo */}
        <section className='relative bg-black text-white overflow-hidden dark:bg-black'>
          {/* Background elements */}
          <div className='absolute inset-0 z-0'>
            <div className='absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#C200F7] via-black to-black opacity-90 dark:opacity-80'></div>
            <div className='absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-[#07F2F2] blur-[120px] opacity-40 animate-pulse'></div>
            <div className='absolute bottom-1/4 left-1/4 w-96 h-96 rounded-full bg-[#C200F7] blur-[120px] opacity-30 animate-pulse'></div>
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>

            {/* Partículas animadas */}
            <div className='particles-container absolute inset-0 overflow-hidden'>
              {particles.map((particle) => (
                <div
                  key={particle.id}
                  className='particle absolute rounded-full bg-[#07F2F2] opacity-40 animate-float'
                  style={{
                    width: particle.width,
                    height: particle.height,
                    top: particle.top,
                    left: particle.left,
                    animationDuration: particle.animationDuration,
                    animationDelay: particle.animationDelay
                  }}
                ></div>
              ))}
            </div>
          </div>

          <div className='container mx-auto px-4 py-24 md:py-32 lg:py-40 relative z-10'>
            <div className='max-w-5xl mx-auto'>
              <AnimatedSection>
                <div className='flex flex-col items-center text-center mb-12'>
                  <div className='inline-flex items-center justify-center p-1 mb-8 rounded-full bg-[#C200F7]/20 backdrop-blur-sm'>
                    <div className='px-4 py-1 rounded-full bg-[#07F2F2] text-black font-medium text-sm animate-pulse'>
                      Inscrições Abertas
                    </div>
                  </div>

                  <h1 className='text-5xl sm:text-6xl md:text-7xl font-display font-bold mb-6 tracking-wider leading-tight'>
                    Campeonato Universitário <span className='text-[#C200F7]'>JISC</span>
                  </h1>

                  <p className='text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-12'>
                    A maior competição universitária com diversas modalidades esportivas e de boteco. Junte-se a nós
                    para dias de competição, diversão e Integração!
                  </p>

                  <div className='mb-12 w-full max-w-2xl'>
                    <CountdownTimer targetDate={targetDate} />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>

          {/* Wave divider */}
          <div className='absolute bottom-0 left-0 right-0'>
            <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 120' className='w-full h-auto'>
              <path
                fill='currentColor'
                fillOpacity='1'
                d='M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z'
                className='text-purple-600 dark:text-gray-950'
              ></path>
            </svg>
          </div>
        </section>

        {/* FAQ Section moved after testimonials. Removed from here to avoid duplicate positioning. */}

        {/* CTA rápida no meio da página */}
        <section className='py-6 bg-black dark:bg-black'>
          <div className='container mx-auto px-4'>
            <div className='flex flex-wrap justify-center gap-4 text-sm'>
              <a
                href='#gallery'
                className='flex items-center gap-2 px-4 py-2 bg-[#07F2F2]/20 text-[#07F2F2] rounded-full hover:bg-[#07F2F2]/30 transition-colors cursor-pointer'
                aria-label='Ver galeria de fotos do evento'
              >
                <span>👀</span> Ver fotos!
              </a>
              <Link
                href='/register?type=buyer&restricted=true'
                className='flex items-center gap-2 px-4 py-2 bg-[#C200F7]/20 text-[#C200F7] rounded-full hover:bg-[#C200F7]/30 transition-colors'
                aria-label='Comprar ingressos para o evento'
              >
                <span>🎟️</span> Comprar ingresso!
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <AnimatedSection>
          <section className='py-16 bg-black dark:bg-black'>
            <div className='container mx-auto px-4'>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
                <div className='text-center'>
                  <div className='text-4xl md:text-5xl font-display font-bold text-[#C200F7] mb-2 tracking-wider'>
                    20+
                  </div>
                  <p className='text-white/70'>Modalidades</p>
                </div>
                <div className='text-center'>
                  <div className='text-4xl md:text-5xl font-display font-bold text-[#C200F7] mb-2 tracking-wider'>
                    5
                  </div>
                  <p className='text-white/70'>Universidades</p>
                </div>
                <div className='text-center'>
                  <div className='text-4xl md:text-5xl font-display font-bold text-[#C200F7] mb-2 tracking-wider'>
                    900+
                  </div>
                  <p className='text-white/70'>Atletas</p>
                </div>
                <div className='text-center'>
                  <div className='text-4xl md:text-5xl font-display font-bold text-[#C200F7] mb-2 tracking-wider'>
                    2.5k+
                  </div>
                  <p className='text-white/70'>Publico</p>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        {/* Partners Section */}
        {/* <AnimatedSection>
          <section className='py-16 bg-black dark:bg-black'>
            <div className='container mx-auto px-4 text-center'>
              <h2 className='text-2xl md:text-3xl font-display font-bold mb-8 tracking-wide text-white'>
                Patrocinadores e Universidades Participantes
              </h2>
              <p className='text-white/70 max-w-3xl mx-auto mb-10'>
                Empresas e instituições que apoiam o JISC e tornam esse evento possível. O apoio de
                parceiros confiáveis aumenta a credibilidade e serve como prova social.
              </p>
              <div className='flex flex-wrap justify-center items-center gap-6'>
                {/* Placeholder logos – podem ser substituídos por imagens reais de universidades ou patrocinadores */}
        {/*
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={`partner-${idx}`}
                    className='w-24 h-12 rounded-xl bg-[#07F2F2]/10 flex items-center justify-center border border-[#07F2F2]/20'
                    aria-label='Logo de parceiro'
                  >
                    <span className='text-[#07F2F2] font-semibold'>Logo</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </AnimatedSection> */}

        {/* Benefits Section: destaca como o evento ajuda o usuário em vez de listar características técnicas */}
        <section id='beneficios' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <AnimatedSection>
              <div className='text-center mb-16'>
                <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                  BENEFÍCIOS
                </div>
                <h2 className='text-3xl md:text-4xl font-display font-bold mb-4 tracking-wide text-white'>
                  Por que participar do JISC?
                </h2>
                <p className='text-white/70 max-w-2xl mx-auto'>
                  Descubra o que o JISC oferece para você além das competições: conexões, diversão, crescimento e
                  experiências inesquecíveis.
                </p>
              </div>
            </AnimatedSection>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
              {benefits.map((benefit, index) => (
                <AnimatedSection key={benefit.title} delay={0.1 * (index + 1)}>
                  <FeatureCard
                    title={benefit.title}
                    description={benefit.description}
                    icon={benefit.icon}
                    animation={benefit.animation}
                  />
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id='como-funciona' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <AnimatedSection>
              <div className='text-center mb-16'>
                <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                  COMO FUNCIONA
                </div>
                <h2 className='text-3xl md:text-4xl font-display font-bold mb-4 tracking-wide text-white'>
                  Três Passos Simples para Participar
                </h2>
                <p className='text-white/70 max-w-2xl mx-auto'>
                  Participar do JISC é fácil: siga estes passos e garanta sua vaga no maior campeonato universitário da
                  região.
                </p>
              </div>
            </AnimatedSection>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {steps.map((step, index) => (
                <AnimatedSection key={step.title} delay={0.1 * (index + 1)}>
                  <div className='bg-[#0e0e0e] border border-[#C200F7]/20 rounded-xl p-8 flex flex-col items-center text-center h-full'>
                    <div className='w-12 h-12 rounded-full bg-[#C200F7]/20 flex items-center justify-center mb-4'>
                      {/* @ts-ignore */}
                      <step.icon className='w-6 h-6 text-[#C200F7]' />
                    </div>
                    <h3 className='text-xl font-bold text-white mb-2'>{step.title}</h3>
                    <p className='text-white/70'>{step.description}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id='pricing' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <AnimatedSection>
              <div className='text-center mb-16'>
                <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                  PLANOS
                </div>
                <h2 className='text-3xl md:text-4xl font-display font-bold mb-4 tracking-wide text-white'>
                  Escolha seu Plano
                </h2>
                <p className='text-white/70 max-w-2xl mx-auto'>
                  Selecione o plano que melhor se encaixa no seu perfil. Não escondemos informações e todos os planos
                  contam com uma chamada clara para ação, conforme recomendações de páginas de alta
                  conversão【819055788477698†L304-L323】.
                </p>
              </div>
            </AnimatedSection>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto'>
              {pricingOptions.map((option, index) => (
                <AnimatedSection key={option.name} delay={0.1 * (index + 1)}>
                  <div
                    className={`relative flex flex-col h-full p-8 rounded-xl border border-[#C200F7]/20 bg-[#0e0e0e] ${
                      option.highlight ? 'shadow-glow-purple' : ''
                    }`}
                  >
                    {option.highlight && (
                      <span className='absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold rounded-full bg-[#C200F7] text-white'>
                        Mais Popular
                      </span>
                    )}
                    <h3 className='text-2xl font-bold text-white mb-4 text-center'>{option.name}</h3>
                    <p className='text-4xl font-display font-bold text-[#C200F7] mb-4 text-center'>{option.price}</p>
                    <ul className='space-y-3 mb-6 flex-1'>
                      {option.features.map((feat) => (
                        <li key={feat} className='flex items-center'>
                          <ChevronRight className='h-4 w-4 text-[#07F2F2] mr-2' />
                          <span className='text-white/70'>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* About Section com design moderno */}
        <section id='about' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-16 items-center'>
              <AnimatedSection>
                <div>
                  <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                    SOBRE O EVENTO
                  </div>
                  <h2 className='text-3xl md:text-4xl font-display font-bold mb-6 tracking-wide text-white'>
                    Sobre o JISC
                  </h2>
                  <div className='space-y-6'>
                    <p className='text-white/70'>
                      O JISC (Jogos Interatléticas de Santa Catarina) é o maior evento universitário da região do sul,
                      reunindo estudantes de diversas instituições em competições esportivas.
                    </p>
                    <p className='text-white/70'>
                      Com mais de 20 modalidades diferentes, o JISC proporciona uma experiência única de integração,
                      competição saudável e networking entre os futuros profissionais de diversas áreas.
                    </p>
                    <p className='text-white/70'>
                      Além das competições, o JISC também promove festas e eventos sociais, criando memórias
                      inesquecíveis para todos os participantes.
                    </p>
                  </div>

                  <div className='mt-8 flex flex-wrap gap-4'>
                    <div className='flex items-center gap-2'>
                      <div className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7]'>
                        <Trophy className='w-5 h-5' />
                      </div>
                      <span className='text-white/90 font-medium'>Competições</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7]'>
                        <Users className='w-5 h-5' />
                      </div>
                      <span className='text-white/90 font-medium'>Integração</span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <div className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7]'>
                        <Star className='w-5 h-5' />
                      </div>
                      <span className='text-white/90 font-medium'>Entretenimento</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <div className='relative'>
                  <div className='absolute -top-6 -left-6 w-64 h-64 bg-[#C200F7]/10 rounded-full z-0 animate-pulse'></div>
                  <div className='absolute -bottom-6 -right-6 w-64 h-64 bg-[#07F2F2]/10 rounded-full z-0 animate-pulse'></div>

                  <div className='relative z-10 bg-black dark:bg-black rounded-2xl shadow-xl overflow-hidden border border-[#C200F7]/20'>
                    <div className='bg-gradient-to-r from-[#C200F7] to-[#9900c5] p-6 text-white'>
                      <h3 className='text-2xl font-display font-bold mb-2 flex items-center tracking-wide'>
                        <Star className='mr-2 h-6 w-6 text-[#07F2F2]' />
                        Destaques do Evento
                      </h3>
                      <p className='text-white/80'>Confira o que torna o JISC especial</p>
                    </div>

                    <div className='p-6'>
                      <ul className='space-y-4'>
                        <li className='flex items-start'>
                          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-[#C200F7] text-white font-bold mr-4 mt-0.5 flex-shrink-0'>
                            1
                          </div>
                          <div>
                            <h4 className='font-bold text-white'>Modalidades Diversas</h4>
                            <p className='text-white/70'>Mais de 20 modalidades esportivas e culturais</p>
                          </div>
                        </li>
                        <li className='flex items-start'>
                          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-[#C200F7] text-white font-bold mr-4 mt-0.5 flex-shrink-0'>
                            2
                          </div>
                          <div>
                            <h4 className='font-bold text-white'>Premiações</h4>
                            <p className='text-white/70'>Premiações para as atléticas campeãs</p>
                          </div>
                        </li>
                        <li className='flex items-start'>
                          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-[#C200F7] text-white font-bold mr-4 mt-0.5 flex-shrink-0'>
                            3
                          </div>
                          <div>
                            <h4 className='font-bold text-white'>Festa de Encerramento</h4>
                            <p className='text-white/70'>Festa com atrações nacionais</p>
                          </div>
                        </li>
                        <li className='flex items-start'>
                          <div className='flex items-center justify-center w-8 h-8 rounded-full bg-[#C200F7] text-white font-bold mr-4 mt-0.5 flex-shrink-0'>
                            4
                          </div>
                          <div>
                            <h4 className='font-bold text-white'>Integração</h4>
                            <p className='text-white/70'>Integração com estudantes de diversas áreas</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Gallery Section com imagens reais */}
        <section id='gallery' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <AnimatedSection>
              <div className='text-center mb-16'>
                <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                  GALERIA
                </div>
                <h2 className='text-3xl md:text-4xl font-display font-bold mb-4 tracking-wide text-white'>
                  Momentos Inesquecíveis
                </h2>
                <p className='text-white/70 max-w-2xl mx-auto'>
                  Confira alguns dos melhores momentos das edições anteriores do JISC.
                </p>
              </div>
            </AnimatedSection>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto'>
              <AnimatedSection delay={0.1}>
                <div className='rounded-xl overflow-hidden shadow-lg group relative'>
                  <Image
                    src='/trofeu.jpg'
                    alt='Competição de vôlei entre universitários durante o JISC 2024'
                    width={400}
                    height={800}
                    className='w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end'>
                    <div className='p-6'>
                      <h3 className='text-white font-bold'>Competições Esportivas</h3>
                      <p className='text-white/80 text-sm'>JISC 2024</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <div className='rounded-xl overflow-hidden shadow-lg group relative'>
                  <Image
                    src='/festa1.jpg'
                    alt='Festa de encerramento do JISC 2024 com show ao vivo'
                    width={400}
                    height={800}
                    className='w-full h-80 object-cover transition-transform duration-500 group-hover:scale-110'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end'>
                    <div className='p-6'>
                      <h3 className='text-white font-bold'>Festa de Encerramento</h3>
                      <p className='text-white/80 text-sm'>JISC 2024</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Testimonials Section com carousel */}
        <section id='testimonials' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <AnimatedSection>
              <div className='text-center mb-16'>
                <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                  DEPOIMENTOS
                </div>
                <h2 className='text-3xl md:text-4xl font-display font-bold mb-4 tracking-wide text-white'>
                  O Que Dizem Sobre Nós
                </h2>
                <p className='text-white/70 max-w-2xl mx-auto'>
                  Veja o que os participantes das edições anteriores têm a dizer sobre o JISC.
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <TestimonialCarousel />
            </AnimatedSection>
          </div>
        </section>

        {/* FAQ Section */}
        <section id='faq' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <AnimatedSection>
              <div className='text-center mb-16'>
                <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                  PERGUNTAS FREQUENTES
                </div>
                <h2 className='text-3xl md:text-4xl font-display font-bold mb-4 tracking-wide text-white'>F.A.Q.</h2>
                <p className='text-white/70 max-w-2xl mx-auto'>
                  Resolvemos algumas das dúvidas mais comuns para ajudar você a tomar sua decisão final.
                </p>
              </div>
            </AnimatedSection>
            <div className='max-w-3xl mx-auto space-y-6'>
              {faqs.map((faq, index) => (
                <AnimatedSection key={faq.question} delay={0.1 * (index + 1)}>
                  <details className='group border border-[#C200F7]/20 rounded-lg p-4 bg-[#0e0e0e]'>
                    <summary className='cursor-pointer flex items-center justify-between text-white font-medium'>
                      {faq.question}
                      <span className='ml-2 text-[#07F2F2] group-open:rotate-90 transition-transform'>➜</span>
                    </summary>
                    <p className='mt-3 text-white/70'>{faq.answer}</p>
                  </details>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section com design impactante */}
        <section className='py-24 bg-black text-white relative overflow-hidden dark:bg-black'>
          <div className='absolute inset-0 z-0'>
            <div className='absolute top-0 right-0 w-96 h-96 rounded-full bg-[#C200F7] blur-[120px] opacity-30 animate-pulse'></div>
            <div className='absolute bottom-0 left-0 w-96 h-96 rounded-full bg-[#07F2F2] blur-[120px] opacity-30 animate-pulse'></div>
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          </div>

          <div className='container mx-auto px-4 relative z-10'>
            <AnimatedSection>
              <div className='max-w-4xl mx-auto text-center'>
                <div className='inline-flex items-center justify-center p-1 mb-8 rounded-full bg-[#C200F7]/20 backdrop-blur-sm'>
                  <div className='px-4 py-1 rounded-full bg-[#07F2F2] text-black font-medium text-sm animate-pulse'>
                    Inscrições Limitadas
                  </div>
                </div>

                <h2 className='text-4xl md:text-5xl font-display font-bold mb-6 tracking-wide text-white'>
                  Pronto para Participar?
                </h2>

                <p className='text-xl text-white/80 mb-10 max-w-2xl mx-auto'>
                  Não perca a oportunidade de fazer parte do maior campeonato universitário da região! Vagas limitadas
                  para atletas e ingressos.
                </p>

                <div className='flex items-center justify-center space-x-2 text-white/60 text-sm'>
                  <Calendar className='h-4 w-4' />
                  <span>Evento começa em 03 de Outubro de 2025</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Contact Section */}
        <section id='contact' className='py-24 bg-black dark:bg-black scroll-mt-20'>
          <div className='container mx-auto px-4'>
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-16'>
              <AnimatedSection>
                <div>
                  <div className='inline-block bg-[#C200F7]/20 px-3 py-1 rounded-full text-[#C200F7] font-medium text-sm mb-4'>
                    CONTATO
                  </div>
                  <h2 className='text-3xl md:text-4xl font-display font-bold mb-6 tracking-wide text-white'>
                    Entre em Contato
                  </h2>
                  <p className='text-white/70 mb-8'>
                    Tem alguma dúvida sobre o JISC? Entre em contato conosco e teremos prazer em ajudar.
                  </p>

                  <div className='space-y-6'>
                    <div className='flex items-start'>
                      <div className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7] mr-4 flex-shrink-0'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <path d='M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z'></path>
                          <polyline points='22,6 12,13 2,6'></polyline>
                        </svg>
                      </div>
                      <div>
                        <h4 className='font-bold text-white mb-1'>Email</h4>
                        <p className='text-white/70'>jogosjisc@gmail.com</p>
                      </div>
                    </div>

                    <div className='flex items-start'>
                      <div className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7] mr-4 flex-shrink-0'>
                        <svg
                          xmlns='http://www.w3.org/2000/svg'
                          className='h-5 w-5'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <path d='M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z'></path>
                          <circle cx='12' cy='10' r='3'></circle>
                        </svg>
                      </div>
                      <div>
                        <h4 className='font-bold text-white mb-1'>Endereço</h4>
                        <p className='text-white/70'>Av. Universitária, 1105 - Universitário, Criciúma - SC, 88806-000</p>
                      </div>
                    </div>
                  </div>

                  <div className='mt-8 flex space-x-4'>
                    <a
                      href='#'
                      className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7] hover:bg-[#C200F7] hover:text-white transition-colors'
                      aria-label='Visite nossa página no Facebook'
                    >
                      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                        <path
                          fillRule='evenodd'
                          d='M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z'
                          clipRule='evenodd'
                        ></path>
                      </svg>
                    </a>
                    <a
                      href='#'
                      className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7] hover:bg-[#C200F7] hover:text-white transition-colors'
                      aria-label='Siga-nos no Instagram'
                    >
                      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                        <path
                          fillRule='evenodd'
                          d='M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z'
                          clipRule='evenodd'
                        ></path>
                      </svg>
                    </a>
                    <a
                      href='#'
                      className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center text-[#C200F7] hover:bg-[#C200F7] hover:text-white transition-colors'
                      aria-label='Siga-nos no Twitter'
                    >
                      <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                        <path d='M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84'></path>
                      </svg>
                    </a>
                  </div>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.3}>
                <div className='bg-black dark:bg-black rounded-2xl p-8 shadow-lg border border-[#C200F7]/20'>
                  <h3 className='text-2xl font-display font-bold mb-6 tracking-wide text-white'>Envie uma Mensagem</h3>
                  <form className='space-y-6'>
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                      <div>
                        <label htmlFor='name' className='block text-sm font-medium text-white/70 mb-1'>
                          Nome
                        </label>
                        <input
                          type='text'
                          id='name'
                          className='w-full px-4 py-3 rounded-lg border border-[#C200F7]/30 focus:outline-none focus:ring-2 focus:ring-[#C200F7] focus:border-transparent bg-black text-white'
                          placeholder='Seu nome'
                          aria-label='Digite seu nome'
                        />
                      </div>
                      <div>
                        <label htmlFor='email' className='block text-sm font-medium text-white/70 mb-1'>
                          Email
                        </label>
                        <input
                          type='email'
                          id='email'
                          className='w-full px-4 py-3 rounded-lg border border-[#C200F7]/30 focus:outline-none focus:ring-2 focus:ring-[#C200F7] focus:border-transparent bg-black text-white'
                          placeholder='seu@email.com'
                          aria-label='Digite seu email'
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor='subject' className='block text-sm font-medium text-white/70 mb-1'>
                        Assunto
                      </label>
                      <input
                        type='text'
                        id='subject'
                        className='w-full px-4 py-3 rounded-lg border border-[#C200F7]/30 focus:outline-none focus:ring-2 focus:ring-[#C200F7] focus:border-transparent bg-black text-white'
                        placeholder='Assunto da mensagem'
                        aria-label='Digite o assunto da mensagem'
                      />
                    </div>
                    <div>
                      <label htmlFor='message' className='block text-sm font-medium text-white/70 mb-1'>
                        Mensagem
                      </label>
                      <textarea
                        id='message'
                        rows={4}
                        className='w-full px-4 py-3 rounded-lg border border-[#C200F7]/30 focus:outline-none focus:ring-2 focus:ring-[#C200F7] focus:border-transparent bg-black text-white'
                        placeholder='Sua mensagem'
                        aria-label='Digite sua mensagem'
                      ></textarea>
                    </div>
                    <div>
                      <button
                        type='submit'
                        className='w-full bg-[#C200F7] hover:bg-[#C200F7]/90 text-white font-medium py-3 px-4 rounded-lg transition-colors shadow-glow-purple'
                        aria-label='Enviar mensagem'
                        onClick={(e) => {
                          e.preventDefault()
                          alert('Mensagem enviada com sucesso! Entraremos em contato em breve.')
                        }}
                      >
                        Enviar Mensagem
                      </button>
                    </div>
                  </form>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>
      </main>

      {/* Footer com design moderno */}
      <footer className='bg-black text-white pt-16 pb-8 dark:bg-black'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12'>
            <div>
              <div className='flex items-center mb-6'>
                <Image src='/logo.svg' alt='JISC Logo' width={50} height={50} className='mr-3' />
              </div>
              <p className='text-white/70 mb-6'>
                O maior campeonato universitário da região, unindo esporte, cultura e integração.
              </p>
              <div className='flex space-x-4'>
                <a
                  href='#'
                  className='w-10 h-10 rounded-full bg-[#C200F7]/20 flex items-center justify-center hover:bg-[#C200F7] transition-colors'
                  aria-label='Siga-nos no Instagram'
                >
                  <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 24 24' aria-hidden='true'>
                    <path
                      fillRule='evenodd'
                      d='M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z'
                      clipRule='evenodd'
                    ></path>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h3 className='text-lg font-bold mb-6 text-[#07F2F2]'>Links Rápidos</h3>
              <ul className='space-y-4'>
                <li>
                  <a
                    href='#beneficios'
                    className='text-white/70 hover:text-[#C200F7] transition-colors flex items-center cursor-pointer'
                    aria-label='Ver benefícios do evento'
                  >
                    <ChevronRight className='h-4 w-4 mr-2' />
                    Benefícios
                  </a>
                </li>
                <li>
                  <a
                    href='#como-funciona'
                    className='text-white/70 hover:text-[#C200F7] transition-colors flex items-center cursor-pointer'
                    aria-label='Entenda como funciona o evento'
                  >
                    <ChevronRight className='h-4 w-4 mr-2' />
                    Como Funciona
                  </a>
                </li>
                <li>
                  <a
                    href='#pricing'
                    className='text-white/70 hover:text-[#C200F7] transition-colors flex items-center cursor-pointer'
                    aria-label='Ver planos e valores de inscrição'
                  >
                    <ChevronRight className='h-4 w-4 mr-2' />
                    Planos
                  </a>
                </li>
                <li>
                  <a
                    href='#faq'
                    className='text-white/70 hover:text-[#C200F7] transition-colors flex items-center cursor-pointer'
                    aria-label='Perguntas frequentes'
                  >
                    <ChevronRight className='h-4 w-4 mr-2' />
                    FAQ
                  </a>
                </li>
                <li>
                  <a
                    href='#contact'
                    className='text-white/70 hover:text-[#C200F7] transition-colors flex items-center cursor-pointer'
                    aria-label='Entrar em contato'
                  >
                    <ChevronRight className='h-4 w-4 mr-2' />
                    Contato
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className='border-t border-[#C200F7]/20 pt-8 text-center'>
            <p className='text-white/70'>&copy; {new Date().getFullYear()} JISC. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
