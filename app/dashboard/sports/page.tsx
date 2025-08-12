'use client'

import type React from 'react'

import { useEffect, useState } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/components/auth-provider'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Beer, Calendar, Plus, Trophy, Users } from 'lucide-react'

type Sport = {
  id: string
  name: string
  type: 'sport' | 'bar_game'
  description: string
  created_at: string
  updated_at: string
  _count?: {
    games: number
    athletes: number
  }
}

export default function SportsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [sports, setSports] = useState<Sport[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // For sport creation
  const [formData, setFormData] = useState({
    name: '',
    type: 'sport' as 'sport' | 'bar_game',
    description: ''
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

        if (userError) throw userError
        setUserRole(userData.role)

        // Fetch sports
        const { data: sportsData, error: sportsError } = await supabase.from('sports').select('*').order('name')

        if (sportsError) throw sportsError

        // Get counts for each sport
        const sportsWithCounts = await Promise.all(
          sportsData.map(async (sport) => {
            // Count games
            const { count: gamesCount, error: gamesError } = await supabase
              .from('games')
              .select('*', { count: 'exact', head: true })
              .eq('sport_id', sport.id)

            if (gamesError) throw gamesError

            // Count athletes
            const { count: athletesCount, error: athletesError } = await supabase
              .from('athlete_sports')
              .select('*', { count: 'exact', head: true })
              .eq('sport_id', sport.id)

            if (athletesError) throw athletesError

            return {
              ...sport,
              _count: {
                games: gamesCount || 0,
                athletes: athletesCount || 0
              }
            }
          })
        )

        setSports(sportsWithCounts as Sport[])
      } catch (error) {
        console.warn('Error fetching data:', error)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as modalidades.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleTypeChange = (value: 'sport' | 'bar_game') => {
    setFormData((prev) => ({ ...prev, type: value }))
  }

  const handleCreateSport = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.type) {
      toast({
        title: 'Formulário incompleto',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Create sport
      const { data: sportData, error: sportError } = await supabase
        .from('sports')
        .insert({
          name: formData.name,
          type: formData.type,
          description: formData.description || ''
        })
        .select()

      if (sportError) throw sportError

      toast({
        title: 'Modalidade criada com sucesso',
        description: 'A modalidade foi adicionada ao sistema.'
      })

      // Reset form and close dialog
      setFormData({
        name: '',
        type: 'sport',
        description: ''
      })
      setIsDialogOpen(false)

      // Refresh the sports list
      window.location.reload()
    } catch (error) {
      console.warn('Error creating sport:', error)
      toast({
        title: 'Erro ao criar modalidade',
        description: 'Não foi possível adicionar a modalidade ao sistema.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
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
  if (userRole !== 'admin') {
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
            <h1 className='text-3xl font-bold'>Modalidades</h1>
            <p className='text-gray-500'>Gerencie as modalidades esportivas e de boteco do campeonato.</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className='bg-[#0456FC]'>
                <Plus className='h-4 w-4 mr-2' />
                Nova Modalidade
              </Button>
            </DialogTrigger>
            <DialogContent className='sm:max-w-[500px]'>
              <DialogHeader>
                <DialogTitle>Adicionar Nova Modalidade</DialogTitle>
                <DialogDescription>
                  Preencha os detalhes para cadastrar uma nova modalidade no campeonato.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateSport} className='space-y-4 py-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Nome da Modalidade</Label>
                  <Input
                    id='name'
                    name='name'
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder='Ex: Futebol de Campo'
                  />
                </div>

                <div className='space-y-2'>
                  <Label>Tipo de Modalidade</Label>
                  <RadioGroup
                    value={formData.type}
                    onValueChange={(value) => handleTypeChange(value as 'sport' | 'bar_game')}
                    className='flex flex-col space-y-1'
                  >
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='sport' id='sport' />
                      <Label htmlFor='sport'>Esporte</Label>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <RadioGroupItem value='bar_game' id='bar_game' />
                      <Label htmlFor='bar_game'>Jogo de Boteco</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Descrição (opcional)</Label>
                  <Textarea
                    id='description'
                    name='description'
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder='Descreva as regras ou informações sobre a modalidade...'
                    rows={4}
                  />
                </div>

                <DialogFooter>
                  <Button type='submit' className='bg-[#0456FC]' disabled={isSubmitting}>
                    {isSubmitting ? 'Criando...' : 'Criar Modalidade'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {sports.length === 0 ? (
          <Card>
            <CardContent className='pt-6'>
              <p className='text-center text-gray-500'>Não há modalidades cadastradas no sistema.</p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-6 sm:grid-cols-1 lg:grid-cols-2'>
            {sports.map((sport) => (
              <Card key={sport.id}>
                <CardHeader className='pb-2'>
                  <div className='flex justify-between items-start'>
                    <CardTitle>{sport.name}</CardTitle>
                    <Badge className={sport.type === 'sport' ? 'bg-[#0456FC]' : 'bg-[#93FF6D] text-black'}>
                      {sport.type === 'sport' ? 'Esporte' : 'Jogo de Boteco'}
                    </Badge>
                  </div>
                  <CardDescription>{sport.description || 'Sem descrição disponível.'}</CardDescription>
                </CardHeader>
                <CardContent className='space-y-2'>
                  <div className='flex items-center'>
                    <Users className='h-4 w-4 mr-2 text-gray-500' />
                    <span>{sport._count?.athletes || 0} atletas inscritos</span>
                  </div>
                  <div className='flex items-center'>
                    <Calendar className='h-4 w-4 mr-2 text-gray-500' />
                    <span>{sport._count?.games || 0} jogos agendados</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => (window.location.href = `/dashboard/games?sport=${sport.id}`)}
                  >
                    {sport.type === 'sport' ? (
                      <>
                        <Trophy className='h-4 w-4 mr-2' />
                        Ver Jogos
                      </>
                    ) : (
                      <>
                        <Beer className='h-4 w-4 mr-2' />
                        Ver Partidas
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
