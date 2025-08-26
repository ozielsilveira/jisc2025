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
import { Building, Copy, School, Users } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type Athletic = {
  id: string
  name: string
  logo_url: string
  university: string
  created_at: string
  updated_at: string
  statute_url: string | null
  _count?: {
    athletes: number
  }
}

export default function AthleticsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [athletics, setAthletics] = useState<Athletic[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [referralLinks, setReferralLinks] = useState<{ [key: string]: string }>({})
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)

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

        setUserRole(userData.role)

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

  const copyToClipboard = (text: string) => {
    const textArea = document.createElement('textarea')
    textArea.value = text
    document.body.appendChild(textArea)
    textArea.select()
    try {
      document.execCommand('copy')
      toast({
        title: 'Link copiado',
        description: 'Link de registro para atléticas copiado para a área de transferência.',
        variant: 'success'
      })
    } catch (err) {
      console.warn('Erro ao copiar link', err)
      toast({
        title: 'Erro ao copiar link',
        description: 'Não foi possível copiar o link para a área de transferência.',
        variant: 'destructive'
      })
    }
    document.body.removeChild(textArea)
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
        <div className='flex justify-between items-center'>
          <div>
            <h1 className='text-3xl font-bold'>Atléticas</h1>
            <p className='text-gray-500'>Visualize as atléticas participantes do campeonato.</p>
          </div>
          {userRole === 'admin' && (
            <div className='ml-auto'>
              <Button
                onClick={() => setIsLinkDialogOpen(true)}
                className='flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600'
              >
                <Copy className='h-4 w-4' />
                Gerar Link de Registro
              </Button>
            </div>
          )}
        </div>

        <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
          <DialogContent className='bg-white'>
            <DialogHeader>
              <DialogTitle>Link de Registro de Atlética</DialogTitle>
              <DialogDescription>
                Copie o link abaixo para compartilhar com a atlética que deseja cadastrar.
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4 py-4'>
              <div className='space-y-2'>
                <Label>Link de Registro</Label>
                <div className='flex items-center'>
                  <Input value={`${window.location.origin}/register?type=athletic`} readOnly className='pr-10' />
                  <Button
                    variant='ghost'
                    size='icon'
                    className='ml-[-40px]'
                    onClick={() => copyToClipboard(`${window.location.origin}/register?type=athletic`)}
                  >
                    <Copy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant='outline' onClick={() => setIsLinkDialogOpen(false)}>
                Fechar
              </Button>
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

                  {athletic.statute_url && (
                    <div className='space-y-2'>
                      <Label>Estatuto da Atlética</Label>
                      <div>
                        <Button variant='outline' asChild>
                          <a href={athletic.statute_url} target='_blank' rel='noopener noreferrer'>
                            Ver Documento
                          </a>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* <div className="space-y-2">
                  <Label>Link de Referência para Atletas</Label>
                  <div className="flex items-center">
                    <Input
                      value={`${window.location.origin}/register?type=athletic&athletic=${athletic.id}`}
                      readOnly
                      className="pr-10"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-[-40px]"
                      onClick={() => {
                        if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
                          navigator.clipboard.writeText(`${window.location.origin}/register?type=athletic&athletic=${athletic.id}`)
                          toast({
                            title: "Link copiado",
                            description: "Link de referência para atlética copiado para a área de transferência.",
                          })
                        } else {
                          console.warn("Clipboard API não suportada ou indisponível")
                          toast({
                            title: "Erro ao copiar link",
                            description: "A API de área de transferência não é suportada ou está indisponível neste navegador.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Compartilhe este link para cadastro de novos membros da atlética.
                  </p>
                </div> */}

                  <div className='space-y-2'>
                    <Label>Link de Referência para Atléticas</Label>
                    <div className='flex items-center'>
                      <Input
                        value={`${window.location.origin}/register?type=athlete&athletic=${athletic.id}`}
                        readOnly
                        className='pr-10'
                      />
                      <Button
                        variant='ghost'
                        size='icon'
                        className='ml-[-40px]'
                        onClick={() => {
                          if (
                            typeof navigator !== 'undefined' &&
                            navigator.clipboard &&
                            navigator.clipboard.writeText
                          ) {
                            navigator.clipboard.writeText(
                              `${window.location.origin}/register?type=athlete&athletic=${athletic.id}`
                            )
                            toast({
                              title: 'Link copiado',
                              description: 'Link de referência para atlética copiado para a área de transferência.',
                              variant: 'success'
                            })
                          } else {
                            console.warn('Clipboard API não suportada ou indisponível')
                            toast({
                              title: 'Erro ao copiar link',
                              description:
                                'A API de área de transferência não é suportada ou está indisponível neste navegador.',
                              variant: 'destructive'
                            })
                          }
                        }}
                      >
                        <Copy className='h-4 w-4' />
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
