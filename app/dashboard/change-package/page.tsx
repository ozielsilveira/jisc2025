'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Loader2, PackageIcon, CheckCircle, AlertCircle, Info, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { athleteService, packagesService, athletePackagesService } from '@/lib/services'
import { Alert, AlertDescription } from '@/components/ui/alert'

type Package = {
  id: string
  name: string
  description: string
  price: number
  is_active: boolean
}

type AthletePackage = {
  id: string
  package: Package
  payment_status: string
}

export default function ChangePackagePage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  
  // Estados principais
  const [packages, setPackages] = React.useState<Package[]>([])
  const [loading, setLoading] = React.useState(true)
  const [selectedPackageId, setSelectedPackageId] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isChangeLocked, setIsChangeLocked] = React.useState(false)
  
  // Estados do atleta e pacote atual
  const [athlete, setAthlete] = React.useState<any>(null)
  const [currentPackage, setCurrentPackage] = React.useState<AthletePackage | null>(null)
  const [pendingPackage, setPendingPackage] = React.useState<AthletePackage | null>(null)
  
  // Estados de erro e validação
  const [error, setError] = React.useState<string | null>(null)
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])

  // Carregar dados iniciais
  React.useEffect(() => {
    const fetchData = async () => {
      if (!user) return
      
      setLoading(true)
      setError(null)
      setValidationErrors([])
      
      try {
        // Carregar pacotes disponíveis (sempre dados frescos, sem cache)
        const availablePackages = await packagesService.getAllFresh()
        setPackages(availablePackages)

        // Carregar dados do atleta (sempre dados frescos, sem cache)
        const athleteData = await athleteService.getByUserIdFresh(user.id)
        if (!athleteData) {
          throw new Error('Atleta não encontrado')
        }
        
        setAthlete(athleteData)
        
        // Bloquear alteração para admin_athlete
        if (athleteData.admin_athlete) {
          setIsChangeLocked(true)
        }

        // Identificar pacote atual (completed) e pendente (pending)
        if (athleteData.athlete_packages && Array.isArray(athleteData.athlete_packages)) {
          const completed = athleteData.athlete_packages.find(
            (ap: AthletePackage) => ap.payment_status === 'completed'
          )
          const pending = athleteData.athlete_packages.find(
            (ap: AthletePackage) => ap.payment_status === 'pending'
          )
          
          setCurrentPackage(completed || null)
          setPendingPackage(pending || null)
        }
        
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error)
        setError(error.message || 'Erro ao carregar dados')
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível buscar os pacotes disponíveis.',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  // Validar seleção de pacote
  const validatePackageSelection = (packageId: string): string[] => {
    const errors: string[] = []
    
    if (!packageId) {
      errors.push('Nenhum pacote foi selecionado')
      return errors
    }
    
    // Verificar se é o mesmo pacote atual
    if (currentPackage && currentPackage.package.id === packageId) {
      errors.push('Este já é o seu pacote atual')
    }
    
    return errors
  }

  // Selecionar pacote
  const handleSelectPackage = (packageId: string) => {
    
    // Não permitir seleção do pacote atual
    if (currentPackage && currentPackage.package.id === packageId) {
      toast({
        title: 'Pacote já ativo',
        description: 'Este já é o seu pacote atual.',
        variant: 'default'
      })
      return
    }
    
    setSelectedPackageId(packageId)
    setValidationErrors([])
  }

  // Confirmar alteração
  const handleSubmit = async () => {
    if (!selectedPackageId || !user || !athlete) {
      toast({
        title: 'Dados inválidos',
        description: 'Por favor, verifique os dados e tente novamente.',
        variant: 'destructive'
      })
      return
    }

    // Validações finais
    const errors = validatePackageSelection(selectedPackageId)
    if (errors.length > 0) {
      setValidationErrors(errors)
      toast({
        title: 'Validação falhou',
        description: errors.join('. '),
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)
    setError(null)
    setValidationErrors([])

    try {
      // Usar o serviço para alterar o pacote com regras de status
      await athletePackagesService.changeAthletePackage(athlete.id, selectedPackageId)

             // Atualizar estado local
       const selectedPkg = packages.find(p => p.id === selectedPackageId)
       if (selectedPkg) {
         const newPendingPackage: AthletePackage = {
           id: 'temp-id', // ID temporário, será atualizado quando recarregar os dados
           package: selectedPkg,
           payment_status: 'pending'
         }
         setPendingPackage(newPendingPackage)
       }
      
      // Limpar seleção
      setSelectedPackageId(null)
      
      // Invalidar cache para garantir dados atualizados
      athleteService.invalidateAthlete(athlete.id)
      athleteService.invalidateList()
      
      // Mostrar sucesso
      toast({
        title: 'Pacote alterado com sucesso!',
        description: 'Sua solicitação foi registrada. Prossiga para o pagamento.',
        variant: 'default'
      })
      
      // Redirecionar para o perfil
      router.push('/dashboard/profile')
      
    } catch (error: any) {
      console.error('Erro ao alterar pacote:', error)
      setError(error.message || 'Erro interno ao alterar pacote')
      toast({
        title: 'Erro ao alterar pacote',
        description: error.message || 'Não foi possível alterar o seu pacote. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancelar operação
  const handleCancel = () => {
    router.back()
  }

  // Renderizar card de pacote
  const renderPackageCard = (pkg: Package) => {
    const isSelected = selectedPackageId === pkg.id
    const isCurrent = currentPackage?.package.id === pkg.id
    const isPending = pendingPackage?.package.id === pkg.id

    let cardClasses = 'transition-all duration-200 rounded-lg'
    let isDisabled = isChangeLocked
    let statusText = ''
    let statusIcon = null
    let statusColor = ''

    if (isCurrent || isPending) {
      cardClasses += ' border-2 border-green-500 bg-green-50'
      isDisabled = true
      statusText = 'Pacote Atual'
      statusIcon = <CheckCircle className="h-5 w-5 text-green-600" />
      statusColor = 'text-green-600'
    } else if (isSelected) {
      cardClasses += ' border-2 border-[#0456FC] shadow-lg bg-blue-50'
    } else {
      cardClasses += ' border border-gray-200 hover:border-[#0456FC] hover:shadow-md'
    }

    return (
      <Card
        key={pkg.id}
        className={cardClasses}
        onClick={isDisabled ? undefined : () => handleSelectPackage(pkg.id)}
      >
        <CardHeader>
          <div className='flex items-center space-x-4'>
            <div className='p-3 bg-blue-100 rounded-lg'>
              <PackageIcon className='h-6 w-6 text-[#0456FC]' />
            </div>
            <div className='flex-1'>
              <CardTitle className={isDisabled ? 'text-gray-500' : ''}>
                {pkg.name}
              </CardTitle>
              <CardDescription className={isDisabled ? 'text-gray-400' : ''}>
                {pkg.description}
              </CardDescription>
            </div>
            {/* Status do pacote */}
            {(isCurrent || isPending) && (
              <div className={`flex items-center space-x-2 ${statusColor}`}>
                {statusIcon}
                <span className='text-sm font-semibold'>{statusText}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className={`text-2xl font-bold ${isDisabled ? 'text-gray-400' : ''}`}>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(pkg.price)}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='max-w-4xl mx-auto'>
        <div className='space-y-6'>
          {/* Header */}
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='text-3xl font-bold'>Alterar Pacote</h1>
              <p className='text-gray-500'>
                Selecione um novo pacote para alterar sua assinatura atual.
              </p>
            </div>
          </div>

          {/* Alertas de informação */}
          {isChangeLocked && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <Lock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                <strong>Alteração de Pacote Bloqueada:</strong> Atletas administradores não podem
                alterar o pacote diretamente. Entre em contato com o suporte.
              </AlertDescription>
            </Alert>
          )}

          {currentPackage && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Pacote Atual:</strong> {currentPackage.package.name} - 
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(currentPackage.package.price)}
              </AlertDescription>
            </Alert>
          )}

          {/* Erros de validação */}
          {validationErrors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {validationErrors.map((error, index) => (
                  <div key={index} className="mb-1 last:mb-0">
                    • {error}
                  </div>
                ))}
              </AlertDescription>
            </Alert>
          )}

          {/* Erro geral */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Loading */}
          {loading ? (
            <div className='flex justify-center items-center h-64'>
              <Loader2 className='h-8 w-8 animate-spin text-[#0456FC]' />
            </div>
          ) : (
            /* Lista de pacotes */
            <div className='space-y-4'>
              {packages.map(renderPackageCard)}
            </div>
          )}

          {/* Botões de ação */}
          <div className='flex justify-end space-x-4 mt-8'>
            <Button 
              variant='outline' 
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isChangeLocked ||
                !selectedPackageId ||
                isSubmitting ||
                (!!currentPackage && selectedPackageId === currentPackage.package.id)
              }
              className='bg-[#0456FC] hover:bg-[#0456FC]/90'
            >
              {isSubmitting ? (
                <>
                  <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  Processando...
                </>
              ) : (
                'Confirmar Alteração'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}