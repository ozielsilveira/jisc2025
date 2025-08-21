// src/components/AthleteRegistrationCTA.tsx
import Link from 'next/link'
import { Award, Play } from 'lucide-react'
import { Card, CardContent, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface AthleteRegistrationCTAProps {
  visible: boolean
}

export function AthleteRegistrationCTA({ visible }: AthleteRegistrationCTAProps) {
  if (!visible) return null
  return (
    <Card className='border-2 border-[#0456FC] bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg'>
      <CardContent className='p-4 sm:p-6 flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:space-x-6'>
        <div className='flex items-start sm:items-center space-x-3 sm:space-x-4'>
          <Award className='h-8 w-8 sm:h-10 sm:w-10 text-[#0456FC] flex-shrink-0 mt-1 sm:mt-0' />
          <div>
            <CardTitle className='text-lg sm:text-xl font-bold text-gray-900 leading-tight'>
              Complete seu Cadastro de Atleta!
            </CardTitle>
            <CardDescription className='text-sm sm:text-base text-gray-700 mt-1 leading-relaxed'>
              Para participar das modalidades e competições, finalize seu registro. É rápido e fácil!
            </CardDescription>
          </div>
        </div>
        <Link href='/dashboard/profile' passHref>
          <Button className='w-full sm:w-auto bg-gradient-to-r from-[#0456FC] to-[#0345D1] hover:from-[#0345D1] hover:to-[#0234B8] text-white font-bold py-3 px-6 text-sm sm:text-base transition-all duration-200 shadow-md'>
            <Play className='h-4 w-4 sm:h-5 sm:w-5 mr-2' />
            Finalizar Cadastro
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
