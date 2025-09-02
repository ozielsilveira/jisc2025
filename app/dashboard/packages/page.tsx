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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { AlertTriangle, DollarSign, Edit, Percent, Plus, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type PackageType = {
  id: string
  name: string
  description: string
  price: number
  category: 'games' | 'party' | 'combined'
  includes_party: boolean
  includes_games: boolean
  is_active: boolean
  discount_percentage: number | null
  created_at: string
  updated_at: string
  _count?: {
    athletes: number
  }
}

type Athletic = {
  id: string
  name: string
  university: string
}

export default function PackagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [packages, setPackages] = useState<PackageType[]>([])
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<PackageType | null>(null)
  const [isTableReady, setIsTableReady] = useState(true)
  const [selectedAthleticId, setSelectedAthleticId] = useState<string>('')
  const [showAthleticSelection, setShowAthleticSelection] = useState(false)
  const [tempSelectedPackage, setTempSelectedPackage] = useState<PackageType | null>(null)

  // For package creation/editing
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    price: '',
    category: 'games' as 'games' | 'party' | 'combined',
    includes_party: false,
    includes_games: true,
    is_active: true,
    discount_percentage: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !isTableReady) return

      try {
        // Get user role
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (userError) throw userError
        setUserRole(userData.role)

        // Fetch packages
        const { data: packagesData, error: packagesError } = await supabase.from('packages').select('*').order('price')

        if (packagesError) throw packagesError

        // Get athlete counts for each package
        const packagesWithCounts = await Promise.all(
          packagesData.map(async (pkg) => {
            const { count, error } = await supabase
              .from('athlete_packages')
              .select('*', { count: 'exact', head: true })
              .eq('package_id', pkg.id)

            return {
              ...pkg,
              _count: {
                athletes: count || 0
              }
            }
          })
        )

        setPackages(packagesWithCounts as PackageType[])
      } catch (error) {
        console.warn('Error fetching data:', error)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os pacotes.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast, isTableReady])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = (value: 'games' | 'combined' | 'party') => {
    let includes_games = formData.includes_games
    let includes_party = formData.includes_party

    // Update includes_games and includes_party based on category
    if (value === 'games') {
      includes_games = true
      includes_party = false
    } else if (value === 'combined') {
      includes_games = true
      includes_party = true
    } else if (value === 'party') {
      includes_games = false
      includes_party = true
    }

    setFormData((prev) => ({
      ...prev,
      category: value,
      includes_games,
      includes_party
    }))
  }

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      price: '',
      category: 'games',
      includes_party: false,
      includes_games: true,
      is_active: true,
      discount_percentage: ''
    })
    setSelectedPackage(null)
  }

  const openEditDialog = (pkg: PackageType) => {
    setSelectedPackage(pkg)
    setFormData({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description || '',
      price: pkg.price.toString(),
      category: pkg.category,
      includes_party: pkg.includes_party,
      includes_games: pkg.includes_games,
      is_active: pkg.is_active,
      discount_percentage: pkg.discount_percentage ? pkg.discount_percentage.toString() : ''
    })
    setIsDialogOpen(true)
  }

  const openDeleteDialog = (pkg: PackageType) => {
    setSelectedPackage(pkg)
    setIsDeleteDialogOpen(true)
  }

  const handleCreateOrUpdatePackage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.price) {
      toast({
        title: 'Formulário incompleto',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const packageData = {
        name: formData.name,
        description: formData.description,
        price: Number.parseFloat(formData.price),
        category: formData.category,
        includes_party: formData.includes_party,
        includes_games: formData.includes_games,
        is_active: formData.is_active,
        discount_percentage: formData.discount_percentage ? Number.parseFloat(formData.discount_percentage) : null
      }

      let result

      if (formData.id) {
        // Update existing package
        const { data, error } = await supabase.from('packages').update(packageData).eq('id', formData.id).select()

        if (error) throw error
        result = data

        toast({
          title: 'Pacote atualizado com sucesso',
          description: 'O pacote foi atualizado no sistema.',
          variant: 'success'
        })
      } else {
        // Create new package
        const { data, error } = await supabase.from('packages').insert(packageData).select()

        if (error) throw error
        result = data

        toast({
          title: 'Pacote criado com sucesso',
          description: 'O pacote foi adicionado ao sistema.',
          variant: 'success'
        })
      }

      // Reset form and close dialog
      resetForm()
      setIsDialogOpen(false)

      // Refresh the packages list
      const { data: packagesData, error: packagesError } = await supabase.from('packages').select('*').order('price')

      if (packagesError) throw packagesError

      // Get athlete counts for each package
      const packagesWithCounts = await Promise.all(
        packagesData.map(async (pkg) => {
          const { count, error } = await supabase
            .from('athlete_packages')
            .select('*', { count: 'exact', head: true })
            .eq('package_id', pkg.id)

          return {
            ...pkg,
            _count: {
              athletes: count || 0
            }
          }
        })
      )

      setPackages(packagesWithCounts as PackageType[])
    } catch (error) {
      console.warn('Error creating/updating package:', error)
      toast({
        title: 'Erro ao salvar pacote',
        description: 'Não foi possível salvar o pacote no sistema.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeletePackage = async () => {
    if (!selectedPackage) return

    try {
      // Check if package is in use
      const { count, error: countError } = await supabase
        .from('athlete_packages')
        .select('*', { count: 'exact', head: true })
        .eq('package_id', selectedPackage.id)

      if (countError) throw countError

      if (count && count > 0) {
        toast({
          title: 'Não é possível excluir',
          description: 'Este pacote está atribuído a atletas e não pode ser excluído.',
          variant: 'destructive'
        })
        setIsDeleteDialogOpen(false)
        return
      }

      // Delete package
      const { error } = await supabase.from('packages').delete().eq('id', selectedPackage.id)

      if (error) throw error

      toast({
        title: 'Pacote excluído com sucesso',
        description: 'O pacote foi removido do sistema.',
        variant: 'success'
      })

      // Update packages list
      setPackages((prev) => prev.filter((pkg) => pkg.id !== selectedPackage.id))
    } catch (error) {
      console.warn('Error deleting package:', error)
      toast({
        title: 'Erro ao excluir pacote',
        description: 'Não foi possível excluir o pacote do sistema.',
        variant: 'destructive'
      })
    } finally {
      setIsDeleteDialogOpen(false)
      setSelectedPackage(null)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
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

  const handlePackageSelection = (pkg: PackageType) => {
    if (userRole === 'admin' || userRole === 'athletic') {
      // Admin and athletic users can edit/delete packages
      return
    }

    if (pkg.category === 'games' || pkg.category === 'combined') {
      // For games or combined packages, show athletic selection
      setTempSelectedPackage(pkg)
      setShowAthleticSelection(true)
    } else {
      // For party packages, proceed with purchase
      handlePackagePurchase(pkg)
    }
  }

  const handlePackagePurchase = async (pkg: PackageType) => {
    if (!user) return

    try {
      // Create athlete_package record
      const { error } = await supabase.from('athlete_packages').insert({
        athlete_id: user.id,
        package_id: pkg.id,
        payment_status: 'pending'
      })

      if (error) throw error

      toast({
        title: 'Pacote selecionado',
        description: 'Você será redirecionado para a página de pagamento.',
        variant: 'success'
      })

      // Redirect to payment page
      router.push(`/dashboard/payments?package=${pkg.id}`)
    } catch (error) {
      console.warn('Error selecting package:', error)
      toast({
        title: 'Erro ao selecionar pacote',
        description: 'Não foi possível selecionar o pacote.',
        variant: 'destructive'
      })
    }
  }

  const handleAthleticSelection = async () => {
    if (!tempSelectedPackage || !selectedAthleticId) return

    try {
      // Create athlete record if user is not already an athlete
      const { data: existingAthlete, error: athleteCheckError } = await supabase
        .from('athletes')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (athleteCheckError) throw athleteCheckError

      if (!existingAthlete) {
        // Create athlete record
        const { error: athleteError } = await supabase.from('athletes').insert({
          user_id: user?.id,
          athletic_id: selectedAthleticId,
          status: 'pending'
        })

        if (athleteError) throw athleteError
      }

      // Show approval message
      toast({
        title: 'Solicitação enviada',
        description: 'Sua solicitação será analisada pela atlética antes de prosseguir com o pagamento.',
        variant: 'success'
      })

      // Reset state
      setShowAthleticSelection(false)
      setTempSelectedPackage(null)
      setSelectedAthleticId('')
    } catch (error) {
      console.warn('Error handling athletic selection:', error)
      toast({
        title: 'Erro ao processar solicitação',
        description: 'Não foi possível processar sua solicitação.',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]'></div>
      </div>
    )
  }

  // Only admin can access this page
  if (userRole !== 'admin' && userRole !== 'athletic') {
    return (
      <div className='flex flex-col items-center justify-center h-full'>
        <h1 className='text-2xl font-bold mb-2'>Acesso Restrito</h1>
        <p className='text-gray-500'>Você não tem permissão para acessar esta página.</p>
      </div>
    )
  }

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='space-y-6'>
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>Pacotes</h1>
            <p className='text-gray-500'>
              {userRole === 'admin'
                ? 'Gerencie os pacotes disponíveis para os atletas.'
                : 'Visualize os pacotes disponíveis para os atletas.'}
            </p>
          </div>

          {userRole === 'admin' && (
            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open)
                if (!open) resetForm()
              }}
            >
              <DialogTrigger asChild>
                <Button className='bg-[#0456FC]'>
                  <Plus className='h-4 w-4 mr-2' />
                  Novo Pacote
                </Button>
              </DialogTrigger>
              <DialogContent className='sm:max-w-[600px]'>
                <DialogHeader>
                  <DialogTitle>{formData.id ? 'Editar Pacote' : 'Adicionar Novo Pacote'}</DialogTitle>
                  <DialogDescription>
                    {formData.id
                      ? 'Edite os detalhes do pacote existente.'
                      : 'Preencha os detalhes para criar um novo pacote.'}
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreateOrUpdatePackage} className='space-y-4 py-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='name'>Nome do Pacote</Label>
                    <Input
                      id='name'
                      name='name'
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder='Ex: Pacote Completo'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='description'>Descrição</Label>
                    <Textarea
                      id='description'
                      name='description'
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder='Descreva o que está incluído neste pacote...'
                      rows={3}
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='price'>Preço (R$)</Label>
                    <Input
                      id='price'
                      name='price'
                      type='number'
                      step='0.01'
                      min='0'
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder='0.00'
                      required
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label>Categoria do Pacote</Label>
                    <RadioGroup
                      value={formData.category}
                      onValueChange={(value) => handleCategoryChange(value as 'games' | 'combined')}
                      className='flex flex-col space-y-1'
                    >
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='games' id='games' />
                        <Label htmlFor='games'>Jogos (Apenas modalidades esportivas)</Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='combined' id='combined' />
                        <Label htmlFor='combined'>Combinado (Jogos + Festa)</Label>
                      </div>
                      <div className='flex items-center space-x-2'>
                        <RadioGroupItem value='party' id='party' />
                        <Label htmlFor='party'>Festa (Apenas festa)</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.category === 'combined' && (
                    <div className='space-y-2'>
                      <Label htmlFor='discount_percentage'>Desconto (%) para pacote combinado</Label>
                      <Input
                        id='discount_percentage'
                        name='discount_percentage'
                        type='number'
                        step='0.01'
                        min='0'
                        max='100'
                        value={formData.discount_percentage}
                        onChange={handleInputChange}
                        placeholder='0.00'
                      />
                      <p className='text-xs text-gray-500'>
                        Opcional: Desconto aplicado ao comprar o pacote combinado em vez de comprar separadamente.
                      </p>
                    </div>
                  )}

                  <div className='flex items-center space-x-2'>
                    <Switch
                      id='is_active'
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor='is_active'>Pacote Ativo</Label>
                  </div>

                  <DialogFooter>
                    <Button type='submit' className='bg-[#0456FC]' disabled={isSubmitting}>
                      {isSubmitting ? 'Salvando...' : formData.id ? 'Atualizar Pacote' : 'Criar Pacote'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso excluirá permanentemente o pacote{' '}
                <span className='font-semibold'>{selectedPackage?.name}</span>.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePackage} className='bg-red-600 hover:bg-red-700'>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={showAthleticSelection} onOpenChange={setShowAthleticSelection}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecione sua Atlética</DialogTitle>
              <DialogDescription>
                Para participar dos jogos, é necessário selecionar a atlética à qual você pertence.
              </DialogDescription>
            </DialogHeader>

            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label htmlFor='athletic'>Atlética</Label>
                <Select onValueChange={setSelectedAthleticId} value={selectedAthleticId}>
                  <SelectTrigger id='athletic'>
                    <SelectValue placeholder='Selecione sua atlética' />
                  </SelectTrigger>
                  <SelectContent>
                    {athletics.map((athletic) => (
                      <SelectItem key={athletic.id} value={athletic.id}>
                        {athletic.name} - {athletic.university}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button onClick={handleAthleticSelection} disabled={!selectedAthleticId}>
                  Confirmar
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue='all'>
          <TabsList>
            <TabsTrigger value='all'>Todos os Pacotes</TabsTrigger>
            <TabsTrigger value='games'>Jogos</TabsTrigger>
            <TabsTrigger value='party'>Festa</TabsTrigger>
            <TabsTrigger value='combined'>Combinados</TabsTrigger>
          </TabsList>

          {['all', 'games', 'party', 'combined'].map((category) => (
            <TabsContent key={category} value={category} className='space-y-4'>
              {packages.filter((pkg) => category === 'all' || pkg.category === category).length === 0 ? (
                <Card>
                  <CardContent className='pt-6'>
                    <p className='text-center text-gray-500'>
                      Não há pacotes {category === 'all' ? '' : `do tipo ${category}`} cadastrados no sistema.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid gap-6 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3'>
                  {packages
                    .filter((pkg) => category === 'all' || pkg.category === category)
                    .map((pkg) => (
                      <Card key={pkg.id}>
                        <CardHeader className='pb-2'>
                          <div className='flex justify-between items-start'>
                            <CardTitle>{pkg.name}</CardTitle>
                            <div className='flex items-center gap-2'>
                              {getCategoryBadge(pkg.category)}
                              <Badge className={pkg.is_active ? 'bg-green-500' : 'bg-red-500'}>
                                {pkg.is_active ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </div>
                          </div>
                          <CardDescription>{pkg.description || 'Sem descrição disponível.'}</CardDescription>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          <div className='flex items-center'>
                            <DollarSign className='h-4 w-4 mr-2 text-gray-500' />
                            <span className='text-2xl font-bold'>{formatCurrency(pkg.price)}</span>
                          </div>

                          <div className='flex flex-wrap gap-2'>
                            {pkg.includes_games && (
                              <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
                                Jogos
                              </Badge>
                            )}
                            {pkg.includes_party && (
                              <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200'>
                                Festa
                              </Badge>
                            )}
                            {pkg.discount_percentage && pkg.discount_percentage > 0 && (
                              <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
                                <Percent className='h-3 w-3 mr-1' />
                                {pkg.discount_percentage}% de desconto
                              </Badge>
                            )}
                          </div>

                          <div className='flex items-center'>
                            <Users className='h-4 w-4 mr-2 text-gray-500' />
                            <span>{pkg._count?.athletes || 0} atletas inscritos</span>
                          </div>
                        </CardContent>
                        <CardFooter className='flex justify-between'>
                          {userRole === 'admin' && (
                            <>
                              <Button
                                variant='outline'
                                className='text-red-600 hover:text-red-700 hover:bg-red-50'
                                onClick={() => openDeleteDialog(pkg)}
                              >
                                <Trash2 className='h-4 w-4 mr-1' />
                                Excluir
                              </Button>
                              <Button onClick={() => openEditDialog(pkg)}>
                                <Edit className='h-4 w-4 mr-1' />
                                Editar
                              </Button>
                            </>
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
    </div>
  )
}
