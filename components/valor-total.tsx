import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign } from 'lucide-react'
import { useAthletesList, usePackagesList } from '@/hooks/use-cached-data'

export function ValorTotal() {
  const { athletes, loading: athletesLoading, error: athletesError } = useAthletesList({ status: 'approved' })
  const { packages, loading: packagesLoading, error: packagesError } = usePackagesList()

  const valorTotal = athletes.reduce((total, athlete) => {
    const selectedPackage = athlete.athlete_packages?.[0]?.id
      ? packages.find((pkg) => pkg.id === athlete.athlete_packages?.[0].id)
      : null
    return total + (selectedPackage?.price || 0)
  }, 0)

  const loading = athletesLoading || packagesLoading
  const error = athletesError || packagesError

  if (loading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Valor Total</CardTitle>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>Calculando...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Valor Total</CardTitle>
          <DollarSign className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold text-destructive'>Erro</div>
          <p className='text-xs text-muted-foreground'>{error}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>Valor Total</CardTitle>
        <DollarSign className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>
          {new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          }).format(valorTotal)}
        </div>
        <p className='text-xs text-muted-foreground'>{athletes.length} atletas com pacotes selecionados</p>
      </CardContent>
    </Card>
  )
}
