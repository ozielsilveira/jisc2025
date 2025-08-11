'use client'

import type React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Shield,
  User,
  Mail,
  Phone,
  CreditCard,
  Users
} from 'lucide-react'

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
  const strength = score <= 2 ? 'weak' : score <= 3 ? 'medium' : 'strong'

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
    <div className='space-y-3 mt-2'>
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
      <Progress value={(score / 5) * 100} className='h-2' />
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

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const defaultType = searchParams.get('type') || 'buyer'
  const restricted = searchParams.get('restricted') === 'true'
  const athleticReferral = searchParams.get('athletic')

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    phone: '',
    role: defaultType as 'buyer' | 'athlete' | 'athletic',
    athletic_id: athleticReferral || '',
    package_id: ''
  })

  const [athletics, setAthletics] = useState<Array<{ id: string; name: string; university: string }>>([])
  const [packages, setPackages] = useState<
    Array<{ id: string; name: string; description: string; price: number; category: 'games' | 'party' | 'combined' }>
  >([])
  const [selectedPackage, setSelectedPackage] = useState<{ category: 'games' | 'party' | 'combined' } | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  // Fetch athletics and packages on component mount
  useEffect(() => {
    const fetchData = async () => {
      // Não busca dados se o usuário for do tipo athletic
      if (formData.role === 'athletic') return

      try {
        // Fetch athletics
        const { data: athleticsData, error: athleticsError } = await supabase
          .from('athletics')
          .select('id, name, university')
          .order('name')

        if (athleticsError) throw athleticsError
        setAthletics(athleticsData || [])

        // Fetch packages
        const { data: packagesData, error: packagesError } = await supabase
          .from('packages')
          .select('id, name, description, price, category')
          .order('price')

        if (packagesError) throw packagesError
        setPackages(packagesData || [])
      } catch (error) {
        console.warn('Error fetching data:', error)
        toast({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar as atléticas e pacotes.',
          variant: 'destructive'
        })
      }
    }

    fetchData()
  }, [toast, formData.role])

  // Atualizar o role e athletic_id quando os parâmetros mudam
  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      role: defaultType as 'buyer' | 'athlete' | 'athletic',
      athletic_id: athleticReferral || prev.athletic_id
    }))
  }, [defaultType, athleticReferral])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (name === 'package_id') {
      const selectedPackage = packages.find((pkg) => pkg.id === value)
      setSelectedPackage(selectedPackage || null)
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  const validateForm = () => {
    // Validação de campos obrigatórios
    if (!formData.name.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, preencha o nome.',
        variant: 'destructive'
      })
      return false
    }

    if (!formData.email.trim()) {
      toast({
        title: 'Campo obrigatório',
        description: 'Por favor, preencha o e-mail.',
        variant: 'destructive'
      })
      return false
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast({
        title: 'E-mail inválido',
        description: 'Por favor, digite um e-mail válido.',
        variant: 'destructive'
      })
      return false
    }

    // Validação de senhas
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A confirmação de senha deve ser igual à senha.',
        variant: 'destructive'
      })
      return false
    }

    // Validação da força da senha (mais flexível)
    const { isValid } = validatePassword(formData.password)
    if (!isValid) {
      toast({
        title: 'Senha muito fraca',
        description: 'A senha deve atender pelo menos 4 dos 5 requisitos de segurança.',
        variant: 'destructive'
      })
      return false
    }

    if (formData.role !== 'athletic') {
      // Validação do CPF (formato e dígitos verificadores)
      const cpf = formData.cpf.replace(/[^\d]/g, '')
      if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
        toast({
          title: 'CPF inválido',
          description: 'O CPF deve conter 11 dígitos válidos.',
          variant: 'destructive'
        })
        return false
      }

      // Validação dos dígitos verificadores do CPF
      let sum = 0
      let remainder
      for (let i = 1; i <= 9; i++) {
        sum += Number.parseInt(cpf.substring(i - 1, i)) * (11 - i)
      }
      remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) {
        remainder = 0
      }
      if (remainder !== Number.parseInt(cpf.substring(9, 10))) {
        toast({
          title: 'CPF inválido',
          description: 'O CPF informado não é válido. Verifique os dígitos.',
          variant: 'destructive'
        })
        return false
      }

      sum = 0
      for (let i = 1; i <= 10; i++) {
        sum += Number.parseInt(cpf.substring(i - 1, i)) * (12 - i)
      }
      remainder = (sum * 10) % 11
      if (remainder === 10 || remainder === 11) {
        remainder = 0
      }
      if (remainder !== Number.parseInt(cpf.substring(10, 11))) {
        toast({
          title: 'CPF inválido',
          description: 'O CPF informado não é válido. Verifique os dígitos.',
          variant: 'destructive'
        })
        return false
      }
    }

    // Validação de telefone
    const phone = formData.phone.replace(/\D/g, '')
    if (phone.length < 10 || phone.length > 11) {
      toast({
        title: 'Telefone inválido',
        description: 'Por favor, digite um telefone válido.',
        variant: 'destructive'
      })
      return false
    }

    // Validação de seleção de atlética e pacote
    if ((formData.role === 'athlete' || formData.role === 'buyer') && !formData.athletic_id) {
      toast({
        title: 'Atlética obrigatória',
        description: 'Por favor, selecione sua atlética.',
        variant: 'destructive'
      })
      return false
    }

    if (formData.role !== 'athletic' && !formData.package_id) {
      toast({
        title: 'Pacote obrigatório',
        description: 'Por favor, selecione um pacote.',
        variant: 'destructive'
      })
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)

    try {
      // First, check if user already exists in auth
      const { data: existingAuth } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (existingAuth.user) {
        toast({
          title: 'Usuário já existe',
          description: 'Este e-mail já está cadastrado. Por favor, faça login.',
          variant: 'destructive'
        })
        router.push('/login')
        return
      }

      // Create new user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: formData.role
          }
        }
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Falha ao criar usuário')

      // Create user profile in users table
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email,
        name: formData.name,
        cpf: formData.cpf,
        phone: formData.phone,
        role: formData.role,
        gender: null // Default value, can be updated later
      })

      if (userError) {
        // If there's an error creating the user profile, we should delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw new Error(`Erro ao criar perfil de usuário: ${userError.message}`)
      }

      // If user is an athletic representative, create pre-registration in athletics table
      if (formData.role === 'athletic') {
        const { error: athleticError } = await supabase.from('athletics').insert({
          id: authData.user.id,
          name: formData.name,
          university: '',
          logo_url: '',
          status: 'pending',
          representative_id: authData.user.id
        })

        if (athleticError) {
          throw new Error(`Erro ao criar pré-registro da atlética: ${athleticError.message}`)
        }

        toast({
          title: '🎉 Cadastro realizado com sucesso!',
          description: 'Complete o cadastro da sua atlética nas configurações após fazer login.'
        })
        router.push('/login')
        return
      }

      // If user is an athlete, create athlete record
      if (formData.role === 'athlete') {
        const { data: athleteData, error: athleteError } = await supabase.from('athletes').insert({
          user_id: authData.user.id,
          athletic_id: formData.athletic_id,
          enrollment_document_url: '',
          status: 'pending',
          id: authData.user.id
        })

        if (athleteError) {
          throw new Error(`Erro ao criar perfil de atleta: ${athleteError.message}`)
        }

        // Create athlete package record if a package was selected
        if (formData.package_id) {
          const { error: packageError } = await supabase.from('athlete_packages').insert({
            athlete_id: authData.user.id,
            package_id: formData.package_id,
            payment_status: 'pending'
          })

          if (packageError) {
            throw new Error(`Erro ao criar pacote: ${packageError.message}`)
          }
        }
      }

      toast({
        title: '🎉 Cadastro realizado com sucesso!',
        description:
          selectedPackage?.category === 'games' || selectedPackage?.category === 'combined'
            ? 'Sua solicitação será analisada pela atlética antes de prosseguir com o pagamento.'
            : 'Você pode fazer login agora.'
      })
      router.push('/login')
    } catch (error) {
      console.warn('Error signing up:', error)
      if (error instanceof Error) {
        if (error.message.includes('User already registered')) {
          toast({
            title: 'Usuário já cadastrado',
            description: 'Este e-mail já está em uso. Por favor, tente fazer login ou use um e-mail diferente.',
            variant: 'destructive'
          })
        } else if (error.message.includes('violates unique constraint')) {
          toast({
            title: 'CPF já cadastrado',
            description: 'O CPF informado já está associado a outra conta.',
            variant: 'destructive'
          })
        } else {
          toast({
            title: 'Erro ao criar conta',
            description: error.message || 'Ocorreu um erro inesperado. Por favor, tente novamente.',
            variant: 'destructive'
          })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'athlete':
        return <User className='h-4 w-4' />
      case 'athletic':
        return <Users className='h-4 w-4' />
      default:
        return <CreditCard className='h-4 w-4' />
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'athlete':
        return 'Participe das competições esportivas'
      case 'athletic':
        return 'Gerencie sua atlética e atletas'
      default:
        return 'Compre ingressos para os eventos'
    }
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12 sm:px-6 lg:px-8'>
      <Card className='w-full max-w-lg shadow-xl border-0'>
        <CardHeader className='space-y-4 text-center'>
          <div className='flex justify-center mb-4'>
            <div className='w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg'>
              <Image src='/logo.svg' alt='JISC Logo' width={40} height={40} className='filter brightness-0 invert' />
            </div>
          </div>
          <div>
            <CardTitle className='text-3xl font-bold text-gray-900 mb-2'>
              {formData.role === 'athletic' ? 'Cadastro de Atlética' : 'Criar Conta'}
            </CardTitle>
            <CardDescription className='text-gray-600 text-base'>
              {formData.role === 'athletic'
                ? 'Preencha os dados para cadastrar sua atlética'
                : restricted
                  ? 'Cadastre-se como comprador de ingressos'
                  : 'Junte-se ao maior campeonato universitário'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className='space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Nome */}
            <div className='space-y-2'>
              <Label htmlFor='name' className='text-sm font-semibold text-gray-700'>
                {formData.role === 'athletic' ? 'Nome da Atlética' : 'Nome Completo'}
              </Label>
              <div className='relative'>
                <User className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='name'
                  name='name'
                  type='text'
                  placeholder={formData.role === 'athletic' ? 'Nome da sua atlética' : 'Seu nome completo'}
                  value={formData.name}
                  onChange={handleChange}
                  className='pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className='space-y-2'>
              <Label htmlFor='email' className='text-sm font-semibold text-gray-700'>
                E-mail
              </Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='email'
                  name='email'
                  type='email'
                  placeholder='seu@email.com'
                  value={formData.email}
                  onChange={handleChange}
                  className='pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
              </div>
            </div>

            {/* CPF - apenas para não-atléticas */}
            {formData.role !== 'athletic' && (
              <div className='space-y-2'>
                <Label htmlFor='cpf' className='text-sm font-semibold text-gray-700'>
                  CPF
                </Label>
                <Input
                  id='cpf'
                  name='cpf'
                  type='text'
                  placeholder='000.000.000-00'
                  value={formatCPF(formData.cpf)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, cpf: e.target.value }))}
                  className='h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  maxLength={14}
                  required
                />
              </div>
            )}

            {/* Telefone */}
            <div className='space-y-2'>
              <Label htmlFor='phone' className='text-sm font-semibold text-gray-700'>
                Telefone
              </Label>
              <div className='relative'>
                <Phone className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='phone'
                  name='phone'
                  type='tel'
                  placeholder='(00) 00000-0000'
                  value={formatPhone(formData.phone)}
                  onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                  className='pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  maxLength={15}
                  required
                />
              </div>
            </div>

            {/* Tipo de cadastro */}
            {!restricted && !searchParams.get('type') && (
              <div className='space-y-3'>
                <Label className='text-sm font-semibold text-gray-700'>Tipo de Cadastro</Label>
                <RadioGroup
                  value={formData.role}
                  onValueChange={(value) => handleSelectChange('role', value)}
                  className='space-y-3'
                >
                  {['buyer', 'athlete', 'athletic'].map((role) => (
                    <div
                      key={role}
                      className='flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors'
                    >
                      <RadioGroupItem value={role} id={role} />
                      <div className='flex items-center space-x-2 flex-1'>
                        {getRoleIcon(role)}
                        <div>
                          <Label htmlFor={role} className='font-medium cursor-pointer'>
                            {role === 'buyer'
                              ? 'Comprador de Ingressos'
                              : role === 'athlete'
                                ? 'Atleta'
                                : 'Representante de Atlética'}
                          </Label>
                          <p className='text-xs text-gray-500'>{getRoleDescription(role)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Atlética */}
            {(formData.role === 'athlete' || formData.role === 'buyer') && (
              <div className='space-y-2'>
                <Label htmlFor='athletic' className='text-sm font-semibold text-gray-700'>
                  Atlética
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange('athletic_id', value)}
                  value={formData.athletic_id || undefined}
                  disabled={!!athleticReferral}
                >
                  <SelectTrigger
                    id='athletic'
                    className='h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  >
                    <SelectValue placeholder='Selecione sua atlética' />
                  </SelectTrigger>
                  <SelectContent>
                    {athletics.map((athletic) => (
                      <SelectItem key={athletic.id} value={athletic.id}>
                        {athletic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {athleticReferral && (
                  <div className='bg-green-50 border border-green-200 rounded-lg p-3'>
                    <p className='text-sm text-green-700 font-medium'>
                      ✅ Você está se cadastrando para: {athletics.find((a) => a.id === athleticReferral)?.name}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Pacote */}
            {formData.role !== 'athletic' && (
              <div className='space-y-2'>
                <Label htmlFor='package' className='text-sm font-semibold text-gray-700'>
                  Pacote
                </Label>
                <Select
                  onValueChange={(value) => handleSelectChange('package_id', value)}
                  value={formData.package_id || undefined}
                >
                  <SelectTrigger
                    id='package'
                    className='h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  >
                    <SelectValue placeholder='Selecione um pacote' />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        <div className='flex justify-between items-center w-full'>
                          <span>{pkg.name}</span>
                          <span className='font-bold text-blue-600 ml-2'>R$ {pkg.price.toFixed(2)}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPackage &&
                  (selectedPackage.category === 'games' || selectedPackage.category === 'combined') && (
                    <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                      <div className='flex items-start space-x-2'>
                        <AlertCircle className='h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0' />
                        <p className='text-sm text-yellow-700 font-medium'>
                          Este pacote requer aprovação da atlética antes do pagamento.
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Senha */}
            <div className='space-y-2'>
              <Label htmlFor='password' className='text-sm font-semibold text-gray-700'>
                Senha
              </Label>
              <div className='relative'>
                <Shield className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  className='pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
              {(passwordFocused || formData.password) && <PasswordStrengthIndicator password={formData.password} />}
            </div>

            {/* Confirmar Senha */}
            <div className='space-y-2'>
              <Label htmlFor='confirmPassword' className='text-sm font-semibold text-gray-700'>
                Confirmar Senha
              </Label>
              <div className='relative'>
                <Shield className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className='pl-10 pr-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showConfirmPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
                </button>
              </div>
              {formData.confirmPassword && (
                <div className='flex items-center space-x-2 mt-2'>
                  {formData.password === formData.confirmPassword ? (
                    <>
                      <CheckCircle className='h-4 w-4 text-green-500' />
                      <span className='text-sm text-green-600 font-medium'>Senhas coincidem</span>
                    </>
                  ) : (
                    <>
                      <XCircle className='h-4 w-4 text-red-500' />
                      <span className='text-sm text-red-600 font-medium'>Senhas não coincidem</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botão de Submit */}
            <Button
              type='submit'
              className='w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-semibold text-lg shadow-lg transition-all duration-200'
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-5 w-5 mr-2 animate-spin' />
                  Cadastrando...
                </>
              ) : (
                'Criar Conta'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className='text-center'>
          <div className='text-sm text-gray-600'>
            Já tem uma conta?{' '}
            <Link href='/login' className='text-blue-600 hover:text-blue-500 font-semibold transition-colors'>
              Faça login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
