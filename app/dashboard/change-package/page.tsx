'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Loader2, PackageIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { athleteService, packagesService } from '@/lib/services'


type Package = {
  id: string
  name: string
  description: string
  price: number
}

export default function ChangePackagePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [packages, setPackages] = React.useState<Package[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedPackageId, setSelectedPackageId] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [currentPackageId, setCurrentPackageId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const availablePackages = await packagesService.getAll()
        setPackages(availablePackages)

        if (user) {
          const athlete = await athleteService.getByUserId(user.id)
          if (athlete && Array.isArray(athlete.athlete_packages)) {
            const activeEntry = athlete.athlete_packages[0].package.id
            
            if (activeEntry && activeEntry !== currentPackageId) {
              setCurrentPackageId(activeEntry)
              setSelectedPackageId(null)
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados de pacotes ou atleta:', error)
        toast({
          title: 'Erro ao carregar pacotes',
          description: 'Não foi possível buscar os pacotes disponíveis.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const handleSelectPackage = (packageId: string) => {
    setSelectedPackageId(packageId)
  }

  const handleSubmit = async () => {
    if (!selectedPackageId || !user) {
      toast({
        title: 'Nenhum pacote selecionado',
        description: 'Por favor, selecione um pacote para continuar.',
        variant: 'destructive'
      })
      return
    }

    if (currentPackageId && selectedPackageId === currentPackageId) {
      toast({
        title: 'Pacote já ativo',
        description: 'Este já é o seu pacote atual.',
        variant: 'default'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const athlete = await athleteService.getByUserId(user.id)

      if (!athlete) {
        throw new Error('Atleta não encontrado. Não é possível alterar o pacote.')
      }

      const existingPending = athlete.athlete_packages?.find(
        (p: any) => p.package.id === selectedPackageId && p.payment_status === 'pending'
      )
      if (existingPending) {
        toast({
          title: 'Pacote já selecionado',
          description: 'Você já tem uma solicitação pendente para este pacote.',
          variant: 'default'
        })
        router.push('/dashboard/profile')
        return
      }

      const { error: insertError } = await supabase.from('athlete_packages').update({
        package_id: selectedPackageId,
        payment_status: 'pending'
      }).eq('athlete_id', athlete.id)

      if (insertError) {
        throw insertError
      }
      setCurrentPackageId(selectedPackageId)
      setSelectedPackageId(null)
      
      athleteService.invalidateAthlete(athlete.id)
      athleteService.invalidateList()

      toast({
        title: 'Pacote alterado com sucesso!',
        description: 'Sua solicitação foi registrada. Prossiga para o pagamento.',
        variant: 'success'
      })
      router.push('/dashboard/profile')
    } catch (error: any) {
      console.error('Error changing package:', error)
      toast({
        title: 'Erro ao alterar o pacote',
        description: error.message || 'Não foi possível alterar o seu pacote. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='max-w-3xl mx-auto'>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold'>Alterar Pacote</h1>
              <p className='text-gray-500'>Selecione um dos pacotes abaixo para continuar.</p>
            </div>
          </div>

          {loading ? (
            <div className='flex justify-center items-center h-64'>
              <Loader2 className='h-8 w-8 animate-spin text-[#0456FC]' />
            </div>
          ) : (
            <div className='space-y-4'>
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id
                const isCurrent = currentPackageId === pkg.id

                let cardClasses = 'transition-all rounded-lg'
                if (isCurrent) {
                  cardClasses += ' border-2 border-green-500 bg-green-50 cursor-not-allowed'
                } else if (isSelected) {
                  cardClasses += ' border-2 border-[#0456FC] shadow-lg cursor-pointer'
                } else {
                  cardClasses += ' cursor-pointer hover:shadow-md'
                }

                return (
                  <Card
                    key={pkg.id}
                    className={cardClasses}
                    onClick={isCurrent ? undefined : () => handleSelectPackage(pkg.id)}
                  >
                    <CardHeader>
                      <div className='flex items-center space-x-4'>
                        <div className='p-3 bg-blue-100 rounded-lg'>
                          <PackageIcon className='h-6 w-6 text-[#0456FC]' />
                        </div>
                        <div>
                          <CardTitle>{pkg.name}</CardTitle>
                          <CardDescription>{pkg.description}</CardDescription>
                        </div>
                        {/* Show a small label when this package is the athlete's current active package */}
                        {isCurrent && (
                          <span className='ml-auto text-sm font-semibold text-green-600'>Atual</span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className='text-2xl font-bold'>
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(pkg.price)}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          <div className='flex justify-end space-x-4 mt-6'>
            <Button variant='outline' onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!selectedPackageId || isSubmitting || selectedPackageId === currentPackageId}
              className='bg-[#0456FC] hover:bg-[#0456FC]/90'
            >
              {isSubmitting ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Confirmar Alteração'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}