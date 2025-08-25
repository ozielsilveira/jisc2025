'use client'

import type React from 'react'
import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { FileUp } from 'lucide-react'
import { useUserRole } from '@/hooks/use-user-role'
import { uploadFileToR2 } from '@/actions/upload'

type AthleticData = {
  id: string
  statute_url: string | null
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { role, isLoading: roleIsLoading } = useUserRole(user?.id)
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [athleticData, setAthleticData] = useState<AthleticData | null>(null)

  useEffect(() => {
    const fetchAthleticData = async () => {
      if (!user || role !== 'athletic') {
        setIsLoading(false)
        return
      }

      try {
        const { data: athletic, error: athleticError } = await supabase
          .from('athletics')
          .select('id, statute_url')
          .eq('representative_id', user.id)
          .single()

        if (athleticError) {
          throw athleticError
        }
        setAthleticData(athletic)
      } catch (error) {
        console.warn("Could not fetch athletic's data:", error)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os dados da sua atlética.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (!roleIsLoading) {
      fetchAthleticData()
    }
  }, [user, role, roleIsLoading, toast])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      // Simple validation for file type and size
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast({ title: 'Tipo de arquivo inválido', description: 'Por favor, envie um PDF ou DOC/DOCX.', variant: 'destructive' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({ title: 'Arquivo muito grande', description: 'O tamanho máximo permitido é 10MB.', variant: 'destructive' });
        return;
      }
      setSelectedFile(file)
    } else {
      setSelectedFile(null)
    }
  }

  const handleStatuteUpload = async () => {
    if (!selectedFile || !user || !athleticData) {
      toast({
        title: 'Seleção de arquivo necessária',
        description: 'Por favor, selecione um arquivo para enviar.',
        variant: 'destructive'
      })
      return
    }

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const result = await uploadFileToR2(formData, user.id, 'document', athleticData.statute_url || undefined)

      if (result.success && result.url) {
        const { error: updateError } = await supabase
          .from('athletics')
          .update({ statute_url: result.url })
          .eq('id', athleticData.id)

        if (updateError) throw updateError

        setAthleticData((prev) => ({ ...prev!, statute_url: result.url }))
        toast({
          title: 'Upload Concluído',
          description: 'Seu estatuto foi enviado com sucesso.',
          variant: 'success'
        })
        setSelectedFile(null)
        // Clear file input visually
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if(fileInput) fileInput.value = '';

      } else {
        throw new Error(result.message || 'Falha no upload do arquivo.')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      toast({
        title: 'Erro no Upload',
        description: error.message || 'Não foi possível enviar o seu estatuto.',
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading || roleIsLoading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#0456FC]'></div>
      </div>
    )
  }

  return (
    <div className='min-h-full px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8'>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>Configurações</h1>
          <p className='text-gray-500 dark:text-gray-400'>
            {role === 'athletic'
              ? 'Gerencie os documentos da sua atlética.'
              : 'Não há configurações disponíveis para o seu tipo de usuário.'}
          </p>
        </div>

        {role === 'athletic' && athleticData && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos da Atlética</CardTitle>
              <CardDescription>
                Faça o upload e gerencie o estatuto da sua atlética. Este documento é obrigatório.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='statute'>Estatuto da Atlética</Label>
                {athleticData.statute_url ? (
                  <div className='flex items-center space-x-4'>
                    <p className='text-sm text-muted-foreground'>Estatuto enviado.</p>
                    <Button variant='outline' size='sm' asChild>
                      <a href={athleticData.statute_url} target='_blank' rel='noopener noreferrer'>
                        Ver Documento
                      </a>
                    </Button>
                  </div>
                ) : (
                  <p className='text-sm text-destructive'>Nenhum estatuto enviado.</p>
                )}
              </div>
              <div className='space-y-2'>
                <Label htmlFor='file-upload'>
                  {athleticData.statute_url ? 'Substituir Estatuto' : 'Enviar Estatuto'}
                </Label>
                <Input id='file-upload' type='file' onChange={handleFileChange} accept='.pdf,.doc,.docx' />
                <p className='text-xs text-muted-foreground'>
                  Tipos de arquivo permitidos: PDF, DOC, DOCX. Tamanho máximo: 10MB.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleStatuteUpload} disabled={isUploading || !selectedFile}>
                <FileUp className='h-4 w-4 mr-2' />
                {isUploading ? 'Enviando...' : 'Enviar Documento'}
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  )
}
