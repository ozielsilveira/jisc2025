'use client'

import type React from 'react'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Mail, ArrowLeft, Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, digite seu e-mail.',
        variant: 'destructive'
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Por favor, digite um e-mail válido.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('Error sending password reset email:', error)
        toast({
          title: 'Erro ao enviar e-mail',
          description: 'Não foi possível enviar o e-mail de redefinição. Tente novamente em alguns minutos.',
          variant: 'destructive'
        })
      } else {
        setEmailSent(true)
        toast({
          title: 'E-mail enviado com sucesso!',
          description: 'Verifique sua caixa de entrada e spam para o link de redefinição de senha.'
        })
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast({
        title: 'Erro inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setEmailSent(false)
    await handleSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  if (emailSent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
            <div className='flex justify-center mb-4'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                <Mail className='h-8 w-8 text-green-600' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-center'>E-mail enviado!</CardTitle>
            <CardDescription className='text-center'>
              Enviamos um link de redefinição de senha para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h4 className='font-medium text-blue-900 mb-2'>Próximos passos:</h4>
              <ol className='text-sm text-blue-800 space-y-1 list-decimal list-inside'>
                <li>Verifique sua caixa de entrada</li>
                <li>Clique no link no e-mail</li>
                <li>Defina sua nova senha</li>
              </ol>
            </div>

            <div className='text-center text-sm text-gray-600'>
              Não recebeu o e-mail? Verifique sua pasta de spam ou{' '}
              <button
                onClick={handleResendEmail}
                className='text-blue-600 hover:text-blue-500 font-medium'
                disabled={isLoading}
              >
                reenvie o link
              </button>
            </div>

            <div className='flex space-x-2'>
              <Button variant='outline' onClick={() => router.push('/login')} className='flex-1'>
                <ArrowLeft className='h-4 w-4 mr-2' />
                Voltar ao login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <div className='flex justify-center mb-4'>
            <Image src='/logo.svg' alt='JISC Logo' width={80} height={80} className='object-contain' />
          </div>
          <CardTitle className='text-2xl font-bold text-center'>Esqueceu sua senha?</CardTitle>
          <CardDescription className='text-center'>
            Digite seu e-mail para receber um link de redefinição de senha.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>E-mail</Label>
              <Input
                id='email'
                type='email'
                placeholder='seu@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className='transition-colors'
              />
            </div>
            <Button
              type='submit'
              className='w-full bg-[#0456FC] hover:bg-[#0345D1]'
              disabled={isLoading || !email.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Enviando...
                </>
              ) : (
                'Enviar link de redefinição'
              )}
            </Button>
          </form>
          <div className='mt-4 text-center text-sm'>
            Lembrou sua senha?{' '}
            <Link href='/login' className='text-blue-600 hover:text-blue-500 font-medium'>
              Faça login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
