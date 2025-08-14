'use client'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Building, Copy, School, Share2, Users } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'

type Athletic = {
  id: string
  name: string
  logo_url: string
  university: string
  created_at: string
  updated_at: string
  _count?: {
    athletes: number
  }
}

export default function AthleticsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [referralLinks, setReferralLinks] = useState<{ [key: string]: string }>({})
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [registrationLink, setRegistrationLink] = useState('')

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

        console.log('User role data:', userData)
        setUserRole(userData.role)
        console.log('User role:', userRole)

        // Fetch athletics
        const { data: athleticsData, error: athleticsError } = await supabase
          .from('athletics')
          .select('*')
          .order('name')

        if (athleticsError) throw athleticsError

        // Get athlete counts for each athletic
        const athleticsWithCounts = await Promise.all(
          athleticsData.map(async (athletic) => {
            const { count, error } = await supabase
              .from('athletes')
              .select('*', { count: 'exact', head: true })
              .eq('athletic_id', athletic.id)

            return {
              ...athletic,
              _count: {
                athletes: count || 0
              }
            }
          })
        )

        setAthletics(athleticsWithCounts as Athletic[])

        // Generate referral links
        const links: { [key: string]: string } = {}
        athleticsData.forEach((athletic) => {
          links[athletic.id] = `${window.location.origin}/register?type=athletic&athletic=${athletic.id}`
        })
        setReferralLinks(links)
      } catch (error) {
        console.warn('Error fetching data:', error)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as atléticas.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, userRole, toast])

  const openLinkDialog = (athleticId?: string, athleticName?: string) => {
    let link = `${window.location.origin}/register?type=athletic`

    if (athleticId) {
      link += `&athletic=${athleticId}`
    }

    setRegistrationLink(link)
    setIsLinkDialogOpen(true)

    // Auto-copy to clipboard when opening dialog
    if (window.navigator.clipboard) {
      copyToClipboard(link, athleticName)
    }
  }

  const copyToClipboard = async (text: string, athleticName?: string) => {
    try {
      await navigator.clipboard.writeText(text)

      // Log the share action
      console.log('Link compartilhado:', {
        type: athleticName ? 'athletic' : 'general',
        athleticName,
        link: text
      })

      toast({
        title: athleticName ? `Link da ${athleticName} copiado!` : 'Link de registro copiado!',
        description: athleticName
          ? `O link de cadastro para a ${athleticName} foi copiado.`
          : 'O link de registro para atléticas foi copiado para a área de transferência.',
        variant: 'success',
        duration: 3000
      })
    } catch (err) {
      console.warn('Erro ao copiar link:', err)
      toast({
        title: 'Erro ao copiar link',
        description: 'Não foi possível copiar o link para a área de transferência.',
        variant: 'destructive',
        duration: 3000
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
  if (userRole !== 'admin') {
    return (
      <div className='flex flex-col items-center justify-center h-full'>
        <h1 className='text-2xl font-bold mb-2'>Acesso Restrito</h1>
        <p className='text-gray-500'>Você não tem permissão para acessar esta página.</p>
        <p className='text-sm text-gray-400 mt-2'>Role atual: {userRole || 'Não definida'}</p>
      </div>
    )
  }

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
          <div>
            <h1 className='text-2xl sm:text-3xl font-bold'>Atléticas</h1>
            <p className='text-gray-500 text-sm sm:text-base'>Visualize as atléticas participantes do campeonato.</p>
          </div>
          {userRole === 'admin' && (
            <div className='w-full sm:w-auto flex flex-col sm:flex-row gap-2'>
              <Button
                onClick={() => openLinkDialog()}
                className='flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 w-full sm:w-auto'
              >
                <Share2 className='h-4 w-4' />
                <span>Compartilhar Link</span>
              </Button>
            </div>
          )}
        </div>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className='bg-white sm:max-w-[500px]'>
            <DialogHeader>
              <DialogTitle className='text-xl'>🔗 Compartilhar Link de Registro</DialogTitle>
              <DialogDescription className='text-gray-600'>
                Use este link para convidar atléticas a se cadastrarem no JISC 2025.
                {registrationLink.includes('athletic=') && (
                  <span className='block mt-2 text-sm text-blue-600 font-medium'>
                    Dica: Este link já está personalizado para a atlética selecionada.
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-2'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <Label className='text-sm font-medium'>Link de Registro</Label>
                  <span className='text-xs text-muted-foreground'>
                    {registrationLink.length > 60
                      ? `${registrationLink.substring(0, 30)}...${registrationLink.substring(registrationLink.length - 15)}`
                      : registrationLink}
                  </span>
                </div>
                <div className='flex items-center'>
                  <Input
                    readOnly
                    value={registrationLink}
                    className='flex-1 font-mono text-sm'
                    onClick={(e) => e.currentTarget.select()}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    className='shrink-0'
                    onClick={() =>
                      copyToClipboard(
                        registrationLink,
                        registrationLink.includes('athletic=')
                          ? athletics.find((a) => registrationLink.includes(a.id))?.name
                          : undefined
                      )
                    }
                    title='Copiar link'
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter className='sm:justify-start'>
              <div className='text-xs text-muted-foreground'>
                Dica: Este link contém metadados para melhor visualização quando compartilhado.
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {athletics.length === 0 ? (
          <Card>
            <CardContent className='pt-6'>
              <p className='text-center text-gray-500'>Não há atléticas cadastradas no sistema.</p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-6 sm:grid-cols-1 lg:grid-cols-2'>
            {athletics.map((athletic) => (
              <Card key={athletic.id}>
                <CardHeader className='pb-2'>
                  <div className='flex items-center gap-4'>
                    <div>
                      <CardTitle>{athletic.name}</CardTitle>
                      <CardDescription className='flex items-center mt-1'>
                        <School className='h-4 w-4 mr-1' />
                        {athletic.university}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-center'>
                    <Users className='h-4 w-4 mr-2 text-gray-500' />
                    <span>{athletic._count?.athletes || 0} atletas cadastrados</span>
                  </div>

                  <div className='space-y-2'>
                    <Label>Link de Referência para Atletas</Label>
                    <div className='flex items-center'>
                      <Input
                        value={`${window.location.origin}/register?type=athlete&athletic=${athletic.id}`}
                        readOnly
                        className='pr-10'
                      />
                      <Button
                        variant='ghost'
                        size='icon'
                        className='ml-[-40px] text-blue-600 hover:bg-blue-50'
                        onClick={(e) => {
                          e.stopPropagation()
                          copyToClipboard(referralLinks[athletic.id], athletic.name)
                        }}
                        title='Copiar link de atleta'
                      >
                        <Share2 className='h-4 w-4' />
                      </Button>
                    </div>
                    <p className='text-xs text-gray-500'>
                      Compartilhe este link para cadastro de novos membros da atlética.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
