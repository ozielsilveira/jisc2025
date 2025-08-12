'use client'

import type React from 'react'

import { useAuth } from '@/components/auth-provider'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Calendar, Check, DollarSign, Plus, Search, User, X } from 'lucide-react'
import { useEffect, useState } from 'react'

type PackageType = {
  id: string
  name: string
  description: string
  price: number
  category: 'games' | 'party' | 'combined'
  includes_party: boolean
  includes_games: boolean
  discount_percentage: number | null
}

type Athlete = {
  id: string
  user_id: string
  athletic_id: string
  status: 'pending' | 'approved' | 'rejected'
  user: {
    name: string
    email: string
  }
  athletic: {
    name: string
  }
}

type AthletePackage = {
  id: string
  athlete_id: string
  package_id: string
  payment_status: 'pending' | 'completed' | 'refunded'
  payment_date: string | null
  created_at: string
  athlete: {
    user: {
      name: string
      email: string
    }
    athletic: {
      name: string
    }
  }
  package: PackageType
}

export default function AssignPackagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [packages, setPackages] = useState<PackageType[]>([])
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [athletePackages, setAthletePackages] = useState<AthletePackage[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [selectedAthletePackage, setSelectedAthletePackage] = useState<AthletePackage | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // For package assignment
  const [formData, setFormData] = useState({
    athleteId: '',
    packageId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Get user role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userError) {
          console.warn('Error fetching user role:', userError)
          throw userError
        }

        if (!userData) {
          throw new Error('No user data found')
        }

        setUserRole(userData.role)

        // Fetch packages
        const { data: packagesData, error: packagesError } = await supabase.from('packages').select('*').order('price')

        if (packagesError) {
          console.warn('Error fetching packages:', packagesError)
          throw packagesError
        }

        if (!packagesData) {
          throw new Error('No packages data found')
        }

        setPackages(packagesData)

        // Fetch athletes based on role
        let athletesQuery = supabase
          .from('athletes')
          .select(
            `
            id,
            user_id,
            athletic_id,
            status,
            user:users(name, email),
            athletic:athletics(name)
          `
          )
          .eq('status', 'approved')

        if (userData.role === 'athletic') {
          athletesQuery = athletesQuery.eq('athletic_id', user.id)
        }

        const { data: athletesData, error: athletesError } = await athletesQuery

        if (athletesError) {
          console.warn('Error fetching athletes:', athletesError)
          throw athletesError
        }

        if (!athletesData) {
          throw new Error('No athletes data found')
        }

        setAthletes(athletesData as unknown as Athlete[])

        // Fetch athlete packages
        let packagesQuery = supabase
          .from('athlete_packages')
          .select(
            `
            id,
            athlete_id,
            package_id,
            payment_status,
            payment_date,
            created_at,
            athlete:athletes(
              user:users(name, email),
              athletic:athletics(name)
            ),
            package:packages(*)
          `
          )
          .order('created_at', { ascending: false })
        if (userData.role === 'athletic') {
          const athleteIds = athletesData.map((athlete) => athlete.id)
          if (athleteIds.length > 0) {
            packagesQuery = packagesQuery.in('athlete_id', athleteIds)
          }
        }

        const { data: athletePackagesData, error: athletePackagesError } = await packagesQuery

        if (athletePackagesError) {
          console.warn('Error fetching athlete packages:', athletePackagesError)
          throw athletePackagesError
        }

        if (!athletePackagesData) {
          throw new Error('No athlete packages data found')
        }

        setAthletePackages(athletePackagesData as unknown as AthletePackage[])
      } catch (error) {
        console.warn('Error fetching data:', error)
        toast({
          title: 'Erro ao carregar dados',
          description: error instanceof Error ? error.message : 'Não foi possível carregar os dados necessários.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAssignPackage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.athleteId || !formData.packageId) {
      toast({
        title: 'Formulário incompleto',
        description: 'Por favor, selecione um atleta e um pacote.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Check if athlete already has this package
      const { data: existingData, error: existingError } = await supabase
        .from('athlete_packages')
        .select('id')
        .eq('athlete_id', formData.athleteId)
        .eq('package_id', formData.packageId)
        .maybeSingle()

      if (existingError) throw existingError

      if (existingData) {
        toast({
          title: 'Pacote já atribuído',
          description: 'Este atleta já possui este pacote.',
          variant: 'destructive'
        })
        setIsSubmitting(false)
        return
      }

      // Assign package
      const { data: assignData, error: assignError } = await supabase
        .from('athlete_packages')
        .insert({
          athlete_id: formData.athleteId,
          package_id: formData.packageId,
          payment_status: 'pending'
        })
        .select()

      if (assignError) throw assignError

      toast({
        title: 'Pacote atribuído com sucesso',
        description: 'O pacote foi atribuído ao atleta.'
      })

      // Reset form and close dialog
      setFormData({
        athleteId: '',
        packageId: ''
      })
      setIsDialogOpen(false)

      // Fetch the newly created athlete package with related data
      const { data: newPackageData, error: newPackageError } = await supabase
        .from('athlete_packages')
        .select(
          `
          id,
          athlete_id,
          package_id,
          payment_status,
          payment_date,
          created_at,
          athlete:athletes(
            user:users(name, email),
            athletic:athletics(name)
          ),
          package:packages(*)
        `
        )
        .eq('id', assignData[0].id)
        .single()

      if (newPackageError) throw newPackageError

      // Update the athlete packages list
      setAthletePackages((prev) => [newPackageData as unknown as AthletePackage, ...prev])
    } catch (error) {
      console.warn('Error assigning package:', error)
      toast({
        title: 'Erro ao atribuir pacote',
        description: 'Não foi possível atribuir o pacote ao atleta.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelPackage = async () => {
    if (!selectedAthletePackage) return

    try {
      // Only allow cancellation if payment status is pending
      if (selectedAthletePackage.payment_status !== 'pending') {
        toast({
          title: 'Não é possível cancelar',
          description: 'Apenas pacotes com pagamento pendente podem ser cancelados.',
          variant: 'destructive'
        })
        setIsCancelDialogOpen(false)
        return
      }

      // Delete the athlete package
      const { error } = await supabase.from('athlete_packages').delete().eq('id', selectedAthletePackage.id)

      if (error) throw error

      toast({
        title: 'Pacote cancelado com sucesso',
        description: 'A atribuição do pacote foi cancelada.'
      })

      // Update the athlete packages list
      setAthletePackages((prev) => prev.filter((pkg) => pkg.id !== selectedAthletePackage.id))
    } catch (error) {
      console.warn('Error canceling package:', error)
      toast({
        title: 'Erro ao cancelar pacote',
        description: 'Não foi possível cancelar a atribuição do pacote.',
        variant: 'destructive'
      })
    } finally {
      setIsCancelDialogOpen(false)
      setSelectedAthletePackage(null)
    }
  }

  const handleUpdatePaymentStatus = async (id: string, status: 'completed' | 'refunded') => {
    try {
      const { error } = await supabase
        .from('athlete_packages')
        .update({
          payment_status: status,
          payment_date: status === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', id)

      if (error) throw error

      toast({
        title: status === 'completed' ? 'Pagamento confirmado' : 'Pagamento estornado',
        description:
          status === 'completed' ? 'O pagamento foi confirmado com sucesso.' : 'O pagamento foi estornado com sucesso.'
      })

      // Update local state
      setAthletePackages((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                payment_status: status,
                payment_date: status === 'completed' ? new Date().toISOString() : null
              }
            : item
        )
      )
    } catch (error) {
      console.warn('Error updating payment status:', error)
      toast({
        title: 'Erro ao atualizar pagamento',
        description: 'Não foi possível atualizar o status do pagamento.',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'games':
        return <Badge className='bg-blue-500'>Jogos</Badge>
      case 'party':
        return <Badge className='bg-purple-500'>Festa</Badge>
      case 'combined':
        return <Badge className='bg-green-500'>Combinado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className='bg-yellow-500'>Pendente</Badge>
      case 'completed':
        return <Badge className='bg-green-500'>Pago</Badge>
      case 'refunded':
        return <Badge className='bg-red-500'>Estornado</Badge>
      default:
        return <Badge>Desconhecido</Badge>
    }
  }

  const filteredAthletePackages = athletePackages.filter((item) => {
    if (!searchTerm) return true

    const athleteName = item.athlete?.user?.name?.toLowerCase() || ''
    const athleteEmail = item.athlete?.user?.email?.toLowerCase() || ''
    const athleticName = item.athlete?.athletic?.name?.toLowerCase() || ''
    const packageName = item.package?.name?.toLowerCase() || ''

    const search = searchTerm.toLowerCase()

    return (
      athleteName.includes(search) ||
      athleteEmail.includes(search) ||
      athleticName.includes(search) ||
      packageName.includes(search)
    )
  })

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]'></div>
      </div>
    )
  }

  // Only admin and athletic can access this page
  if (userRole !== 'admin' && userRole !== 'athletic') {
    return (
      <div className='flex flex-col items-center justify-center h-full'>
        <h1 className='text-2xl font-bold mb-2'>Acesso Restrito</h1>
        <p className='text-gray-500'>Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold'>Atribuir Pacotes</h1>
          <p className='text-gray-500'>
            {userRole === 'admin'
              ? 'Gerencie a atribuição de pacotes para atletas.'
              : 'Gerencie a atribuição de pacotes para atletas da sua atlética.'}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className='bg-[#0456FC]'>
              <Plus className='h-4 w-4 mr-2' />
              Atribuir Pacote
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle>Atribuir Pacote a Atleta</DialogTitle>
              <DialogDescription>Selecione um atleta e um pacote para atribuir.</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleAssignPackage} className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='athleteId'>Atleta</Label>
                <Select
                  onValueChange={(value) => handleSelectChange('athleteId', value)}
                  value={formData.athleteId || undefined}
                >
                  <SelectTrigger id='athleteId'>
                    <SelectValue placeholder='Selecione um atleta' />
                  </SelectTrigger>
                  <SelectContent>
                    {athletes.map((athlete) => (
                      <SelectItem key={athlete.id} value={athlete.id}>
                        {athlete.user.name} - {athlete.athletic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='packageId'>Pacote</Label>
                <Select
                  onValueChange={(value) => handleSelectChange('packageId', value)}
                  value={formData.packageId || undefined}
                >
                  <SelectTrigger id='packageId'>
                    <SelectValue placeholder='Selecione um pacote' />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {formatCurrency(pkg.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type='submit' className='bg-[#0456FC]' disabled={isSubmitting}>
                  {isSubmitting ? 'Atribuindo...' : 'Atribuir Pacote'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação cancelará a atribuição do pacote{' '}
              <span className='font-semibold'>{selectedAthletePackage?.package.name}</span> para o atleta{' '}
              <span className='font-semibold'>{selectedAthletePackage?.athlete.user.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelPackage} className='bg-red-600 hover:bg-red-700'>
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className='flex items-center space-x-2'>
        <Search className='h-5 w-5 text-gray-400' />
        <Input
          placeholder='Buscar por nome do atleta, atlética ou pacote...'
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className='max-w-md'
        />
      </div>

      <Tabs defaultValue='all'>
        <TabsList>
          <TabsTrigger value='all'>Todos</TabsTrigger>
          <TabsTrigger value='pending'>Pendentes</TabsTrigger>
          <TabsTrigger value='completed'>Pagos</TabsTrigger>
          <TabsTrigger value='refunded'>Estornados</TabsTrigger>
        </TabsList>

        {['all', 'pending', 'completed', 'refunded'].map((status) => (
          <TabsContent key={status} value={status} className='space-y-4'>
            {filteredAthletePackages.filter((item) => status === 'all' || item.payment_status === status).length ===
            0 ? (
              <Card>
                <CardContent className='pt-6'>
                  <p className='text-center text-gray-500'>
                    Não há pacotes atribuídos {status !== 'all' ? `com status "${status}"` : ''}.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className='grid gap-6 sm:grid-cols-1 lg:grid-cols-2'>
                {filteredAthletePackages
                  .filter((item) => status === 'all' || item.payment_status === status)
                  .map((item) => (
                    <Card key={item.id}>
                      <CardHeader className='pb-2'>
                        <div className='flex justify-between items-start'>
                          <CardTitle>{item.package.name}</CardTitle>
                          {getStatusBadge(item.payment_status)}
                        </div>
                        <CardDescription className='flex items-center gap-1'>
                          {getCategoryBadge(item.package.category)}
                          <span className='ml-2'>{item.package.description || ''}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <div className='flex items-center'>
                          <User className='h-4 w-4 mr-2 text-gray-500' />
                          <div>
                            <div className='font-medium'>{item.athlete.user.name}</div>
                            <div className='text-sm text-gray-500'>{item.athlete.user.email}</div>
                          </div>
                        </div>

                        <div className='flex items-center'>
                          <DollarSign className='h-4 w-4 mr-2 text-gray-500' />
                          <span className='font-medium'>{formatCurrency(item.package.price)}</span>
                        </div>

                        {item.payment_date && (
                          <div className='flex items-center'>
                            <Calendar className='h-4 w-4 mr-2 text-gray-500' />
                            <span>
                              {item.payment_status === 'completed' ? 'Pago em: ' : 'Estornado em: '}
                              {formatDate(item.payment_date)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className='flex justify-between'>
                        {item.payment_status === 'pending' && (
                          <>
                            <Button
                              variant='outline'
                              className='text-red-600 hover:text-red-700 hover:bg-red-50'
                              onClick={() => {
                                setSelectedAthletePackage(item)
                                setIsCancelDialogOpen(true)
                              }}
                            >
                              <X className='h-4 w-4 mr-1' />
                              Cancelar
                            </Button>
                            <Button
                              className='bg-green-600 hover:bg-green-700'
                              onClick={() => handleUpdatePaymentStatus(item.id, 'completed')}
                            >
                              <Check className='h-4 w-4 mr-1' />
                              Confirmar Pagamento
                            </Button>
                          </>
                        )}

                        {item.payment_status === 'completed' && (
                          <Button
                            variant='outline'
                            className='ml-auto'
                            onClick={() => handleUpdatePaymentStatus(item.id, 'refunded')}
                          >
                            <X className='h-4 w-4 mr-1' />
                            Estornar Pagamento
                          </Button>
                        )}

                        {item.payment_status === 'refunded' && (
                          <Button
                            variant='outline'
                            className='ml-auto'
                            onClick={() => handleUpdatePaymentStatus(item.id, 'completed')}
                          >
                            <Check className='h-4 w-4 mr-1' />
                            Marcar como Pago
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
