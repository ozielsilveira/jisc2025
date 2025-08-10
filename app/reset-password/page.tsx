'use client'

import type React from 'react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Shield, ArrowLeft } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

// Password validation utilities
const validatePassword = (password: string) => {
  const validations = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }

  const score = Object.values(validations).filter(Boolean).length
  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'

  return { validations, score, strength, isValid: score >= 4 }
}

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const { validations, score, strength } = validatePassword(password)

  const strengthColors: Record<string, string> = {
    weak: 'bg-red-500',
    medium: 'bg-yellow-500',
    strong: 'bg-green-500'
  }

  const strengthLabels: Record<string, string> = {
    weak: 'Fraca',
    medium: 'Média',
    strong: 'Forte'
  }

  if (!password) return null

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between'>
        <span className='text-sm font-medium text-gray-700'>Força da senha:</span>
        <span
          className={`text-sm font-medium ${
            strength === 'weak' ? 'text-red-600' : strength === 'medium' ? 'text-yellow-600' : 'text-green-600'
          }`}
        >
          {strengthLabels[strength]}
        </span>
      </div>
      <Progress value={(score / 5) * 100} className={`h-2`} />
      <div className='space-y-1'>
        {[
          { key: 'minLength', label: 'Pelo menos 8 caracteres' },
          { key: 'hasUppercase', label: 'Uma letra maiúscula' },
          { key: 'hasLowercase', label: 'Uma letra minúscula' },
          { key: 'hasNumber', label: 'Um número' },
          { key: 'hasSpecialChar', label: 'Um caractere especial (!@#$%^&*)' }
        ].map(({ key, label }) => (
          <div key={key} className='flex items-center space-x-2'>
            {validations[key as keyof typeof validations] ? (
              <CheckCircle className='h-4 w-4 text-green-500' />
            ) : (
              <XCircle className='h-4 w-4 text-red-500' />
            )}
            <span
              className={`text-sm ${validations[key as keyof typeof validations] ? 'text-green-700' : 'text-gray-600'}`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [resetComplete, setResetComplete] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // Check if user has a valid session for password reset
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Error checking session:', error)
          setIsValidSession(false)
          return
        }

        // Check if this is a password recovery session
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')

        if (accessToken && refreshToken) {
          // Set the session from URL parameters
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (sessionError) {
            console.error('Error setting session:', sessionError)
            setIsValidSession(false)
          } else {
            setIsValidSession(true)
          }
        } else if (session) {
          setIsValidSession(true)
        } else {
          setIsValidSession(false)
        }
      } catch (error) {
        console.error('Unexpected error checking session:', error)
        setIsValidSession(false)
      }
    }

    checkSession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password.trim() || !confirmPassword.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos.',
        variant: 'destructive'
      })
      return
    }

    const { isValid } = validatePassword(password)
    if (!isValid) {
      toast({
        title: 'Senha muito fraca',
        description: 'A senha deve atender aos requisitos mínimos de segurança.',
        variant: 'destructive'
      })
      return
    }

    if (password !== confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A confirmação de senha deve ser igual à nova senha.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        console.error('Error updating password:', error)
        toast({
          title: 'Erro ao redefinir senha',
          description: error.message || 'Não foi possível redefinir sua senha. Tente novamente.',
          variant: 'destructive'
        })
      } else {
        setResetComplete(true)
        toast({
          title: 'Senha redefinida com sucesso!',
          description: 'Sua senha foi alterada. Você será redirecionado para o login.'
        })

        // Sign out user and redirect to login after a delay
        setTimeout(async () => {
          await supabase.auth.signOut()
          router.push('/login?message=password-reset-success')
        }, 3000)
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

  // Loading state while checking session
  if (isValidSession === null) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='flex flex-col items-center space-y-4'>
          <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
          <p className='text-gray-600'>Verificando link de redefinição...</p>
        </div>
      </div>
    )
  }

  // Invalid session - show error
  if (!isValidSession) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
            <div className='flex justify-center mb-4'>
              <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center'>
                <XCircle className='h-8 w-8 text-red-600' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-center'>Link inválido ou expirado</CardTitle>
            <CardDescription className='text-center'>
              O link de redefinição de senha é inválido ou já expirou.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
              <p className='text-sm text-red-800'>
                Links de redefinição de senha expiram em 1 hora por motivos de segurança.
              </p>
            </div>

            <div className='flex space-x-2'>
              <Button variant='outline' onClick={() => router.push('/forgot-password')} className='flex-1'>
                Solicitar novo link
              </Button>
              <Button onClick={() => router.push('/login')} className='flex-1'>
                Ir para login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success state
  if (resetComplete) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
        <Card className='w-full max-w-md'>
          <CardHeader className='space-y-1'>
            <div className='flex justify-center mb-4'>
              <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center'>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
            </div>
            <CardTitle className='text-2xl font-bold text-center'>Senha redefinida!</CardTitle>
            <CardDescription className='text-center'>
              Sua senha foi alterada com sucesso. Você será redirecionado para o login.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
              <p className='text-sm text-green-800'>
                Por segurança, você foi desconectado de todos os dispositivos. Faça login novamente com sua nova senha.
              </p>
            </div>

            <Button onClick={() => router.push('/login')} className='w-full bg-[#0456FC] hover:bg-[#0345D1]'>
              Ir para login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main reset password form
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <div className='flex justify-center mb-4'>
            <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center'>
              <Shield className='h-8 w-8 text-blue-600' />
            </div>
          </div>
          <CardTitle className='text-2xl font-bold text-center'>Redefinir senha</CardTitle>
          <CardDescription className='text-center'>
            Digite sua nova senha. Certifique-se de que seja segura e fácil de lembrar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='password'>Nova senha</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Digite sua nova senha'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className='pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute inset-y-0 right-0 flex items-center pr-3'
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-400' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-400' />
                  )}
                </button>
              </div>
            </div>

            {password && <PasswordStrengthIndicator password={password} />}

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirmar nova senha</Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirme sua nova senha'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className='pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute inset-y-0 right-0 flex items-center pr-3'
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4 text-gray-400' />
                  ) : (
                    <Eye className='h-4 w-4 text-gray-400' />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className='text-sm text-red-600 flex items-center space-x-1'>
                  <XCircle className='h-4 w-4' />
                  <span>As senhas não coincidem</span>
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className='text-sm text-green-600 flex items-center space-x-1'>
                  <CheckCircle className='h-4 w-4' />
                  <span>Senhas coincidem</span>
                </p>
              )}
            </div>

            <Button
              type='submit'
              className='w-full bg-[#0456FC] hover:bg-[#0345D1]'
              disabled={isLoading || !validatePassword(password).isValid || password !== confirmPassword}
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Redefinindo senha...
                </>
              ) : (
                'Redefinir senha'
              )}
            </Button>
          </form>

          <div className='mt-4 text-center text-sm'>
            <Link
              href='/login'
              className='text-blue-600 hover:text-blue-500 font-medium flex items-center justify-center space-x-1'
            >
              <ArrowLeft className='h-4 w-4' />
              <span>Voltar ao login</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
