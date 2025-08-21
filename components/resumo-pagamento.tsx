import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Receipt } from 'lucide-react'
import { useAthletesList, usePackagesList } from '@/hooks/use-cached-data'

export function ResumoPagamento() {
  const { athletes, loading: athletesLoading, error: athletesError } = useAthletesList({ status: 'approved' })
  const { packages, loading: packagesLoading, error: packagesError } = usePackagesList()

  const packageBreakdown = packages
    .map((pkg) => {
      const athletesWithPackage = athletes.filter((athlete) => athlete.athlete_packages?.some((ap) => ap.id === pkg.id))
      return {
        package: pkg,
        count: athletesWithPackage.length,
        subtotal: athletesWithPackage.length * pkg.price
      }
    })
    .filter((item) => item.count > 0)

  const valorTotal = packageBreakdown.reduce((total, item) => total + item.subtotal, 0)

  const loading = athletesLoading || packagesLoading
  const error = athletesError || packagesError

  if (loading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Resumo do Pagamento</CardTitle>
          <Receipt className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-center text-muted-foreground'>Carregando resumo...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Resumo do Pagamento</CardTitle>
          <Receipt className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-center text-destructive'>Erro ao carregar resumo: {error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>Resumo do Pagamento</CardTitle>
        <Receipt className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-muted-foreground'>Atletas aprovados:</span>
            <span className='font-medium'>{athletes.length}</span>
          </div>
        </div>

        <Separator />

        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-muted-foreground'>Detalhamento por pacote:</h4>
          {packageBreakdown.map((item) => (
            <div key={item.package.id} className='flex justify-between text-sm'>
              <span className='text-muted-foreground'>
                {item.package.name} ({item.count}x)
              </span>
              <span className='font-medium'>
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(item.subtotal)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className='flex justify-between items-center'>
          <span className='font-semibold'>Total a pagar:</span>
          <span className='text-xl font-bold text-primary'>
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL'
            }).format(valorTotal)}
          </span>
        </div>

        <div className='text-xs text-muted-foreground text-center'>
          Valores calculados com base nos pacotes selecionados pelos atletas
        </div>
      </CardContent>
    </Card>
  )
}
