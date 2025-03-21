import { CountdownTimer } from "@/components/countdown-timer"
import { Button } from "@/components/ui/button"
import { Calendar, ChevronRight, Medal, Star, Ticket, Users } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function Home() {
  // Definindo a data alvo como um objeto Date
  const targetDate = new Date("2025-10-03T20:00:00")

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-[#0456FC] text-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image src="/logo.svg" alt="JISC Logo" width={50} height={50} className="mr-3" />
          </div>
          <div className="space-x-2">
            <Link href="/login">
              <Button variant="outline" className="bg-[#93FF6D] text-black hover:bg-[#7de05c]">
                Entrar
              </Button>
            </Link>
            {/* <Link href="/register">
              <Button className="bg-[#93FF6D] text-black hover:bg-[#7de05c]">Cadastrar</Button>
            </Link> */}
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-b from-[#0456FC] to-blue-700 text-white py-24">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.svg')] opacity-10"></div>
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="flex justify-center mb-6">
              <Image src="/logo.svg" alt="JISC Logo" width={250} height={250} />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold mb-6">Campeonato Universitário JISC</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              A maior competição universitária com diversas modalidades esportivas e de boteco. Junte-se a nós para dias
              de competição, diversão e networking!
            </p>

            <div className="mb-10">
              <CountdownTimer targetDate={targetDate} />
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register?type=athlete">
                <Button size="lg" className="bg-[#93FF6D] text-black hover:bg-[#7de05c] font-bold px-8">
                  Inscrever-se como Atleta
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/register?type=buyer&restricted=true">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-black border-white hover:bg-white/20 font-bold px-8"
                >
                  Comprar Ingressos
                  <Ticket className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Funcionalidades da Plataforma</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Nossa plataforma oferece tudo o que você precisa para participar e acompanhar o campeonato
                universitário.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="bg-gray-50 p-8 rounded-xl shadow-sm text-center transform transition-transform hover:scale-105">
                <div className="w-16 h-16 bg-[#0456FC] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Gestão de Atletas</h3>
                <p className="text-gray-600">Cadastro e gerenciamento de jogadores das atléticas participantes.</p>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl shadow-sm text-center transform transition-transform hover:scale-105">
                <div className="w-16 h-16 bg-[#0456FC] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Medal className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Modalidades</h3>
                <p className="text-gray-600">Diversas modalidades esportivas e de boteco para todos os perfis.</p>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl shadow-sm text-center transform transition-transform hover:scale-105">
                <div className="w-16 h-16 bg-[#0456FC] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Agenda de Jogos</h3>
                <p className="text-gray-600">Controle da agenda e horários dos jogos para todas as modalidades.</p>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl shadow-sm text-center transform transition-transform hover:scale-105">
                <div className="w-16 h-16 bg-[#0456FC] rounded-full flex items-center justify-center mx-auto mb-6">
                  <Ticket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Ingressos</h3>
                <p className="text-gray-600">Venda e administração de ingressos para a festa pós-jogos.</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">Sobre o JISC</h2>
                <p className="text-gray-700 mb-6 text-lg">
                  O JISC (Jogos Interuniversitários Sociais e Culturais) é o maior evento universitário da região,
                  reunindo estudantes de diversas instituições em competições esportivas e culturais.
                </p>
                <p className="text-gray-700 mb-6 text-lg">
                  Com mais de 20 modalidades diferentes, o JISC proporciona uma experiência única de integração,
                  competição saudável e networking entre os futuros profissionais de diversas áreas.
                </p>
                <p className="text-gray-700 text-lg">
                  Além das competições, o JISC também promove festas e eventos sociais, criando memórias inesquecíveis
                  para todos os participantes.
                </p>
              </div>

              <div className="md:w-1/2 bg-[#0456FC] rounded-xl p-8 text-white shadow-xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center">
                  <Star className="mr-2 h-6 w-6 text-[#93FF6D]" />
                  Destaques do Evento
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="bg-[#93FF6D] text-black rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-0.5 font-bold">
                      1
                    </span>
                    <span className="text-lg">Mais de 20 modalidades esportivas e culturais</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-[#93FF6D] text-black rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-0.5 font-bold">
                      2
                    </span>
                    <span className="text-lg">Participação de mais de 15 universidades</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-[#93FF6D] text-black rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-0.5 font-bold">
                      3
                    </span>
                    <span className="text-lg">Premiações para as atléticas campeãs</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-[#93FF6D] text-black rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-0.5 font-bold">
                      4
                    </span>
                    <span className="text-lg">Festa de encerramento com atrações nacionais</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-[#93FF6D] text-black rounded-full w-8 h-8 flex items-center justify-center mr-4 mt-0.5 font-bold">
                      5
                    </span>
                    <span className="text-lg">Networking com estudantes de diversas áreas</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">O Que Dizem Sobre Nós</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Veja o que os participantes das edições anteriores têm a dizer sobre o JISC.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#0456FC] rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">M</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Mariana Silva</h4>
                    <p className="text-gray-600 text-sm">Atlética de Medicina</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "Participar do JISC foi uma experiência incrível! Além das competições, fiz amizades que vou levar
                  para a vida toda."
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#0456FC] rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">R</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Rafael Oliveira</h4>
                    <p className="text-gray-600 text-sm">Atlética de Engenharia</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "O nível de organização do JISC é impressionante. A plataforma facilitou muito o acompanhamento dos
                  jogos e a compra de ingressos."
                </p>
              </div>

              <div className="bg-gray-50 p-8 rounded-xl shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-[#0456FC] rounded-full flex items-center justify-center mr-4">
                    <span className="text-white font-bold">J</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Juliana Costa</h4>
                    <p className="text-gray-600 text-sm">Atlética de Direito</p>
                  </div>
                </div>
                <p className="text-gray-700">
                  "As competições são acirradas, mas o espírito esportivo prevalece. A festa de encerramento é
                  simplesmente inesquecível!"
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#0456FC] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Pronto para Participar?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Não perca a oportunidade de fazer parte do maior campeonato universitário da região!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/register?type=athlete">
                <Button size="lg" className="bg-[#93FF6D] text-black hover:bg-[#7de05c] font-bold px-8">
                  Inscrever-se como Atleta
                </Button>
              </Link>
              <Link href="/register?type=buyer&restricted=true">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-black border-white hover:bg-white/20 font-bold px-8"
                >
                  Comprar Ingressos
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center mb-6 md:mb-0">
              <Image src="/logo.svg" alt="JISC Logo" width={60} height={60} className="mr-4" />
              <div>
                <p className="text-gray-400">Campeonato Universitário</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Links Rápidos</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="/about" className="hover:text-[#93FF6D] transition-colors">
                      Sobre
                    </Link>
                  </li>
                  <li>
                    <Link href="/contact" className="hover:text-[#93FF6D] transition-colors">
                      Contato
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="hover:text-[#93FF6D] transition-colors">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Modalidades</h3>
                <ul className="space-y-2">
                  <li>
                    <Link href="#" className="hover:text-[#93FF6D] transition-colors">
                      Esportes
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-[#93FF6D] transition-colors">
                      Jogos de Boteco
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="hover:text-[#93FF6D] transition-colors">
                      Eventos
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4">Siga-nos</h3>
                <div className="flex space-x-4">
                  <a href="#" className="hover:text-[#93FF6D] transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </a>
                  <a href="#" className="hover:text-[#93FF6D] transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  </a>
                  <a href="#" className="hover:text-[#93FF6D] transition-colors">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 mt-8 text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} JISC. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

