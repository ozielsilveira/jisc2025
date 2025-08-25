import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { useAthletesList } from '@/hooks/use-cached-data'

export function AtletasAprovados({ athleticId }: { athleticId: string }) {
  const { athletes, loading, error } = useAthletesList({ status: 'approved', athleticId })

  if (loading) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Atletas Aprovados</CardTitle>
          <Users className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Atletas Aprovados</CardTitle>
          <Users className='h-4 w-4 text-muted-foreground' />
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
        <CardTitle className='text-sm font-medium'>Atletas Aprovados</CardTitle>
        <Users className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{athletes.length}</div>
        <p className='text-xs text-muted-foreground'>Total de atletas com status aprovado</p>
      </CardContent>
    </Card>
  )
}
